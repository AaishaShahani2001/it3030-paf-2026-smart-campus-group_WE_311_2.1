package com.smartcampusopshub.backend.booking.service;

import com.smartcampusopshub.backend.booking.entity.Booking;
import com.smartcampusopshub.backend.booking.repository.BookingRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class BookingService {

    private final BookingRepository bookingRepository;

    // CREATE BOOKING
    public Booking createBooking(Booking booking) {
            List<Booking> conflicts = bookingRepository
            .findByResourceIdAndStartTimeLessThanAndEndTimeGreaterThan(
                booking.getResourceId(),
                booking.getEndTime(),
                booking.getStartTime()
            );

        System.out.println("Conflicts found: " + conflicts.size());

        if (!conflicts.isEmpty()) {
            throw new RuntimeException("Time slot already booked!");
        }

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
}