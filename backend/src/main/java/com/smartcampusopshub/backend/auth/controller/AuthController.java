package com.smartcampusopshub.backend.auth.controller;
import java.util.Optional;

import com.smartcampusopshub.backend.auth.JwtUtil;
import com.smartcampusopshub.backend.auth.model.Role;
import com.smartcampusopshub.backend.auth.model.User;
import com.smartcampusopshub.backend.auth.repository.UserRepository;
import com.smartcampusopshub.backend.common.exception.ConflictException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
public class AuthController {

    @Autowired
    private UserRepository userRepository;


    @Autowired
    private JwtUtil jwtUtil;
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    @GetMapping("/")
    public String home() {
        return "Login Successful 🎉";
    }

    @PostMapping(value = "/register", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<String> registerUser(@RequestBody User user) {

        if (!StringUtils.hasText(user.getUsername()) || !StringUtils.hasText(user.getPassword())
                || !StringUtils.hasText(user.getEmail())) {
            return ResponseEntity.badRequest().body("username, email and password are required");
        }

        if (userRepository.findByEmail(user.getEmail()).isPresent()) {
            throw new ConflictException("Email is already registered");
        }

        if (userRepository.findByUsername(user.getUsername()).isPresent()) {
            throw new ConflictException("Username is already taken");
        }

        user.setPassword(passwordEncoder.encode(user.getPassword()));

        if (!StringUtils.hasText(user.getName())) {
            user.setName(user.getUsername());
        }

        if (user.getRole() == null) {
            user.setRole(Role.USER);
        }

        userRepository.save(user);

        return ResponseEntity.ok("User registered successfully");
    }

    @PostMapping(value = "/register", consumes = MediaType.TEXT_PLAIN_VALUE)
    public ResponseEntity<String> registerUserTextPlain() {
        return ResponseEntity.badRequest().body("Use Content-Type: application/json for /auth/register");
    }

   @PostMapping(value = "/token", consumes = MediaType.APPLICATION_JSON_VALUE)
public ResponseEntity<String> login(@RequestBody User loginUser) {

    Optional<User> user = userRepository.findByUsername(loginUser.getUsername());

    if (user.isPresent() &&
        passwordEncoder.matches(loginUser.getPassword(), user.get().getPassword())) {

        String token = jwtUtil.generateToken(loginUser.getUsername());

        return ResponseEntity.ok(token);
    }

    return ResponseEntity.status(401).body("Invalid credentials");
}

@PostMapping(value = "/token", consumes = MediaType.TEXT_PLAIN_VALUE)
public ResponseEntity<String> loginTextPlain() {
    return ResponseEntity.badRequest().body("Use Content-Type: application/json for /auth/token");
}


@GetMapping("/protected")
public ResponseEntity<?> protectedEndpoint() {
    return ResponseEntity.ok("Protected endpoint accessed");
}

}