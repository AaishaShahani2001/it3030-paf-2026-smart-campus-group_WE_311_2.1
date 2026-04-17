package com.smartcampusopshub.backend.ticket.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class AddTicketCommentRequestDto {
    @NotBlank
    private String content;
}
