package com.smartcampusopshub.backend.booking.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class CreateBookingDTO {

    private Long resourceId;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private String purpose;
    private int attendees;
    private String occupation;
    private String userName;

    private String email; // ✅ THIS is used to get user
}