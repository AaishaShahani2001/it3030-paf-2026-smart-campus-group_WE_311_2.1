package com.smartcampusopshub.backend.booking.service;

import com.smartcampusopshub.backend.auth.model.Role;
import com.smartcampusopshub.backend.auth.model.User;
import com.smartcampusopshub.backend.auth.repository.UserRepository;
import com.smartcampusopshub.backend.booking.dto.BookingResponseDTO;
import com.smartcampusopshub.backend.booking.dto.CreateBookingDTO;
import com.smartcampusopshub.backend.booking.entity.Booking;
import com.smartcampusopshub.backend.booking.repository.BookingRepository;
import com.smartcampusopshub.backend.notification.EmailNotificationService;
import com.smartcampusopshub.backend.Asset.entity.Resource;
import com.smartcampusopshub.backend.Asset.repository.ResourceRepository;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class BookingService {

    private final BookingRepository bookingRepository;
    private final UserRepository userRepository;
    private final EmailNotificationService emailNotificationService;
    private final ResourceRepository resourceRepository;    
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
            notifyAdminsOnBookingCreated(saved, user, true);
            notifyUserOnWaitlist(saved, user, suggestion);

            return buildDTO(saved, "Slot unavailable...");
        }

        Booking saved = bookingRepository.save(booking);
        notifyAdminsOnBookingCreated(saved, user, false);

        return buildDTO(saved, "Booking created successfully");
    }

    
      private BookingResponseDTO buildDTO(Booking booking, String message) {

                Resource resource = resourceRepository
                        .findById(booking.getResourceId())
                        .orElse(null);

                String resourceName = (resource != null)
                        ? resource.getName()
                        : "Resource #" + booking.getResourceId();

                return new BookingResponseDTO(
                        booking.getId(),
                        booking.getStatus(),
                        message,
                        booking.getUserName(),
                        booking.getOccupation(),
                        booking.getResourceId(),
                        booking.getStartTime(),
                        booking.getEndTime(),
                        booking.getPurpose(),
                        booking.getRejectReason(),
                        resourceName
                        
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
    public BookingResponseDTO convertToDTO(Booking booking) {

                Resource resource = resourceRepository
                        .findById(booking.getResourceId())
                        .orElse(null);

                String resourceName = (resource != null)
                        ? resource.getName()
                        : "Resource #" + booking.getResourceId();

                return new BookingResponseDTO(
                        booking.getId(),
                        booking.getStatus(),
                        booking.getPurpose(),
                        booking.getUserName(),
                        booking.getOccupation(),
                        booking.getResourceId(),
                        booking.getStartTime(),
                        booking.getEndTime(),
                        booking.getPurpose(),
                        booking.getRejectReason(),
                        resourceName
                        
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
        Booking saved = bookingRepository.save(booking);
        findBookingUser(saved).ifPresent(user -> notifyUserOnApproval(saved, user));
        return saved;
    }

    public Booking rejectBooking(Long id, String reason) {
        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Booking not found"));

        booking.setStatus("REJECTED");
        booking.setRejectReason(reason);

        Booking saved = bookingRepository.save(booking);
        findBookingUser(saved).ifPresent(user -> notifyUserOnRejection(saved, user, reason));
        return saved;
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
            Booking saved = bookingRepository.save(next);
            findBookingUser(saved).ifPresent(user -> notifyUserOnWaitlistPromotion(saved, user));
        }
    }

    private void notifyAdminsOnBookingCreated(Booking booking, User requester, boolean waitlisted) {
        List<String> adminEmails = userRepository.findByRole(Role.ADMIN).stream()
                .map(User::getEmail)
                .filter(StringUtils::hasText)
                .toList();
        if (adminEmails.isEmpty()) {
            return;
        }

        String subject = waitlisted
                ? "Resource booking waitlisted: " + booking.getResourceId()
                : "New resource booking request: " + booking.getResourceId();
        String body = "A resource booking request was submitted.\n\n"
                + "Booking ID: " + booking.getId() + "\n"
                + "Resource ID: " + booking.getResourceId() + "\n"
                + "Requested by: " + requester.getName() + " (" + requester.getEmail() + ")\n"
                + "Status: " + booking.getStatus() + "\n"
                + "Start: " + booking.getStartTime() + "\n"
                + "End: " + booking.getEndTime() + "\n"
                + "Purpose: " + booking.getPurpose() + "\n";
        emailNotificationService.sendEmailToMany(adminEmails, subject, body);
    }

    private void notifyUserOnApproval(Booking booking, User user) {
        if (!StringUtils.hasText(user.getEmail())) {
            return;
        }
        String subject = "Resource booking approved";
        String body = "Your resource booking was approved.\n\n"
                + "Booking ID: " + booking.getId() + "\n"
                + "Resource ID: " + booking.getResourceId() + "\n"
                + "Start: " + booking.getStartTime() + "\n"
                + "End: " + booking.getEndTime() + "\n";
        emailNotificationService.sendEmail(user.getEmail(), subject, body);
    }

    private void notifyUserOnRejection(Booking booking, User user, String reason) {
        if (!StringUtils.hasText(user.getEmail())) {
            return;
        }
        String reasonText = StringUtils.hasText(reason) ? reason : "No reason provided.";
        String subject = "Resource booking rejected";
        String body = "Your resource booking was rejected.\n\n"
                + "Booking ID: " + booking.getId() + "\n"
                + "Resource ID: " + booking.getResourceId() + "\n"
                + "Reason: " + reasonText + "\n";
        emailNotificationService.sendEmail(user.getEmail(), subject, body);
    }

    private void notifyUserOnWaitlist(Booking booking, User user, String suggestion) {
        if (!StringUtils.hasText(user.getEmail())) {
            return;
        }
        String subject = "Resource booking waitlisted";
        String body = "Your booking could not be immediately confirmed and was added to the waitlist.\n\n"
                + "Booking ID: " + booking.getId() + "\n"
                + "Resource ID: " + booking.getResourceId() + "\n"
                + "Requested Start: " + booking.getStartTime() + "\n"
                + "Requested End: " + booking.getEndTime() + "\n"
                + "Suggested next slot: " + suggestion + "\n";
        emailNotificationService.sendEmail(user.getEmail(), subject, body);
    }

    private void notifyUserOnWaitlistPromotion(Booking booking, User user) {
        if (!StringUtils.hasText(user.getEmail())) {
            return;
        }
        String subject = "Resource booking moved from waitlist to approved";
        String body = "Good news! Your waitlisted booking is now approved.\n\n"
                + "Booking ID: " + booking.getId() + "\n"
                + "Resource ID: " + booking.getResourceId() + "\n"
                + "Start: " + booking.getStartTime() + "\n"
                + "End: " + booking.getEndTime() + "\n";
        emailNotificationService.sendEmail(user.getEmail(), subject, body);
    }

    private Optional<User> findBookingUser(Booking booking) {
        if (!StringUtils.hasText(booking.getUserId())) {
            return Optional.empty();
        }
        try {
            UUID userId = UUID.fromString(booking.getUserId());
            return userRepository.findById(userId);
        } catch (IllegalArgumentException ex) {
            return Optional.empty();
        }
    }
}