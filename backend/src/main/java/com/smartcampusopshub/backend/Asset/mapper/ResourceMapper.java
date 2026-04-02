package com.smartcampusopshub.backend.Asset.mapper;

import com.smartcampusopshub.backend.Asset.dto.AvailabilityWindowRequest;
import com.smartcampusopshub.backend.Asset.dto.AvailabilityWindowResponse;
import com.smartcampusopshub.backend.Asset.dto.ResourceRequest;
import com.smartcampusopshub.backend.Asset.dto.ResourceResponse;
import com.smartcampusopshub.backend.Asset.entity.AvailabilityWindow;
import com.smartcampusopshub.backend.Asset.entity.Equipment;
import com.smartcampusopshub.backend.Asset.entity.Resource;

import java.util.List;
import java.util.stream.Collectors;

public class ResourceMapper {

        private ResourceMapper() {
        }

        public static Resource toEntity(ResourceRequest request) {
                Resource resource = Resource.builder()
                                .name(request.getName())
                                .type(request.getType())
                                .capacity(request.getCapacity())
                                .location(request.getLocation())
                                .status(request.getStatus())
                                .build();

                if (request.getEquipmentType() != null && !request.getEquipmentType().isBlank()) {
                        resource.setEquipment(Equipment.builder()
                                        .equipmentType(request.getEquipmentType())
                                        .resource(resource)
                                        .build());
                }

                if (request.getAvailabilityWindows() != null) {
                        List<AvailabilityWindow> windows = request.getAvailabilityWindows().stream()
                                        .map(w -> AvailabilityWindow.builder()
                                                        .date(w.getDate())
                                                        .startTime(w.getStartTime())
                                                        .endTime(w.getEndTime())
                                                        .resource(resource)
                                                        .build())
                                        .collect(Collectors.toList());
                        resource.setAvailabilityWindows(windows);
                }

                return resource;
        }

        public static ResourceResponse toResponse(Resource resource) {
                List<AvailabilityWindowResponse> windowResponses = resource.getAvailabilityWindows() != null
                                ? resource.getAvailabilityWindows().stream()
                                                .map(w -> AvailabilityWindowResponse.builder()
                                                                .id(w.getId())
                                                                .date(w.getDate())
                                                                .startTime(w.getStartTime())
                                                                .endTime(w.getEndTime())
                                                                .build())
                                                .collect(Collectors.toList())
                                : List.of();

                return ResourceResponse.builder()
                                .id(resource.getId())
                                .name(resource.getName())
                                .type(resource.getType())
                                .capacity(resource.getCapacity())
                                .location(resource.getLocation())
                                .status(resource.getStatus())
                                .equipmentType(resource.getEquipment() != null
                                                ? resource.getEquipment().getEquipmentType()
                                                : null)
                                .availabilityWindows(windowResponses)
                                .build();
        }

        public static void updateEntity(Resource resource, ResourceRequest request) {
                resource.setName(request.getName());
                resource.setType(request.getType());
                resource.setCapacity(request.getCapacity());
                resource.setLocation(request.getLocation());
                resource.setStatus(request.getStatus());

                if (request.getEquipmentType() != null && !request.getEquipmentType().isBlank()) {
                        if (resource.getEquipment() == null) {
                                resource.setEquipment(Equipment.builder()
                                                .equipmentType(request.getEquipmentType())
                                                .resource(resource)
                                                .build());
                        } else {
                                resource.getEquipment().setEquipmentType(request.getEquipmentType());
                        }
                } else {
                        resource.setEquipment(null);
                }

                // Clear existing windows and add new ones
                resource.getAvailabilityWindows().clear();
                if (request.getAvailabilityWindows() != null) {
                        List<AvailabilityWindow> newWindows = request.getAvailabilityWindows().stream()
                                        .map(w -> AvailabilityWindow.builder()
                                                        .date(w.getDate())
                                                        .startTime(w.getStartTime())
                                                        .endTime(w.getEndTime())
                                                        .resource(resource)
                                                        .build())
                                        .collect(Collectors.toList());
                        resource.getAvailabilityWindows().addAll(newWindows);
                }
        }
}