package com.smartcampusopshub.backend.ticket.dto;

import com.smartcampusopshub.backend.ticket.enums.TicketStatus;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class UpdateTicketStatusRequestDto {
    @NotNull
    private TicketStatus status;
    private String resolutionNotes;
    private String reason;
}
