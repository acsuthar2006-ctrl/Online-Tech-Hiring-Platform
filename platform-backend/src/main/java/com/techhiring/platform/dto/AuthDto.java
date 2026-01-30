package com.techhiring.platform.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

public class AuthDto {

  @Data
  @NoArgsConstructor
  @AllArgsConstructor
  public static class SignupRequest {
    private String email;
    private String password;
    private String fullName;
    private String role;

    // Candidate Specific
    private String resumeUrl;
    private String skills;

    // Interviewer Specific
    private String companyName;
  }

  @Data
  @NoArgsConstructor
  @AllArgsConstructor
  public static class LoginRequest {
    private String email;
    private String password;
  }

  @Data
  @NoArgsConstructor
  @AllArgsConstructor
  public static class JwtResponse {
    private String token;
    private String message;
    private Long userId;
    private String role;
    private String fullName;
  }
}
