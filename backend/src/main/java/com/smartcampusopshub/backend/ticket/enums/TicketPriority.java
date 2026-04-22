package com.smartcampusopshub.backend.ticket.enums;

import java.time.Duration;

public enum TicketPriority {
    LOW,
    MEDIUM,
    HIGH,
    CRITICAL;

    public Duration resolutionSla() {
        return switch (this) {
            case LOW -> Duration.ofHours(72);
            case MEDIUM -> Duration.ofHours(48);
            case HIGH -> Duration.ofHours(24);
            case CRITICAL -> Duration.ofHours(8);
        };
    }

    public Duration firstResponseSla() {
        return switch (this) {
            case LOW -> Duration.ofHours(12);
            case MEDIUM -> Duration.ofHours(8);
            case HIGH -> Duration.ofHours(4);
            case CRITICAL -> Duration.ofHours(1);
        };
    }
}
