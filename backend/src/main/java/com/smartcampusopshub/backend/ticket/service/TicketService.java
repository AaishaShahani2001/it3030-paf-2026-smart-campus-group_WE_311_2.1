package com.smartcampusopshub.backend.ticket.service;

import com.smartcampusopshub.backend.auth.model.User;
import com.smartcampusopshub.backend.auth.repository.UserRepository;
import com.smartcampusopshub.backend.common.exception.BadRequestException;
import com.smartcampusopshub.backend.ticket.dto.CreateTicketRequestDto;
import com.smartcampusopshub.backend.ticket.dto.TicketResponseDto;
import com.smartcampusopshub.backend.ticket.entity.Ticket;
import com.smartcampusopshub.backend.ticket.mapper.TicketMapper;
import com.smartcampusopshub.backend.ticket.repository.TicketRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
@RequiredArgsConstructor
public class TicketService {

    private final TicketRepository ticketRepository;
    private final UserRepository userRepository;

    @Transactional
    public TicketResponseDto createTicket(CreateTicketRequestDto request) {
        User reporter = userRepository.findByEmail(request.getReporterEmail())
                .orElseThrow(() -> new BadRequestException("Reporter user not found for email: " + request.getReporterEmail()));

        Ticket ticket = Ticket.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .category(request.getCategory())
                .priority(request.getPriority())
                .location(request.getLocation())
                .contactPhone(request.getContactPhone())
                .contactEmail(StringUtils.hasText(request.getContactEmail()) ? request.getContactEmail() : reporter.getEmail())
                .reporter(reporter)
                .build();

        Ticket savedTicket = ticketRepository.save(ticket);
        return TicketMapper.toResponseDto(savedTicket);
    }
}
