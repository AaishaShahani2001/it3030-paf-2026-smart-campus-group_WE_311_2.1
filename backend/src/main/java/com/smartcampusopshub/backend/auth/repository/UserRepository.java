package com.smartcampusopshub.backend.auth.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.smartcampusopshub.backend.auth.model.User;

import java.util.Optional;
import java.util.UUID;
import java.util.List;
import com.smartcampusopshub.backend.auth.model.Role;

public interface UserRepository extends JpaRepository<User, UUID> {
    Optional<User> findByUsername(String username);
    Optional<User> findByEmail(String email);
    List<User> findAllByUsername(String username);
    List<User> findAllByEmail(String email);
    List<User> findByRole(Role role);
}