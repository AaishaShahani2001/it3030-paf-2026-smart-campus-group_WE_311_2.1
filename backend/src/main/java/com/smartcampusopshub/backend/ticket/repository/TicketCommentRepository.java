package com.smartcampusopshub.backend.ticket.repository;

import com.smartcampusopshub.backend.ticket.entity.TicketComment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface TicketCommentRepository extends JpaRepository<TicketComment, UUID> {
    Page<TicketComment> findByTicket_Id(UUID ticketId, Pageable pageable);
}
