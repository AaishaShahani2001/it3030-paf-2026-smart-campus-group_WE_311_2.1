package com.smartcampusopshub.backend.config;

import com.smartcampusopshub.backend.auth.model.Role;
import com.smartcampusopshub.backend.auth.model.User;
import com.smartcampusopshub.backend.auth.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import java.util.List;

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
                new SeedUser("Tech One", "tech1", "tech1@campus.local", "Tech@123", Role.TECHNICIAN),
                new SeedUser("Tech Two", "tech2", "tech2@campus.local", "Tech@123", Role.TECHNICIAN),
                new SeedUser("Tech Three", "tech3", "tech3@campus.local", "Tech@123", Role.TECHNICIAN)
        );

        int created = 0;
        for (SeedUser seed : seeds) {
            boolean alreadyExists = userRepository.findByUsername(seed.username()).isPresent()
                    || userRepository.findByEmail(seed.email()).isPresent();

            if (alreadyExists) {
                log.debug("Seed user '{}' already present — skipping.", seed.username());
                continue;
            }

            User user = new User();
            user.setName(seed.name());
            user.setUsername(seed.username());
            user.setEmail(seed.email());
            user.setPassword(passwordEncoder.encode(seed.rawPassword()));
            user.setRole(seed.role());
            userRepository.save(user);
            created++;
            log.info("Seeded {} user '{}' ({})", seed.role(), seed.username(), seed.email());
        }

        if (created > 0) {
            log.info("DatabaseSeeder created {} default account(s).", created);
        } else {
            log.info("DatabaseSeeder: all default accounts already present.");
        }
    }

    private record SeedUser(String name, String username, String email, String rawPassword, Role role) {
    }
}
