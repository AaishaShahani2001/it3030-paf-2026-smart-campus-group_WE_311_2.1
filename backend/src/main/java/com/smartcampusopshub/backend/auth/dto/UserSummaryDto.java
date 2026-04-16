package com.smartcampusopshub.backend.auth.dto;

import com.smartcampusopshub.backend.auth.model.Role;
import lombok.Builder;
import lombok.Data;

import java.util.UUID;

@Data
@Builder
public class UserSummaryDto {
    private UUID id;
    private String name;
    private String username;
    private String email;
    private Role role;
}
