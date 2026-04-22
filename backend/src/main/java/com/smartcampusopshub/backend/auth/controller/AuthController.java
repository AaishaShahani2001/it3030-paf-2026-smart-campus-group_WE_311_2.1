package com.smartcampusopshub.backend.auth.controller;
import java.util.Optional;
import java.util.Locale;

import com.smartcampusopshub.backend.auth.JwtUtil;
import com.smartcampusopshub.backend.auth.model.Role;
import com.smartcampusopshub.backend.auth.model.User;
import com.smartcampusopshub.backend.auth.repository.UserRepository;
import com.smartcampusopshub.backend.common.exception.ConflictException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestClient;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/auth")
public class AuthController {

    @Autowired
    private UserRepository userRepository;


    @Autowired
    private JwtUtil jwtUtil;
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();
    private final RestClient restClient = RestClient.builder().baseUrl("https://oauth2.googleapis.com").build();

    @Value("${google.oauth.client-id:}")
    private String googleClientId;

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
public ResponseEntity<?> login(@RequestBody User loginUser) {

    Optional<User> user = userRepository.findByUsername(loginUser.getUsername());

    if (user.isPresent() &&
        passwordEncoder.matches(loginUser.getPassword(), user.get().getPassword())) {

        String token = jwtUtil.generateToken(user.get());

        return ResponseEntity.ok(Map.of(
                "token", token,
                "username", user.get().getUsername(),
                "email", user.get().getEmail(),
                "role", user.get().getRole().name()
        ));
    }

    return ResponseEntity.status(401).body("Invalid credentials");
}

@PostMapping(value = "/token", consumes = MediaType.TEXT_PLAIN_VALUE)
public ResponseEntity<String> loginTextPlain() {
    return ResponseEntity.badRequest().body("Use Content-Type: application/json for /auth/token");
}

@PostMapping(value = "/google", consumes = MediaType.APPLICATION_JSON_VALUE)
public ResponseEntity<?> googleLogin(@RequestBody Map<String, String> payload) {
    String idToken = payload != null ? payload.get("idToken") : null;
    if (!StringUtils.hasText(idToken)) {
        return ResponseEntity.badRequest().body(Map.of("message", "Google idToken is required"));
    }
    if (!StringUtils.hasText(googleClientId)) {
        return ResponseEntity.status(500).body(Map.of("message", "Google OAuth is not configured on the server"));
    }

    try {
        @SuppressWarnings("unchecked")
        Map<String, Object> tokenInfo = restClient.get()
                .uri(uriBuilder -> uriBuilder.path("/tokeninfo").queryParam("id_token", idToken).build())
                .retrieve()
                .body(Map.class);

        if (tokenInfo == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Invalid Google token"));
        }

        String audience = tokenInfo.get("aud") != null ? tokenInfo.get("aud").toString() : "";
        if (!googleClientId.equals(audience)) {
            return ResponseEntity.status(401).body(Map.of("message", "Google token audience mismatch"));
        }

        String verified = tokenInfo.get("email_verified") != null ? tokenInfo.get("email_verified").toString() : "false";
        if (!"true".equalsIgnoreCase(verified)) {
            return ResponseEntity.status(401).body(Map.of("message", "Google account email is not verified"));
        }

        String email = tokenInfo.get("email") != null ? tokenInfo.get("email").toString().trim().toLowerCase(Locale.ROOT) : "";
        if (!StringUtils.hasText(email)) {
            return ResponseEntity.status(401).body(Map.of("message", "Google token does not include email"));
        }

        String displayName = tokenInfo.get("name") != null ? tokenInfo.get("name").toString().trim() : "";

        User user = userRepository.findByEmail(email).orElseGet(() -> {
            User newUser = new User();
            newUser.setEmail(email);
            newUser.setName(StringUtils.hasText(displayName) ? displayName : email.substring(0, email.indexOf("@")));
            newUser.setRole(Role.USER);
            newUser.setUsername(generateUniqueUsername(email));
            return userRepository.save(newUser);
        });

        boolean needsUpdate = false;
        if (!StringUtils.hasText(user.getUsername())) {
            user.setUsername(generateUniqueUsername(email));
            needsUpdate = true;
        }
        if (user.getRole() == null) {
            user.setRole(Role.USER);
            needsUpdate = true;
        }
        if (needsUpdate) {
            user = userRepository.save(user);
        }

        String token = jwtUtil.generateToken(user);
        Map<String, Object> response = new HashMap<>();
        response.put("token", token);
        response.put("username", user.getUsername());
        response.put("email", user.getEmail());
        response.put("role", user.getRole() != null ? user.getRole().name() : null);
        return ResponseEntity.ok(response);
    } catch (Exception ex) {
        Map<String, String> response = new HashMap<>();
        response.put("message", "Google sign-in failed");
        return ResponseEntity.status(401).body(response);
    }
}

private String generateUniqueUsername(String email) {
    String base = email.substring(0, email.indexOf("@")).replaceAll("[^a-zA-Z0-9._-]", "");
    if (!StringUtils.hasText(base)) {
        base = "user";
    }
    String candidate = base;
    int suffix = 1;
    while (userRepository.findByUsername(candidate).isPresent()) {
        candidate = base + suffix;
        suffix++;
    }
    return candidate;
}


@GetMapping("/protected")
public ResponseEntity<?> protectedEndpoint() {
    return ResponseEntity.ok("Protected endpoint accessed");
}

}