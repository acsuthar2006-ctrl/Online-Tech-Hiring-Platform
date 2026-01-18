package com.techhiring.platform.dto;

public class AuthDto {

  public static class SignupRequest {
    private String email;
    private String password;
    private String role;

    public String getEmail() {
      return email;
    }

    public void setEmail(String email) {
      this.email = email;
    }

    public String getPassword() {
      return password;
    }

    public void setPassword(String password) {
      this.password = password;
    }

    public String getRole() {
      return role;
    }

    public void setRole(String role) {
      this.role = role;
    }
  }

  public static class LoginRequest {
    private String email;
    private String password;

    public String getEmail() {
      return email;
    }

    public void setEmail(String email) {
      this.email = email;
    }

    public String getPassword() {
      return password;
    }

    public void setPassword(String password) {
      this.password = password;
    }
  }

  public static class JwtResponse {
    private String message;
    private Long userId;
    private String role;

    public JwtResponse(String message, Long userId, String role) {
      this.message = message;
      this.userId = userId;
      this.role = role;
    }

    public String getMessage() {
      return message;
    }

    public Long getUserId() {
      return userId;
    }

    public String getRole() {
      return role;
    }
  }
}
