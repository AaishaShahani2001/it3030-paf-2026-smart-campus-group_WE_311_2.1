package com.smartcampusopshub.backend.auth.controller;
import java.util.Optional;
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

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody User user) {

    Optional<User> dbUser = userRepository.findByUsername(user.getUsername());

    if (dbUser.isEmpty()) {
        return ResponseEntity.status(401).body("User not found");
    }

    if (!passwordEncoder.matches(user.getPassword(), dbUser.get().getPassword())) {
        return ResponseEntity.status(401).body("Invalid password");
    }

    return ResponseEntity.ok("Login successful");
}
}