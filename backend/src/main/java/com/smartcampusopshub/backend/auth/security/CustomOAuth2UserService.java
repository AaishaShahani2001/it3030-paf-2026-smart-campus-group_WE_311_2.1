package com.smartcampusopshub.backend.auth.security;

import com.smartcampusopshub.backend.auth.model.Role;
import com.smartcampusopshub.backend.auth.model.User;
import com.smartcampusopshub.backend.auth.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.util.Locale;
import java.util.Map;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class CustomOAuth2UserService extends DefaultOAuth2UserService {

    private final UserRepository userRepository;

    @Override
    public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
        OAuth2User oAuth2User = super.loadUser(userRequest);
        return processOAuth2User(oAuth2User);
    }

    private OAuth2User processOAuth2User(OAuth2User oAuth2User) {
        Map<String, Object> attributes = oAuth2User.getAttributes();
        String email = extractString(attributes.get("email")).trim().toLowerCase(Locale.ROOT);
        String name = extractString(attributes.get("name")).trim();

        if (!StringUtils.hasText(email)) {
            throw new OAuth2AuthenticationException("Email not found from OAuth2 provider");
        }

        Optional<User> existingUser = userRepository.findByEmail(email);
        User user;
        if (existingUser.isPresent()) {
            user = existingUser.get();
            if (StringUtils.hasText(name)) {
                user.setName(name);
            }
            if (user.getRole() == null) {
                user.setRole(Role.USER);
            }
            if (!StringUtils.hasText(user.getUsername())) {
                user.setUsername(generateUniqueUsername(email));
            }
            user = userRepository.save(user);
            log.info("Updated existing OAuth2 user: {}", email);
        } else {
            user = new User();
            user.setEmail(email);
            user.setName(StringUtils.hasText(name) ? name : email.substring(0, email.indexOf("@")));
            user.setRole(Role.USER);
            user.setUsername(generateUniqueUsername(email));
            user = userRepository.save(user);
            log.info("Created new OAuth2 user with USER role: {}", email);
        }

        return UserPrincipal.create(user, attributes);
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

    private String extractString(Object value) {
        return value == null ? "" : value.toString();
    }
}