package com.smartcampusopshub.backend.Asset.dto;

import com.smartcampusopshub.backend.Asset.entity.ResourceStatus;
import com.smartcampusopshub.backend.Asset.entity.ResourceType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ResourceResponse {

    private Long id;
    private String name;
    private ResourceType type;
    private Integer capacity;
    private String location;
    private ResourceStatus status;
    private String equipmentType;
    private List<AvailabilityWindowResponse> availabilityWindows;
}