package com.smartcampusopshub.backend.ticket.dto;

import com.smartcampusopshub.backend.ticket.enums.TicketCategory;
import com.smartcampusopshub.backend.ticket.enums.TicketPriority;
import com.smartcampusopshub.backend.ticket.enums.TicketStatus;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
public class TicketResponseDto {
    private UUID id;
    private String title;
    private String description;
    private TicketCategory category;
    private TicketPriority priority;
    private TicketStatus status;
    private String location;
    private String contactPhone;
    private String contactEmail;
    private String rejectionReason;
    private String resolutionNotes;
    private UUID reporterId;
    private String reporterName;
    private String assigneeName;
    private TicketAssigneeDto assignee;
    private List<TicketAttachmentDto> attachments;
    private LocalDateTime firstResponseAt;
    private LocalDateTime resolvedAt;
    private LocalDateTime slaFirstResponseDeadline;
    private LocalDateTime slaResolutionDeadline;
    private Long resolutionMinutesRemaining;
    private Boolean resolutionOverdue;
    private LocalDateTime createdAt;
}
