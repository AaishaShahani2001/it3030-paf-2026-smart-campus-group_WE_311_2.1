package com.smartcampusopshub.backend.booking.controller;

import com.smartcampusopshub.backend.booking.dto.BookingResponseDTO;
import com.smartcampusopshub.backend.booking.dto.CreateBookingDTO;
import com.smartcampusopshub.backend.booking.entity.Booking;
import com.smartcampusopshub.backend.booking.service.BookingService;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/bookings")
@RequiredArgsConstructor
public class BookingController {

    private final BookingService bookingService;

    // CREATE
    @PostMapping
    public ResponseEntity<BookingResponseDTO> createBooking(@RequestBody CreateBookingDTO dto) {
        return ResponseEntity.ok(bookingService.createBooking(dto));
    }

    // GET ALL (ADMIN UI)
    @GetMapping
    public List<BookingResponseDTO> getAllBookings() {
        return bookingService.getAllBookings();
    }

    // GET PENDING
    @GetMapping("/pending")
    public List<BookingResponseDTO> getPendingBookings() {
        return bookingService.getAllBookings()
                .stream()
                .filter(b -> "PENDING".equals(b.getStatus()))
                .toList();
    }

    // GET WAITLIST
    @GetMapping("/waitlist")
    public List<BookingResponseDTO> getWaitlistBookings() {
        return bookingService.getAllBookings()
                .stream()
                .filter(b -> "WAITLIST".equals(b.getStatus()))
                .toList();
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

    // CANCEL
    @PutMapping("/{id}/cancel")
    public ResponseEntity<Booking> cancelBooking(@PathVariable Long id) {
        return ResponseEntity.ok(bookingService.cancelBooking(id));
    }

    // APPROVE
    @PutMapping("/{id}/approve")
    public ResponseEntity<Booking> approveBooking(@PathVariable Long id) {
        return ResponseEntity.ok(bookingService.approveBooking(id));
    }

    // REJECT WITH REASON ✅
    @PutMapping("/{id}/reject")
    public ResponseEntity<Booking> rejectBooking(
            @PathVariable Long id,
            @RequestBody Map<String, String> body
    ) {
        return ResponseEntity.ok(
                bookingService.rejectBooking(id, body.get("reason"))
        );
    }

    // USER BOOKINGS
    @GetMapping("/user-by-email/{email}")
    public List<BookingResponseDTO> getBookingsByEmail(@PathVariable String email) {
        return bookingService.getBookingsByEmail(email)
                .stream()
                .map(bookingService::convertToDTO)
                .toList();
    }
}