package com.smartcampusopshub.backend.notification;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.util.Collection;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailNotificationService {

    private final JavaMailSender mailSender;

    @Value("${app.email.from:}")
    private String fromAddress;

    public void sendEmail(String to, String subject, String body) {
        if (!StringUtils.hasText(to)) {
            return;
        }
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            if (StringUtils.hasText(fromAddress)) {
                message.setFrom(fromAddress);
            }
            message.setTo(to.trim());
            message.setSubject(subject);
            message.setText(body);
            mailSender.send(message);
        } catch (Exception ex) {
            log.warn("Failed to send email to {} with subject '{}': {}", to, subject, ex.getMessage());
        }
    }

    public void sendEmailToMany(Collection<String> recipients, String subject, String body) {
        if (recipients == null || recipients.isEmpty()) {
            return;
        }
        recipients.stream()
                .filter(StringUtils::hasText)
                .map(String::trim)
                .distinct()
                .forEach(recipient -> sendEmail(recipient, subject, body));
    }
}
