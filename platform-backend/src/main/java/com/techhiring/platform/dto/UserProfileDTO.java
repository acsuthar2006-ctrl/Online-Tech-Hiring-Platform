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

  // Candidate specific
  private String resumeUrl;
  private String skills;

  // Interviewer specific
  private String companyName;
}
