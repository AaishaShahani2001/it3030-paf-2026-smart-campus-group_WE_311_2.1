package com.smartcampusopshub.backend.booking.service;

import com.smartcampusopshub.backend.auth.model.User;
import com.smartcampusopshub.backend.auth.repository.UserRepository;
import com.smartcampusopshub.backend.booking.dto.BookingResponseDTO;
import com.smartcampusopshub.backend.booking.dto.CreateBookingDTO;
import com.smartcampusopshub.backend.booking.entity.Booking;
import com.smartcampusopshub.backend.booking.repository.BookingRepository;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class BookingService {

    private final BookingRepository bookingRepository;
    private final UserRepository userRepository;

    // CREATE BOOKING
    public BookingResponseDTO createBooking(CreateBookingDTO dto) {

        Booking booking = new Booking();
        booking.setResourceId(dto.getResourceId());
        booking.setStartTime(dto.getStartTime());
        booking.setEndTime(dto.getEndTime());
        booking.setPurpose(dto.getPurpose());
        booking.setAttendees(dto.getAttendees());
        booking.setStatus("PENDING");
        User user = userRepository.findByEmail(dto.getEmail())
                .orElseThrow(() -> new RuntimeException("User not found"));

        // UUID → Long convert (temporary fix)
        booking.setUserId(user.getId().toString());

        

        List<Booking> conflicts = bookingRepository
            .findConflictingBookings(
                booking.getResourceId(),
                booking.getEndTime(),
                booking.getStartTime()
            );

        if (!conflicts.isEmpty()) {

            String suggestion = findNextAvailableSlot(
                    booking.getResourceId(),
                    booking.getStartTime(),
                    booking.getEndTime()
            );

            booking.setStatus("WAITLIST");
            Booking saved = bookingRepository.save(booking);

            return new BookingResponseDTO(
                    saved.getId(),
                    "WAITLIST",
                    "Slot unavailable. Try: " + suggestion
            );
        }

        Booking saved = bookingRepository.save(booking);

        return new BookingResponseDTO(
                saved.getId(),
                "APPROVED",
                "Booking created successfully"
        );
    }

    // GET ALL
    public List<Booking> getAllBookings() {
        return bookingRepository.findAll();
    }

    // GET BY ID
    public Booking getBookingById(Long id) {
        return bookingRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Booking not found"));
    }

    // DELETE
    public void deleteBooking(Long id) {
        bookingRepository.deleteById(id);
    }

    // APPROVE
    public Booking approveBooking(Long id) {
        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Booking not found"));

        booking.setStatus("APPROVED");
        return bookingRepository.save(booking);
    }

    // REJECT
    public Booking rejectBooking(Long id) {
        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Booking not found"));

        booking.setStatus("REJECTED");
        return bookingRepository.save(booking);
    }

    // GET PENDING
    public List<Booking> getPendingBookings() {
        return bookingRepository.findAll()
                .stream()
                .filter(b -> "PENDING".equals(b.getStatus()))
                .toList();
    }

    // AUTO SLOT LOGIC
    public String findNextAvailableSlot(Long resourceId, LocalDateTime start, LocalDateTime end) {

        List<Booking> bookings = bookingRepository
                .findByResourceIdOrderByStartTimeAsc(resourceId);

        if (bookings.isEmpty()) {
            return start + " to " + end;
        }

        for (int i = 0; i < bookings.size() - 1; i++) {

            LocalDateTime currentEnd = bookings.get(i).getEndTime();
            LocalDateTime nextStart = bookings.get(i + 1).getStartTime();

            if (currentEnd.isBefore(nextStart)) {
                return currentEnd + " to " + nextStart;
            }
        }

        Booking last = bookings.get(bookings.size() - 1);
        return last.getEndTime() + " to " + last.getEndTime().plusHours(1);
    }

    // GET WAITLIST
    public List<Booking> getWaitlistBookings() {
        return bookingRepository.findAll()
                .stream()
                .filter(b -> "WAITLIST".equals(b.getStatus()))
                .toList();
    }

    // ✅ GET BOOKINGS BY USER EMAIL (FINAL FIX)
    public List<Booking> getBookingsByEmail(String email) {

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        return bookingRepository.findByUserId(
                user.getId().toString()
        );
    }

    public Booking cancelBooking(Long id) {
        Booking booking = bookingRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Booking not found"));

        booking.setStatus("CANCELLED");
        return bookingRepository.save(booking);
    }
}