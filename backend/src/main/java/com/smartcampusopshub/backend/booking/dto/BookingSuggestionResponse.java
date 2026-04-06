package com.smartcampusopshub.backend.booking.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
@AllArgsConstructor
public class BookingSuggestionResponse {

    private String message;
    private List<String> suggestions;
}