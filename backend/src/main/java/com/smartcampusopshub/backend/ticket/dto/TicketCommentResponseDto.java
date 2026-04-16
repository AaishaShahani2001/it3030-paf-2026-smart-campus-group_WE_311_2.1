package com.smartcampusopshub.backend.ticket.dto;

import com.smartcampusopshub.backend.ticket.enums.TicketCommentType;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class TicketCommentResponseDto {
    private UUID id;
    private UUID authorId;
    private String authorName;
    private String content;
    private TicketCommentType commentType;
    private LocalDateTime createdAt;
}
