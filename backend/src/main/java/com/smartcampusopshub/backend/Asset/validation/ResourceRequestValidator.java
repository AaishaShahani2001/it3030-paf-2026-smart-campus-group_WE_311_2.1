package com.smartcampusopshub.backend.Asset.validation;

import com.smartcampusopshub.backend.Asset.dto.AvailabilityWindowRequest;
import com.smartcampusopshub.backend.Asset.dto.ResourceRequest;
import com.smartcampusopshub.backend.Asset.entity.ResourceType;
import org.springframework.stereotype.Component;

@Component
public class ResourceRequestValidator {

    public void validate(ResourceRequest request) {
        validateTimeWindows(request);
        validateEquipmentData(request);
    }

    private void validateTimeWindows(ResourceRequest request) {
        if (request.getAvailabilityWindows() != null) {
            java.util.List<AvailabilityWindowRequest> windows = request.getAvailabilityWindows();
            for (int i = 0; i < windows.size(); i++) {
                AvailabilityWindowRequest window1 = windows.get(i);
                
                if (window1.getStartTime() != null && window1.getEndTime() != null) {
                    if (!window1.getStartTime().isBefore(window1.getEndTime())) {
                        throw new IllegalArgumentException(
                                "Start time must be before end time for each availability window");
                    }
                }
                
                for (int j = i + 1; j < windows.size(); j++) {
                    AvailabilityWindowRequest window2 = windows.get(j);
                    if (window1.getDate() != null && window1.getDate().equals(window2.getDate()) &&
                        window1.getStartTime() != null && window1.getStartTime().equals(window2.getStartTime()) &&
                        window1.getEndTime() != null && window1.getEndTime().equals(window2.getEndTime())) {
                        
                        throw new IllegalArgumentException("Duplicate time slots are not allowed on the same date");
                    }
                }
            }
        }
    }

    private void validateEquipmentData(ResourceRequest request) {
        if (request.getType() == ResourceType.EQUIPMENT
                && (request.getEquipmentType() == null || request.getEquipmentType().isBlank())) {
            throw new IllegalArgumentException("Equipment type is required when resource type is EQUIPMENT");
        }
    }
}