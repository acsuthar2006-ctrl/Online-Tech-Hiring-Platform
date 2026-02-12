package com.techhiring.platform.controller;

import com.techhiring.platform.service.EmailService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/test")
@RequiredArgsConstructor
public class TestController {

  private final EmailService emailService;

  @PostMapping("/send-email")
  public ResponseEntity<String> testEmail(@RequestParam String email) {
    try {
      emailService.sendInterviewInvitation(
          email,
          "Test User",
          "2026-12-31",
          "10:00 AM",
          "http://localhost:5173/?room=test-room&role=candidate"
      );
      return ResponseEntity.ok("Test email sent to: " + email);
    } catch (Exception e) {
      return ResponseEntity.status(500).body("Failed to send email: " + e.getMessage());
    }
  }
}
