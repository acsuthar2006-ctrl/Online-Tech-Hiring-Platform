package com.techhiring.platform.dto;

import lombok.Data;

@Data
public class UpdateProfileRequest {
    private String fullName;
    private String phone;
    private String bio;
    private String profilePhotoUrl;
    
    // Interviewer specific
    private Double hourlyRate;
    private String availabilityStatus;
}
