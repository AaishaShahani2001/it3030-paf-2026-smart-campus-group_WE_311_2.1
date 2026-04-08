package com.smartcampusopshub.backend.ticket.repository;

import com.smartcampusopshub.backend.ticket.entity.TicketAttachment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface TicketAttachmentRepository extends JpaRepository<TicketAttachment, UUID> {
}
