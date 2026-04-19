package com.smartcampusopshub.backend.booking.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class BookingResponseDTO {

    private Long id;
    private String status;
    private String message;
}