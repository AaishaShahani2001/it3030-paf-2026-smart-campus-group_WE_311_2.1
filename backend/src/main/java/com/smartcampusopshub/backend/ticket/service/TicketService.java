package com.smartcampusopshub.backend.ticket.service;

import com.smartcampusopshub.backend.auth.model.User;
import com.smartcampusopshub.backend.auth.repository.UserRepository;
import com.smartcampusopshub.backend.common.exception.BadRequestException;
import com.smartcampusopshub.backend.ticket.dto.CreateTicketRequestDto;
import com.smartcampusopshub.backend.ticket.dto.TicketResponseDto;
import com.smartcampusopshub.backend.ticket.entity.TicketAttachment;
import com.smartcampusopshub.backend.ticket.entity.Ticket;
import com.smartcampusopshub.backend.ticket.mapper.TicketMapper;
import com.smartcampusopshub.backend.ticket.repository.TicketAttachmentRepository;
import com.smartcampusopshub.backend.ticket.repository.TicketRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@Service
@RequiredArgsConstructor
public class TicketService {

    private final TicketRepository ticketRepository;
    private final TicketAttachmentRepository ticketAttachmentRepository;
    private final UserRepository userRepository;
    private final FileStorageService fileStorageService;

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
}
