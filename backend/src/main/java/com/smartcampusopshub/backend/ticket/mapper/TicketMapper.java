package com.smartcampusopshub.backend.ticket.mapper;

import com.smartcampusopshub.backend.ticket.dto.TicketResponseDto;
import com.smartcampusopshub.backend.ticket.entity.Ticket;

public final class TicketMapper {

    private TicketMapper() {
    }

    public static TicketResponseDto toResponseDto(Ticket ticket) {
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
                .reporterId(ticket.getReporter() != null ? ticket.getReporter().getId() : null)
                .createdAt(ticket.getCreatedAt())
                .build();
    }
}
