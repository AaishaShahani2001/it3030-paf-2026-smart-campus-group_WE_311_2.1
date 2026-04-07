package com.smartcampusopshub.backend.ticket.dto;

import com.smartcampusopshub.backend.ticket.enums.TicketCategory;
import com.smartcampusopshub.backend.ticket.enums.TicketPriority;
import com.smartcampusopshub.backend.ticket.enums.TicketStatus;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
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
    private UUID reporterId;
    private LocalDateTime createdAt;
}
