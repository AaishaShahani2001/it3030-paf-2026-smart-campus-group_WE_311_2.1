package com.smartcampusopshub.backend.booking.repository;

import com.smartcampusopshub.backend.booking.entity.Booking;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface BookingRepository extends JpaRepository<Booking, Long> {

    List<Booking> findByUserId(String userId); 

    List<Booking> findByResourceId(Long resourceId);

    List<Booking> findByResourceIdOrderByStartTimeAsc(Long resourceId);

    @Query("""
        SELECT b FROM Booking b
        WHERE b.resourceId = :resourceId
        AND b.status IN ('PENDING', 'APPROVED')
        AND b.startTime < :endTime
        AND b.endTime > :startTime
        """)
        List<Booking> findConflictingBookings(
                @Param("resourceId") Long resourceId,
                @Param("endTime") LocalDateTime endTime,
                @Param("startTime") LocalDateTime startTime
        );
}