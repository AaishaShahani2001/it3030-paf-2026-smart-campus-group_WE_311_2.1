package com.smartcampusopshub.backend.config;

import com.smartcampusopshub.backend.auth.model.Role;
import com.smartcampusopshub.backend.auth.model.User;
import com.smartcampusopshub.backend.auth.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Configuration
public class DatabaseSeeder implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DatabaseSeeder.class);

    private final UserRepository userRepository;
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    public DatabaseSeeder(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    public void run(String... args) {
        seedUsers();
    }

    private void seedUsers() {
        List<SeedUser> seeds = List.of(
                new SeedUser("Campus Admin", "admin", "admin@campus.local", "Admin@123", Role.ADMIN),
                new SeedUser("Dheena", "AdminDheena", "amjathdheena@gmail.com", "Dheena@123", Role.ADMIN),
                new SeedUser("Tech One", "tech1", "tech1@campus.local", "Tech@123", Role.TECHNICIAN),
                new SeedUser("Tech Two", "tech2", "tech2@campus.local", "Tech@123", Role.TECHNICIAN),
                new SeedUser("Tech Three", "tech3", "tech3@campus.local", "Tech@123", Role.TECHNICIAN)
        );

        int created = 0;
        int updated = 0;
        int mergedDuplicates = 0;
        for (SeedUser seed : seeds) {
            List<User> matchingByUsername = userRepository.findAllByUsername(seed.username());
            List<User> matchingByEmail = userRepository.findAllByEmail(seed.email());

            Map<UUID, User> uniqueMatches = new LinkedHashMap<>();
            for (User existing : matchingByUsername) {
                uniqueMatches.put(existing.getId(), existing);
            }
            for (User existing : matchingByEmail) {
                uniqueMatches.put(existing.getId(), existing);
            }

            List<User> matches = new ArrayList<>(uniqueMatches.values());
            boolean isExistingUser = !matches.isEmpty();
            User user = isExistingUser ? matches.get(0) : new User();
            user.setName(seed.name());
            user.setUsername(seed.username());
            user.setEmail(seed.email());
            user.setPassword(passwordEncoder.encode(seed.rawPassword()));
            user.setRole(seed.role());
            userRepository.save(user);

            if (matches.size() > 1) {
                List<User> duplicates = matches.subList(1, matches.size());
                userRepository.deleteAll(duplicates);
                mergedDuplicates += duplicates.size();
                log.warn("Merged {} duplicate record(s) for seeded user '{}' / '{}'.",
                        duplicates.size(), seed.username(), seed.email());
            }

            if (isExistingUser) {
                updated++;
                log.info("Updated seeded {} user '{}' ({})", seed.role(), seed.username(), seed.email());
            } else {
                created++;
                log.info("Seeded {} user '{}' ({})", seed.role(), seed.username(), seed.email());
            }
        }

        if (created > 0 || updated > 0 || mergedDuplicates > 0) {
            log.info("DatabaseSeeder created {}, updated {}, and merged {} duplicate account(s).",
                    created, updated, mergedDuplicates);
        } else {
            log.info("DatabaseSeeder: all default accounts already present.");
        }
    }

    private record SeedUser(String name, String username, String email, String rawPassword, Role role) {
    }
}