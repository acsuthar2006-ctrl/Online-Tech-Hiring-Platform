package com.techhiring.platform.controller;

import com.techhiring.platform.dto.AuthDto;
import com.techhiring.platform.entity.User;
import com.techhiring.platform.service.UserService;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*") // Allow requests from any frontend (Node.js)
@RequiredArgsConstructor
public class AuthController {

  private final UserService userService;

  @PostMapping("/signup")
  public ResponseEntity<?> registerUser(@RequestBody AuthDto.SignupRequest signupRequest) {
    try {
      User user = userService.registerUser(signupRequest);
      return ResponseEntity.ok(new AuthDto.JwtResponse("User registered successfully!", user.getId(), user.getRole()));
    } catch (RuntimeException e) {
      return ResponseEntity.badRequest().body(e.getMessage());
    }
  }

  @PostMapping("/login")
  public ResponseEntity<?> loginUser(@RequestBody AuthDto.LoginRequest loginRequest) {
    try {
      User user = userService.authenticateUser(loginRequest);
      return ResponseEntity.ok(new AuthDto.JwtResponse("Login successful", user.getId(), user.getRole()));
    } catch (RuntimeException e) {
      return ResponseEntity.status(401).body(e.getMessage());
    }
  }
}
