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

        booking.setUserId(user.getId().toString());
        booking.setUserName(dto.getUserName());
        booking.setOccupation(dto.getOccupation());
        

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

            return buildDTO(saved, "Slot unavailable...");
        }

        Booking saved = bookingRepository.save(booking);

        return buildDTO(saved, "Booking created successfully");
    }

    // ✅ FIXED HERE (IMPORTANT)
       private BookingResponseDTO buildDTO(Booking booking, String message) {
            return new BookingResponseDTO(
            booking.getId(),
            booking.getStatus(),
            message,
            booking.getUserName(),   // ✅ FORM NAME ONLY
            booking.getOccupation(),
            booking.getResourceId(),
            booking.getStartTime(),
            booking.getEndTime(),
            booking.getPurpose()
        );
}
    // GET ALL
    public List<BookingResponseDTO> getAllBookings() {
        return bookingRepository.findAll()
                .stream()
                .map(this::convertToDTO)
                .toList();
    }

    // CONVERT TO DTO
    private BookingResponseDTO convertToDTO(Booking booking) {
    return new BookingResponseDTO(
            booking.getId(),
            booking.getStatus(),
            booking.getPurpose(),
            booking.getUserName(),
            booking.getOccupation(),
            booking.getResourceId(),
            booking.getStartTime(),
            booking.getEndTime(),
            booking.getPurpose()
    );
}

    public Booking getBookingById(Long id) {
        return bookingRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Booking not found"));
    }

    public void deleteBooking(Long id) {
        bookingRepository.deleteById(id);
    }

    public Booking approveBooking(Long id) {
        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Booking not found"));

        booking.setStatus("APPROVED");
        return bookingRepository.save(booking);
    }

    public Booking rejectBooking(Long id, String reason) {
        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Booking not found"));

        booking.setStatus("REJECTED");
        booking.setRejectReason(reason);

        return bookingRepository.save(booking);
    }

    public List<Booking> getPendingBookings() {
        return bookingRepository.findAll()
                .stream()
                .filter(b -> "PENDING".equals(b.getStatus()))
                .toList();
    }

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

    public List<Booking> getWaitlistBookings() {
        return bookingRepository.findAll()
                .stream()
                .filter(b -> "WAITLIST".equals(b.getStatus()))
                .toList();
    }

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
        Booking saved = bookingRepository.save(booking);

        promoteWaitlist(booking.getResourceId());

        return saved;
    }

    public void promoteWaitlist(Long resourceId) {
        List<Booking> waitlist = bookingRepository.findAll()
                .stream()
                .filter(b ->
                        resourceId.equals(b.getResourceId()) &&
                                "WAITLIST".equals(b.getStatus())
                )
                .sorted((a, b) -> a.getStartTime().compareTo(b.getStartTime()))
                .toList();

        if (!waitlist.isEmpty()) {
            Booking next = waitlist.get(0);
            next.setStatus("APPROVED");
            bookingRepository.save(next);
        }
    }
}