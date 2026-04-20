package com.smartcampusopshub.backend.booking.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class CreateBookingDTO {

    private Long userId;
    private Long resourceId;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private String purpose;
    private int attendees;
    private String email;
}