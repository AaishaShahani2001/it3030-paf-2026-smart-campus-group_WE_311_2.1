package com.smartcampusopshub.backend.booking.controller;

import com.smartcampusopshub.backend.booking.dto.BookingResponseDTO;
import com.smartcampusopshub.backend.booking.dto.CreateBookingDTO;
import com.smartcampusopshub.backend.booking.entity.Booking;
import com.smartcampusopshub.backend.booking.service.BookingService;
import com.smartcampusopshub.backend.booking.dto.CreateBookingDTO;
import com.smartcampusopshub.backend.booking.dto.BookingResponseDTO;
import lombok.RequiredArgsConstructor;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/bookings")
@RequiredArgsConstructor
public class BookingController {

    private final BookingService bookingService;

    // CREATE
    @PostMapping
    public ResponseEntity<BookingResponseDTO> createBooking(@RequestBody CreateBookingDTO dto) {
        BookingResponseDTO response = bookingService.createBooking(dto);
        return ResponseEntity.ok(response);
    }

    // GET ALL
    @GetMapping
    public List<Booking> getAllBookings() {
        return bookingService.getAllBookings();
    }

    // ✅ IMPORTANT: PUT THIS BEFORE {id}
    @GetMapping("/pending")
    public List<Booking> getPendingBookings() {
        return bookingService.getPendingBookings();
    }

    // GET BY ID
    @GetMapping("/{id}")
    public Booking getBooking(@PathVariable Long id) {
        return bookingService.getBookingById(id);
    }

    // DELETE
    @DeleteMapping("/{id}")
    public void deleteBooking(@PathVariable Long id) {
        bookingService.deleteBooking(id);
    }

    // APPROVE
    @PutMapping("/{id}/approve")
    public ResponseEntity<Booking> approveBooking(@PathVariable Long id) {
        Booking updated = bookingService.approveBooking(id);
        return ResponseEntity.ok(updated);
    }

    // REJECT
    @PutMapping("/{id}/reject")
    public ResponseEntity<Booking> rejectBooking(@PathVariable Long id) {
        Booking updated = bookingService.rejectBooking(id);
        return ResponseEntity.ok(updated);
    }

    // WAITLIST
    @GetMapping("/waitlist")
    public List<Booking> getWaitlistBookings() {
        return bookingService.getWaitlistBookings();
    }
}