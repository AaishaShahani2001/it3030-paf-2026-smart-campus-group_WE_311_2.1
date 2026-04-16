package com.smartcampusopshub.backend.ticket.dto;

import lombok.Builder;
import lombok.Data;

import java.util.UUID;

@Data
@Builder
public class TicketAttachmentDto {
    private UUID id;
    private String fileName;
    private String fileType;
    private Long fileSize;
    private String downloadUrl;
}
