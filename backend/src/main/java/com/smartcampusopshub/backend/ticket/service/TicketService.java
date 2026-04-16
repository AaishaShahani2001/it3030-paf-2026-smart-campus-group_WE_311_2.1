package com.smartcampusopshub.backend.ticket.service;

import com.smartcampusopshub.backend.auth.model.User;
import com.smartcampusopshub.backend.auth.model.Role;
import com.smartcampusopshub.backend.auth.repository.UserRepository;
import com.smartcampusopshub.backend.common.exception.BadRequestException;
import com.smartcampusopshub.backend.common.exception.ResourceNotFoundException;
import com.smartcampusopshub.backend.ticket.dto.AssignTicketRequestDto;
import com.smartcampusopshub.backend.ticket.dto.AddTicketCommentRequestDto;
import com.smartcampusopshub.backend.ticket.dto.CreateTicketRequestDto;
import com.smartcampusopshub.backend.ticket.dto.UpdateTicketStatusRequestDto;
import com.smartcampusopshub.backend.ticket.dto.TicketCommentResponseDto;
import com.smartcampusopshub.backend.ticket.dto.TicketResponseDto;
import com.smartcampusopshub.backend.ticket.entity.TicketAttachment;
import com.smartcampusopshub.backend.ticket.entity.TicketComment;
import com.smartcampusopshub.backend.ticket.entity.Ticket;
import com.smartcampusopshub.backend.ticket.mapper.TicketMapper;
import com.smartcampusopshub.backend.ticket.repository.TicketAttachmentRepository;
import com.smartcampusopshub.backend.ticket.repository.TicketCommentRepository;
import com.smartcampusopshub.backend.ticket.repository.TicketRepository;
import com.smartcampusopshub.backend.ticket.enums.TicketStatus;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.net.MalformedURLException;
import java.nio.file.Path;
import java.util.List;
import java.util.UUID;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class TicketService {

    private final TicketRepository ticketRepository;
    private final TicketAttachmentRepository ticketAttachmentRepository;
    private final TicketCommentRepository ticketCommentRepository;
    private final UserRepository userRepository;
    private final FileStorageService fileStorageService;

    @Transactional(readOnly = true)
    public Page<TicketResponseDto> getAllTickets(int page, int size, UUID assigneeId, String reporterEmail) {
        Pageable pageable = PageRequest.of(Math.max(page, 0), Math.max(size, 1));
        if (assigneeId != null) {
            return ticketRepository.findByAssignee_Id(assigneeId, pageable).map(TicketMapper::toResponseDto);
        }
        if (StringUtils.hasText(reporterEmail)) {
            return ticketRepository.findByReporter_Email(reporterEmail.trim(), pageable).map(TicketMapper::toResponseDto);
        }
        return ticketRepository.findAll(pageable).map(TicketMapper::toResponseDto);
    }

    @Transactional(readOnly = true)
    public TicketResponseDto getTicketById(UUID ticketId) {
        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new ResourceNotFoundException("Ticket", "id", ticketId));
        return TicketMapper.toResponseDto(ticket);
    }

    @Transactional(readOnly = true)
    public Page<TicketCommentResponseDto> getTicketComments(UUID ticketId, int page, int size) {
        if (!ticketRepository.existsById(ticketId)) {
            throw new ResourceNotFoundException("Ticket", "id", ticketId);
        }

        Pageable pageable = PageRequest.of(
                Math.max(page, 0),
                Math.max(size, 1),
                Sort.by(Sort.Direction.ASC, "createdAt")
        );

        return ticketCommentRepository.findByTicket_Id(ticketId, pageable)
                .map(comment -> TicketCommentResponseDto.builder()
                        .id(comment.getId())
                        .authorId(comment.getAuthor() != null ? comment.getAuthor().getId() : null)
                        .authorName(comment.getAuthor() != null
                                ? (comment.getAuthor().getUsername() != null ? comment.getAuthor().getUsername() : comment.getAuthor().getName())
                                : "System")
                        .content(comment.getContent())
                        .commentType(inferCommentType(comment.getContent()))
                        .createdAt(comment.getCreatedAt())
                        .build());
    }

    @Transactional
    public TicketResponseDto assignTicket(UUID ticketId, AssignTicketRequestDto request) {
        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new ResourceNotFoundException("Ticket", "id", ticketId));

        User assignee = userRepository.findById(request.getAssigneeId())
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", request.getAssigneeId()));

        if (assignee.getRole() != Role.TECHNICIAN) {
            throw new BadRequestException("Assigned user must have TECHNICIAN role");
        }

        ticket.setAssignee(assignee);
        // Re-open rejected tickets when reassigned by admin.
        if (ticket.getStatus() == TicketStatus.REJECTED) {
            ticket.setStatus(TicketStatus.OPEN);
            ticket.setRejectionReason(null);
            addCommentInternal(ticket, assignee, "Ticket reassigned and reopened.");
        }
        Ticket saved = ticketRepository.save(ticket);
        return TicketMapper.toResponseDto(saved);
    }

    @Transactional
    public TicketResponseDto updateTicketStatus(UUID ticketId, UpdateTicketStatusRequestDto request, String actorUsername) {
        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new ResourceNotFoundException("Ticket", "id", ticketId));
        User actor = getActor(actorUsername);

        TicketStatus next = request.getStatus();
        ticket.setStatus(next);

        if (next == TicketStatus.IN_PROGRESS && ticket.getFirstResponseAt() == null) {
            ticket.setFirstResponseAt(LocalDateTime.now());
            addCommentInternal(ticket, actor, "Technician started assessment.");
        }

        if (next == TicketStatus.RESOLVED) {
            if (!StringUtils.hasText(request.getResolutionNotes())) {
                throw new BadRequestException("Resolution notes are required for RESOLVED status");
            }
            ticket.setResolutionNotes(request.getResolutionNotes().trim());
            ticket.setResolvedAt(LocalDateTime.now());
            ticket.setRejectionReason(null);
            addCommentInternal(ticket, actor, "Resolved: " + request.getResolutionNotes().trim());
        } else if (next == TicketStatus.REJECTED) {
            if (!StringUtils.hasText(request.getReason())) {
                throw new BadRequestException("Rejection reason is required for REJECTED status");
            }
            ticket.setRejectionReason(request.getReason().trim());
            ticket.setResolvedAt(null);
            addCommentInternal(ticket, actor, "Rejected: " + request.getReason().trim());
        }

        Ticket saved = ticketRepository.save(ticket);
        return TicketMapper.toResponseDto(saved);
    }

    @Transactional
    public TicketCommentResponseDto addComment(UUID ticketId, AddTicketCommentRequestDto request, String actorUsername) {
        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new ResourceNotFoundException("Ticket", "id", ticketId));
        User actor = getActor(actorUsername);
        TicketComment saved = addCommentInternal(ticket, actor, request.getContent().trim());
        return TicketCommentResponseDto.builder()
                .id(saved.getId())
                .authorId(actor.getId())
                .authorName(actor.getUsername() != null ? actor.getUsername() : actor.getName())
                .content(saved.getContent())
                .commentType(inferCommentType(saved.getContent()))
                .createdAt(saved.getCreatedAt())
                .build();
    }

    @Transactional(readOnly = true)
    public Resource loadAttachment(UUID attachmentId) {
        TicketAttachment attachment = ticketAttachmentRepository.findById(attachmentId)
                .orElseThrow(() -> new ResourceNotFoundException("TicketAttachment", "id", attachmentId));
        try {
            Path filePath = Path.of(attachment.getFilePath()).toAbsolutePath().normalize();
            Resource resource = new UrlResource(filePath.toUri());
            if (!resource.exists() || !resource.isReadable()) {
                throw new ResourceNotFoundException("Attachment file not found for id: " + attachmentId);
            }
            return resource;
        } catch (MalformedURLException ex) {
            throw new BadRequestException("Invalid attachment file path for id: " + attachmentId);
        }
    }

    @Transactional
    public TicketResponseDto createTicket(CreateTicketRequestDto request, List<MultipartFile> attachments) {
        User reporter = userRepository.findByEmail(request.getReporterEmail())
                .orElseThrow(() -> new BadRequestException("Reporter user not found for email: " + request.getReporterEmail()));

        Ticket ticket = Ticket.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .category(request.getCategory())
                .priority(request.getPriority())
                .location(request.getLocation())
                .contactPhone(request.getContactPhone())
                .contactEmail(StringUtils.hasText(request.getContactEmail()) ? request.getContactEmail() : reporter.getEmail())
                .reporter(reporter)
                .build();

        Ticket savedTicket = ticketRepository.save(ticket);

        if (attachments != null && !attachments.isEmpty()) {
            for (MultipartFile attachment : attachments) {
                if (attachment == null || attachment.isEmpty()) {
                    continue;
                }
                String storedPath = fileStorageService.storeTicketAttachment(attachment);
                TicketAttachment ticketAttachment = TicketAttachment.builder()
                        .ticket(savedTicket)
                        .fileName(attachment.getOriginalFilename() == null ? "attachment" : attachment.getOriginalFilename())
                        .filePath(storedPath)
                        .fileType(StringUtils.hasText(attachment.getContentType()) ? attachment.getContentType() : "application/octet-stream")
                        .fileSize(attachment.getSize())
                        .build();
                ticketAttachmentRepository.save(ticketAttachment);
            }
        }

        return TicketMapper.toResponseDto(savedTicket);
    }

    private User getActor(String actorUsername) {
        if (!StringUtils.hasText(actorUsername)) {
            throw new BadRequestException("Unable to identify authenticated user");
        }
        return userRepository.findByUsername(actorUsername)
                .orElseThrow(() -> new ResourceNotFoundException("User", "username", actorUsername));
    }

    private TicketComment addCommentInternal(Ticket ticket, User actor, String content) {
        TicketComment comment = TicketComment.builder()
                .ticket(ticket)
                .author(actor)
                .content(content)
                .build();
        return ticketCommentRepository.save(comment);
    }

    private com.smartcampusopshub.backend.ticket.enums.TicketCommentType inferCommentType(String content) {
        String value = content == null ? "" : content.toLowerCase();
        if (value.startsWith("rejected:")) return com.smartcampusopshub.backend.ticket.enums.TicketCommentType.REJECTION;
        if (value.startsWith("resolved:")) return com.smartcampusopshub.backend.ticket.enums.TicketCommentType.RESOLUTION;
        if (value.contains("reassigned") || value.contains("started assessment")) {
            return com.smartcampusopshub.backend.ticket.enums.TicketCommentType.STATUS_CHANGE;
        }
        return com.smartcampusopshub.backend.ticket.enums.TicketCommentType.NOTE;
    }
}
