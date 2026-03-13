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
  private java.time.LocalDateTime createdAt;

  // Common fields
  private String phone;
  private String bio;
  private String profilePhotoUrl;
  private String location; // Candidate-specific

  // Interviewer specific
  private String companyName;
  private Double hourlyRate;
  private String availabilityStatus;
  private Integer totalInterviewsConducted;
  private Double averageRating;
  private Double totalEarnings;
}
