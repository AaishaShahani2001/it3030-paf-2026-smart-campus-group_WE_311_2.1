package com.smartcampusopshub.backend.ticket.controller;

import com.smartcampusopshub.backend.auth.JwtUtil;
import com.smartcampusopshub.backend.common.dto.ApiResponse;
import com.smartcampusopshub.backend.ticket.dto.CreateTicketRequestDto;
import com.smartcampusopshub.backend.ticket.dto.TicketResponseDto;
import com.smartcampusopshub.backend.ticket.service.TicketService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/tickets")
@RequiredArgsConstructor
public class TicketController {

    private final TicketService ticketService;
    private final JwtUtil jwtUtil;

    @GetMapping
    public ResponseEntity<ApiResponse<List<TicketResponseDto>>> listMyTickets(
            @RequestHeader(value = "Authorization", required = false) String authHeader
    ) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.status(401).body(ApiResponse.error("Authentication required"));
        }
        String token = authHeader.substring(7);
        String email;
        try {
            email = jwtUtil.extractEmail(token);
        } catch (Exception e) {
            return ResponseEntity.status(401).body(ApiResponse.error("Invalid token"));
        }
        if (!StringUtils.hasText(email)) {
            return ResponseEntity.status(400).body(ApiResponse.error("Token does not contain email"));
        }
        List<TicketResponseDto> tickets = ticketService.listTicketsForReporterEmail(email.trim());
        return ResponseEntity.ok(ApiResponse.success("Tickets loaded", tickets));
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<TicketResponseDto>> createTicket(
            @Valid @RequestPart("ticket") CreateTicketRequestDto request,
            @RequestPart(value = "attachments", required = false) List<MultipartFile> attachments
    ) {
        TicketResponseDto ticket = ticketService.createTicket(request, attachments);
        return ResponseEntity.ok(ApiResponse.success("Ticket created successfully", ticket));
    }
}
