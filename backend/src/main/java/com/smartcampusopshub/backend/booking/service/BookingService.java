package com.smartcampusopshub.backend.booking.service;

import com.smartcampusopshub.backend.common.exception.ConflictException;
import com.smartcampusopshub.backend.booking.entity.Booking;
import com.smartcampusopshub.backend.booking.repository.BookingRepository;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class BookingService {

    private final BookingRepository bookingRepository;

    // CREATE BOOKING
    public Booking createBooking(Booking booking) {
        if (booking.getStatus() == null) {
        booking.setStatus("PENDING");
         }

        List<Booking> conflicts = bookingRepository
                .findByResourceIdAndStartTimeLessThanAndEndTimeGreaterThan(
                        booking.getResourceId(),
                        booking.getEndTime(),
                        booking.getStartTime()
                );

        System.out.println("Conflicts found: " + conflicts.size());

        if (!conflicts.isEmpty()) {

            List<Booking> bookings =
                    bookingRepository.findByResourceIdOrderByStartTimeAsc(
                            booking.getResourceId()
                    );

            List<String> suggestions = new ArrayList<>();

            LocalDateTime requestedStart = booking.getStartTime();

            // ✅ BEFORE FIRST BOOKING
            if (!bookings.isEmpty()) {
                Booking first = bookings.get(0);

                if (requestedStart.isBefore(first.getStartTime())) {
                    suggestions.add(
                            requestedStart + " to " + requestedStart.plusHours(1)
                    );
                }
            }

            // ✅ BETWEEN BOOKINGS
            for (int i = 0; i < bookings.size() - 1; i++) {

                LocalDateTime endCurrent = bookings.get(i).getEndTime();
                LocalDateTime startNext = bookings.get(i + 1).getStartTime();

                if (endCurrent.isBefore(startNext)) {
                    suggestions.add(endCurrent + " to " + startNext);
                }
            }

            // ✅ AFTER LAST BOOKING
            if (!bookings.isEmpty()) {
                Booking last = bookings.get(bookings.size() - 1);

                suggestions.add(
                        last.getEndTime() + " to " + last.getEndTime().plusHours(1)
                );
            }

            // 🔥 THROW
            throw new ConflictException("CONFLICT|" + String.join(",", suggestions));
        }

        // ✅ NO CONFLICT → SAVE
        return bookingRepository.save(booking);
    }

    // GET ALL BOOKINGS
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

    // APPROVE BOOKING
    public Booking approveBooking(Long id) {
        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Booking not found"));
        
        // ❌ VALIDATION
        if (!"PENDING".equals(booking.getStatus())) {
            throw new IllegalArgumentException("Only PENDING bookings can be approved");
        }
        
        booking.setStatus("APPROVED");
        return bookingRepository.save(booking);
    }

    // REJECT BOOKING
    public Booking rejectBooking(Long id) {
        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Booking not found"));

        // ❌ VALIDATION
        if (!"PENDING".equals(booking.getStatus())) {
                throw new IllegalArgumentException("Only PENDING bookings can be rejected");

        }

        booking.setStatus("REJECTED");
        return bookingRepository.save(booking);
    }

    public List<Booking> getPendingBookings() {
    return bookingRepository.findAll()
            .stream()
            .filter(b -> "PENDING".equals(b.getStatus()))
            .toList();
    }
}