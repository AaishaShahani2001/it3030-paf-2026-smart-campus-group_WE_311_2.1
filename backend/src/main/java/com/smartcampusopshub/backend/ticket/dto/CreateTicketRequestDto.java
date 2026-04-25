package com.smartcampusopshub.backend.ticket.dto;

import com.smartcampusopshub.backend.ticket.enums.TicketCategory;
import com.smartcampusopshub.backend.ticket.enums.TicketPriority;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class CreateTicketRequestDto {

    @NotBlank
    @Size(max = 255)
    private String title;

    @NotBlank
    private String description;

    @NotNull
    private TicketCategory category;

    @NotNull
    private TicketPriority priority;

    @NotBlank
    @Size(max = 255)
    private String location;

    @Size(max = 50)
    private String contactPhone;

    @Email
    @Size(max = 255)
    private String contactEmail;
}
