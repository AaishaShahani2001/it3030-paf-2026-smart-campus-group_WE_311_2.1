package com.smartcampusopshub.backend.ticket.controller;

import com.smartcampusopshub.backend.common.dto.ApiResponse;
import com.smartcampusopshub.backend.ticket.dto.CreateTicketRequestDto;
import com.smartcampusopshub.backend.ticket.dto.TicketResponseDto;
import com.smartcampusopshub.backend.ticket.service.TicketService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/tickets")
@RequiredArgsConstructor
public class TicketController {

    private final TicketService ticketService;

    @PostMapping
    public ResponseEntity<ApiResponse<TicketResponseDto>> createTicket(@Valid @RequestBody CreateTicketRequestDto request) {
        TicketResponseDto ticket = ticketService.createTicket(request);
        return ResponseEntity.ok(ApiResponse.success("Ticket created successfully", ticket));
    }
}
