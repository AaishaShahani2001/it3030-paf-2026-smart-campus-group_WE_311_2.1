package com.smartcampusopshub.backend.auth.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.smartcampusopshub.backend.auth.model.User;

import java.util.Optional;
import java.util.UUID;

public interface UserRepository extends JpaRepository<User, UUID> {
    Optional<User> findByUsername(String username);
    Optional<User> findByEmail(String email);
}