package com.smartcampusopshub.backend.ticket.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
public class TicketApiSecurityConfig {

    @Bean
    @Order(0)
    public SecurityFilterChain ticketApiSecurityFilterChain(HttpSecurity http) throws Exception {
        http
                .securityMatcher("/api/tickets/**")
                .csrf(csrf -> csrf.disable())
                .authorizeHttpRequests(auth -> auth.anyRequest().permitAll());
        return http.build();
    }
}
