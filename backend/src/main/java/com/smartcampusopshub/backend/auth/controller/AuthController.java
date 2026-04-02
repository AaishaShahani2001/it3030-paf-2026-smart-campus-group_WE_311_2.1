package com.smartcampusopshub.backend.auth.controller;
import java.util.Optional;

import com.smartcampusopshub.backend.auth.JwtUtil;
import com.smartcampusopshub.backend.auth.model.Role;
import com.smartcampusopshub.backend.auth.model.User;
import com.smartcampusopshub.backend.auth.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
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

    @PostMapping("/register")
    public String registerUser(@RequestBody User user) {

        user.setPassword(passwordEncoder.encode(user.getPassword()));

        if (user.getRole() == null) {
            user.setRole(Role.USER);
        }

        userRepository.save(user);

        return "User registered successfully";
    }

   @PostMapping("/token")
public ResponseEntity<?> login(@RequestBody User loginUser) {

    Optional<User> user = userRepository.findByUsername(loginUser.getUsername());

    if (user.isPresent() &&
        passwordEncoder.matches(loginUser.getPassword(), user.get().getPassword())) {

        String token = jwtUtil.generateToken(loginUser.getUsername());

        return ResponseEntity.ok(token);
    }

    return ResponseEntity.status(401).body("Invalid credentials");
}


@GetMapping("/protected")
public ResponseEntity<?> protectedEndpoint() {
    return ResponseEntity.ok("Protected endpoint accessed");
}

}