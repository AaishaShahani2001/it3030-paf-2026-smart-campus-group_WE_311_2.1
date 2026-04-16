package com.smartcampusopshub.backend.ticket.dto;

import lombok.Builder;
import lombok.Data;

import java.util.UUID;

@Data
@Builder
public class TicketAssigneeDto {
    private UUID id;
    private String name;
    private String username;
}
