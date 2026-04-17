package com.smartcampusopshub.backend.ticket.repository;

import com.smartcampusopshub.backend.ticket.entity.Ticket;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface TicketRepository extends JpaRepository<Ticket, UUID> {
    Page<Ticket> findByAssignee_Id(UUID assigneeId, Pageable pageable);
    Page<Ticket> findByReporter_Email(String reporterEmail, Pageable pageable);
}
