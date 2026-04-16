package com.smartcampusopshub.backend.ticket.repository;

import com.smartcampusopshub.backend.ticket.entity.Ticket;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface TicketRepository extends JpaRepository<Ticket, UUID> {

    @Query("SELECT t FROM Ticket t JOIN FETCH t.reporter r WHERE r.email = :email ORDER BY t.createdAt DESC")
    List<Ticket> findAllByReporterEmail(@Param("email") String email);
}
