package com.smartcampusopshub.backend.ticket.controller;

import com.smartcampusopshub.backend.common.dto.ApiResponse;
import com.smartcampusopshub.backend.ticket.dto.CreateTicketRequestDto;
import com.smartcampusopshub.backend.ticket.dto.TicketResponseDto;
import com.smartcampusopshub.backend.ticket.service.TicketService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/tickets")
@RequiredArgsConstructor
public class TicketController {

    private final TicketService ticketService;

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<TicketResponseDto>> createTicket(
            @Valid @RequestPart("ticket") CreateTicketRequestDto request,
            @RequestPart(value = "attachments", required = false) List<MultipartFile> attachments
    ) {
        TicketResponseDto ticket = ticketService.createTicket(request, attachments);
        return ResponseEntity.ok(ApiResponse.success("Ticket created successfully", ticket));
    }
}
