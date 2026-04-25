package com.smartcampusopshub.backend.ticket.mapper;

import com.smartcampusopshub.backend.ticket.dto.TicketAssigneeDto;
import com.smartcampusopshub.backend.ticket.dto.TicketAttachmentDto;
import com.smartcampusopshub.backend.ticket.dto.TicketResponseDto;
import com.smartcampusopshub.backend.ticket.entity.TicketAttachment;
import com.smartcampusopshub.backend.ticket.entity.Ticket;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

public final class TicketMapper {

    private TicketMapper() {
    }

    public static TicketResponseDto toResponseDto(Ticket ticket) {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime effectiveResolutionDeadline = ticket.getSlaResolutionDeadline();
        if (effectiveResolutionDeadline == null && ticket.getCreatedAt() != null && ticket.getPriority() != null) {
            effectiveResolutionDeadline = ticket.getCreatedAt().plus(ticket.getPriority().resolutionSla());
        }
        LocalDateTime effectiveFirstResponseDeadline = ticket.getSlaFirstResponseDeadline();
        if (effectiveFirstResponseDeadline == null && ticket.getCreatedAt() != null && ticket.getPriority() != null) {
            effectiveFirstResponseDeadline = ticket.getCreatedAt().plus(ticket.getPriority().firstResponseSla());
        }
        Long minutesRemaining = null;
        Boolean overdue = null;
        if (effectiveResolutionDeadline != null) {
            minutesRemaining = Duration.between(now, effectiveResolutionDeadline).toMinutes();
            overdue = minutesRemaining < 0;
        }
        return TicketResponseDto.builder()
                .id(ticket.getId())
                .title(ticket.getTitle())
                .description(ticket.getDescription())
                .category(ticket.getCategory())
                .priority(ticket.getPriority())
                .status(ticket.getStatus())
                .location(ticket.getLocation())
                .contactPhone(ticket.getContactPhone())
                .contactEmail(ticket.getContactEmail())
                .rejectionReason(ticket.getRejectionReason())
                .resolutionNotes(ticket.getResolutionNotes())
                .reporterId(ticket.getReporter() != null ? ticket.getReporter().getId() : null)
                .reporterName(ticket.getReporter() != null
                        ? (ticket.getReporter().getUsername() != null ? ticket.getReporter().getUsername() : ticket.getReporter().getName())
                        : null)
                .assigneeName(ticket.getAssignee() != null
                        ? (ticket.getAssignee().getUsername() != null ? ticket.getAssignee().getUsername() : ticket.getAssignee().getName())
                        : null)
                .assignee(ticket.getAssignee() != null
                        ? TicketAssigneeDto.builder()
                        .id(ticket.getAssignee().getId())
                        .name(ticket.getAssignee().getName())
                        .username(ticket.getAssignee().getUsername())
                        .build()
                        : null)
                .attachments(mapAttachments(ticket.getAttachments()))
                .firstResponseAt(ticket.getFirstResponseAt())
                .resolvedAt(ticket.getResolvedAt())
                .slaFirstResponseDeadline(effectiveFirstResponseDeadline)
                .slaResolutionDeadline(effectiveResolutionDeadline)
                .resolutionMinutesRemaining(minutesRemaining)
                .resolutionOverdue(overdue)
                .createdAt(ticket.getCreatedAt())
                .build();
    }

    private static List<TicketAttachmentDto> mapAttachments(List<TicketAttachment> attachments) {
        if (attachments == null) {
            return List.of();
        }
        return attachments.stream()
                .map(attachment -> TicketAttachmentDto.builder()
                        .id(attachment.getId())
                        .fileName(attachment.getFileName())
                        .fileType(attachment.getFileType())
                        .fileSize(attachment.getFileSize())
                        .downloadUrl("/api/v1/tickets/attachments/" + attachment.getId() + "/download")
                        .build())
                .collect(Collectors.toList());
    }
}
