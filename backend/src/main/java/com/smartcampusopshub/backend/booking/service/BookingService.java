package com.smartcampusopshub.backend.booking.service;

import com.smartcampusopshub.backend.common.exception.ConflictException;
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

    // CREATE BOOKING
    public Booking createBooking(Booking booking) {

        // ✅ Default status
        if (booking.getStatus() == null) {
            booking.setStatus("PENDING");
        }

        List<Booking> conflicts = bookingRepository
                .findByResourceIdAndStartTimeLessThanAndEndTimeGreaterThan(
                        booking.getResourceId(),
                        booking.getEndTime(),
                        booking.getStartTime()
                );

        // 🔥 IF CONFLICT → AUTO SLOT
        if (!conflicts.isEmpty()) {

            String nextSlot = findNextAvailableSlot(
                    booking.getResourceId(),
                    booking.getStartTime(),
                    booking.getEndTime()
            );

            booking.setStatus("WAITLIST");
            Booking saved = bookingRepository.save(booking);

            throw new ConflictException("WAITLIST|" + nextSlot);
                    }


        // ✅ SAVE IF NO CONFLICT
        return bookingRepository.save(booking);
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

        if (!"PENDING".equals(booking.getStatus())) {
            throw new IllegalArgumentException("Only PENDING bookings can be approved");
        }

        booking.setStatus("APPROVED");
        return bookingRepository.save(booking);
    }

    // REJECT
    public Booking rejectBooking(Long id) {
        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Booking not found"));

        if (!"PENDING".equals(booking.getStatus())) {
            throw new IllegalArgumentException("Only PENDING bookings can be rejected");
        }

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

    // 🔥 AUTO SLOT LOGIC
    public String findNextAvailableSlot(Long resourceId, LocalDateTime start, LocalDateTime end) {

        List<Booking> bookings = bookingRepository
                .findByResourceIdOrderByStartTimeAsc(resourceId);

        // If no bookings → free
        if (bookings.isEmpty()) {
            return start + " to " + end;
        }

        // Check gaps
        for (int i = 0; i < bookings.size() - 1; i++) {

            LocalDateTime currentEnd = bookings.get(i).getEndTime();
            LocalDateTime nextStart = bookings.get(i + 1).getStartTime();

            if (currentEnd.isBefore(nextStart)) {
                return currentEnd + " to " + nextStart;
            }
        }

        // After last booking
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
}