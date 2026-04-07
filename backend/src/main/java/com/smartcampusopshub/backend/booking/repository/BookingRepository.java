package com.smartcampusopshub.backend.booking.repository;

import com.smartcampusopshub.backend.booking.entity.Booking;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;

import java.time.LocalDateTime;

public interface BookingRepository extends JpaRepository<Booking, Long> {

    List<Booking> findByUserId(Long userId);

    List<Booking> findByResourceId(Long resourceId);

    List<Booking> findByResourceIdAndStartTimeLessThanAndEndTimeGreaterThan(
        Long resourceId,
        LocalDateTime endTime,
        LocalDateTime startTime
        );

    List<Booking> findByResourceIdAndStartTimeBetweenOrderByStartTime(
        Long resourceId,
        LocalDateTime startOfDay,
        LocalDateTime endOfDay
        );

    List<Booking> findByResourceIdOrderByStartTimeAsc(Long resourceId);
}