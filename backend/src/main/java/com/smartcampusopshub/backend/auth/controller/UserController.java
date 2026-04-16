package com.smartcampusopshub.backend.auth.controller;

import com.smartcampusopshub.backend.auth.dto.UserSummaryDto;
import com.smartcampusopshub.backend.auth.model.Role;
import com.smartcampusopshub.backend.auth.model.User;
import com.smartcampusopshub.backend.auth.repository.UserRepository;
import com.smartcampusopshub.backend.common.dto.ApiResponse;
import com.smartcampusopshub.backend.common.exception.BadRequestException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
public class UserController {

    private final UserRepository userRepository;

    @GetMapping
    public ResponseEntity<ApiResponse<List<UserSummaryDto>>> getUsers(
            @RequestParam(required = false) String role
    ) {
        List<User> users;
        if (role != null && !role.isBlank()) {
            Role parsedRole = Arrays.stream(Role.values())
                    .filter(r -> r.name().equalsIgnoreCase(role.trim()))
                    .findFirst()
                    .orElseThrow(() -> new BadRequestException("Invalid role: " + role));
            users = userRepository.findByRole(parsedRole);
        } else {
            users = userRepository.findAll();
        }

        List<UserSummaryDto> payload = users.stream()
                .map(user -> UserSummaryDto.builder()
                        .id(user.getId())
                        .name(user.getName())
                        .username(user.getUsername())
                        .email(user.getEmail())
                        .role(user.getRole())
                        .build())
                .collect(Collectors.toList());

        return ResponseEntity.ok(ApiResponse.success("Users fetched successfully", payload));
    }
}
