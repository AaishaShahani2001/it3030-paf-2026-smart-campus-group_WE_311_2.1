package com.smartcampusopshub.backend.auth.security;

import com.smartcampusopshub.backend.auth.model.Role;
import com.smartcampusopshub.backend.auth.model.User;
import lombok.Getter;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.oauth2.core.user.OAuth2User;

import java.util.Collection;
import java.util.Collections;
import java.util.Map;
import java.util.UUID;

@Getter
public class UserPrincipal implements OAuth2User {

    private final UUID id;
    private final String email;
    private final String username;
    private final Role role;
    private final Map<String, Object> attributes;

    private UserPrincipal(UUID id, String email, String username, Role role, Map<String, Object> attributes) {
        this.id = id;
        this.email = email;
        this.username = username;
        this.role = role;
        this.attributes = attributes;
    }

    public static UserPrincipal create(User user, Map<String, Object> attributes) {
        return new UserPrincipal(
                user.getId(),
                user.getEmail(),
                user.getUsername(),
                user.getRole(),
                attributes
        );
    }

    @Override
    public Map<String, Object> getAttributes() {
        return attributes;
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return Collections.emptyList();
    }

    @Override
    public String getName() {
        return email;
    }
}