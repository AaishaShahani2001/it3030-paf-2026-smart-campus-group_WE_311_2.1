package com.smartcampusopshub.backend.ticket.controller;

import com.smartcampusopshub.backend.common.dto.ApiResponse;
import com.smartcampusopshub.backend.auth.JwtUtil;
import com.smartcampusopshub.backend.ticket.dto.AddTicketCommentRequestDto;
import com.smartcampusopshub.backend.ticket.dto.AssignTicketRequestDto;
import com.smartcampusopshub.backend.ticket.dto.CreateTicketRequestDto;
import com.smartcampusopshub.backend.ticket.dto.TicketCommentResponseDto;
import com.smartcampusopshub.backend.ticket.dto.TicketResponseDto;
import com.smartcampusopshub.backend.ticket.dto.UpdateTicketRequestDto;
import com.smartcampusopshub.backend.ticket.dto.UpdateTicketStatusRequestDto;
import com.smartcampusopshub.backend.ticket.service.TicketService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping({"/api/tickets", "/api/v1/tickets"})
@RequiredArgsConstructor
public class TicketController {

    private final TicketService ticketService;
    private final JwtUtil jwtUtil;

    @GetMapping
    public ResponseEntity<ApiResponse<Page<TicketResponseDto>>> getAllTickets(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) UUID assigneeId,
            @RequestParam(required = false) String reporterEmail
    ) {
        Page<TicketResponseDto> tickets = ticketService.getAllTickets(page, size, assigneeId, reporterEmail);
        return ResponseEntity.ok(ApiResponse.success("Tickets fetched successfully", tickets));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<TicketResponseDto>> getTicketById(@PathVariable("id") UUID id) {
        TicketResponseDto ticket = ticketService.getTicketById(id);
        return ResponseEntity.ok(ApiResponse.success("Ticket fetched successfully", ticket));
    }

    @GetMapping("/{id}/comments")
    public ResponseEntity<ApiResponse<Page<TicketCommentResponseDto>>> getTicketComments(
            @PathVariable("id") UUID id,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size
    ) {
        Page<TicketCommentResponseDto> comments = ticketService.getTicketComments(id, page, size);
        return ResponseEntity.ok(ApiResponse.success("Ticket comments fetched successfully", comments));
    }

    @PatchMapping("/{id}/assign")
    public ResponseEntity<ApiResponse<TicketResponseDto>> assignTicket(
            @PathVariable("id") UUID id,
            @Valid @RequestBody AssignTicketRequestDto request
    ) {
        TicketResponseDto ticket = ticketService.assignTicket(id, request);
        return ResponseEntity.ok(ApiResponse.success("Ticket assigned successfully", ticket));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<ApiResponse<TicketResponseDto>> updateStatus(
            @PathVariable("id") UUID id,
            @Valid @RequestBody UpdateTicketStatusRequestDto request,
            @RequestHeader(value = "Authorization", required = false) String authorizationHeader
    ) {
        String username = extractUsername(authorizationHeader);
        TicketResponseDto ticket = ticketService.updateTicketStatus(id, request, username);
        return ResponseEntity.ok(ApiResponse.success("Ticket status updated successfully", ticket));
    }

    @PostMapping("/{id}/comments")
    public ResponseEntity<ApiResponse<TicketCommentResponseDto>> addComment(
            @PathVariable("id") UUID id,
            @Valid @RequestBody AddTicketCommentRequestDto request,
            @RequestHeader(value = "Authorization", required = false) String authorizationHeader
    ) {
        String username = extractUsername(authorizationHeader);
        TicketCommentResponseDto comment = ticketService.addComment(id, request, username);
        return ResponseEntity.ok(ApiResponse.success("Comment added successfully", comment));
    }

    @GetMapping("/attachments/{attachmentId}/download")
    public ResponseEntity<Resource> downloadAttachment(@PathVariable UUID attachmentId) {
        Resource resource = ticketService.loadAttachment(attachmentId);
        String filename = resource.getFilename() != null ? resource.getFilename() : "attachment";

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + filename + "\"")
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .body(resource);
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<TicketResponseDto>> createTicket(
            @Valid @RequestPart("ticket") CreateTicketRequestDto request,
            @RequestPart(value = "attachments", required = false) List<MultipartFile> attachments,
            @RequestHeader(value = "Authorization", required = false) String authorizationHeader
    ) {
        String username = extractUsername(authorizationHeader);
        TicketResponseDto ticket = ticketService.createTicket(request, attachments, username);
        return ResponseEntity.ok(ApiResponse.success("Ticket created successfully", ticket));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<TicketResponseDto>> updateTicket(
            @PathVariable("id") UUID id,
            @Valid @RequestBody UpdateTicketRequestDto request,
            @RequestHeader(value = "Authorization", required = false) String authorizationHeader
    ) {
        String username = extractUsername(authorizationHeader);
        TicketResponseDto ticket = ticketService.updateTicket(id, request, username);
        return ResponseEntity.ok(ApiResponse.success("Ticket updated successfully", ticket));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteTicket(
            @PathVariable("id") UUID id,
            @RequestHeader(value = "Authorization", required = false) String authorizationHeader
    ) {
        String username = extractUsername(authorizationHeader);
        ticketService.deleteTicket(id, username);
        return ResponseEntity.ok(ApiResponse.success("Ticket deleted successfully", null));
    }

    private String extractUsername(String authorizationHeader) {
        if (authorizationHeader != null && authorizationHeader.startsWith("Bearer ")) {
            return jwtUtil.extractUsername(authorizationHeader.substring(7));
        }
        return null;
    }
}
