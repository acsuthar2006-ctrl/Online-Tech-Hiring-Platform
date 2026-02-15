package com.techhiring.platform.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserProfileDTO {
  private Long id;
  private String email;
  private String fullName;
  private String role;

  // Common fields
  private String phone;
  private String bio;
  private String profilePhotoUrl;

  // Interviewer specific
  private String companyName;
  private Double hourlyRate;
  private String availabilityStatus;
}
