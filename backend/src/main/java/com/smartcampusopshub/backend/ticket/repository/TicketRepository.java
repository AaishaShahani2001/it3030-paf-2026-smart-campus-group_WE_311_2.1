package com.smartcampusopshub.backend.ticket.repository;

import com.smartcampusopshub.backend.ticket.entity.Ticket;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface TicketRepository extends JpaRepository<Ticket, UUID> {
}
