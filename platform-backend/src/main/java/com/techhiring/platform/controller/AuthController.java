package com.techhiring.platform.controller;

import com.techhiring.platform.dto.AuthDto;
import com.techhiring.platform.entity.User;
import com.techhiring.platform.service.UserService;

import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.web.bind.annotation.*;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class AuthController {

  private final UserService userService;
  private final AuthenticationManager authenticationManager;
  private final com.techhiring.platform.security.JwtUtils jwtUtils;

  @PostMapping("/signup")
  public ResponseEntity<?> registerUser(@RequestBody AuthDto.SignupRequest signupRequest) {
    try {
      User user = userService.registerUser(signupRequest);
      return ResponseEntity.ok(
          new AuthDto.JwtResponse(null, "User registered successfully!", user.getId(), user.getRole(),
              user.getFullName()));
    } catch (RuntimeException e) {
      return ResponseEntity.badRequest().body(e.getMessage());
    }
  }

  @PostMapping("/login")
  public ResponseEntity<?> loginUser(@RequestBody AuthDto.LoginRequest loginRequest) {
    try {
      org.springframework.security.core.Authentication authentication = authenticationManager.authenticate(
          new org.springframework.security.authentication.UsernamePasswordAuthenticationToken(loginRequest.getEmail(),
              loginRequest.getPassword()));

      org.springframework.security.core.context.SecurityContextHolder.getContext().setAuthentication(authentication);
      String jwt = jwtUtils.generateJwtToken(authentication);

      org.springframework.security.core.userdetails.UserDetails userDetails = (org.springframework.security.core.userdetails.UserDetails) authentication
          .getPrincipal();
      User user = userService.findByEmail(userDetails.getUsername()); // We need to fetch the entity to get ID and Role

      return ResponseEntity.ok(new AuthDto.JwtResponse(
          jwt,
          "Login successful",
          user.getId(),
          user.getRole(),
          user.getFullName()));
    } catch (org.springframework.security.core.AuthenticationException e) {
      return ResponseEntity.status(401).body("Error: Invalid email or password");
    }
  }
}
