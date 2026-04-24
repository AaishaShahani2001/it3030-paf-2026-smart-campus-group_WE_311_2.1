package com.smartcampusopshub.backend.booking.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class BookingResponseDTO {

    private Long id;
    private String status;
    private String message;

    private String userName;
    private String occupation;

    private Long resourceId;          
    private LocalDateTime startTime;  
    private LocalDateTime endTime;    
    private String purpose;  
    private String rejectReason;   
    private String resourceName;      

    public BookingResponseDTO(Long id, String status, String message,
                              String userName, String occupation,
                              Long resourceId,
                              LocalDateTime startTime,
                              LocalDateTime endTime,
                              String purpose,
                            String rejectReason,
                            String resourceName) {
        this.id = id;
        this.status = status;
        this.message = message;
        this.userName = userName;
        this.occupation = occupation;
        this.resourceId = resourceId;
        this.startTime = startTime;
        this.endTime = endTime;
        this.purpose = purpose;
        this.rejectReason = rejectReason;
        this.resourceName = resourceName;
    }
}