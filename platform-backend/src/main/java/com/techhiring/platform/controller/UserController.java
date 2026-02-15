package com.techhiring.platform.controller;

import com.techhiring.platform.dto.UserProfileDTO;
import com.techhiring.platform.entity.Candidate;
import com.techhiring.platform.entity.Interviewer;
import com.techhiring.platform.entity.User;
import com.techhiring.platform.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

  private final UserRepository userRepository;

  @GetMapping("/profile")
  public ResponseEntity<UserProfileDTO> getUserProfile() {
    Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
    String currentEmail = authentication.getName();

    User user = userRepository.findByEmail(currentEmail)
        .orElseThrow(() -> new RuntimeException("User not found"));

    UserProfileDTO.UserProfileDTOBuilder builder = UserProfileDTO.builder()
        .id(user.getId())
        .email(user.getEmail())
        .fullName(user.getFullName())
        .role(user.getRole());

    if (user instanceof Candidate) {
      Candidate candidate = (Candidate) user;
      builder.phone(candidate.getPhone())
             .bio(candidate.getBio())
             .profilePhotoUrl(candidate.getProfilePhotoUrl());
    } else if (user instanceof Interviewer) {
       Interviewer interviewer = (Interviewer) user;
       builder.phone(interviewer.getPhone())
              .bio(interviewer.getBio())
              .profilePhotoUrl(interviewer.getProfilePhotoUrl())
              .hourlyRate(interviewer.getHourlyRate())
              .availabilityStatus(interviewer.getAvailabilityStatus());
    }

    return ResponseEntity.ok(builder.build());
  }

  @org.springframework.web.bind.annotation.PutMapping("/profile")
  public ResponseEntity<UserProfileDTO> updateProfile(@org.springframework.web.bind.annotation.RequestBody com.techhiring.platform.dto.UpdateProfileRequest request) {
      Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
      String currentEmail = authentication.getName();

      User user = userRepository.findByEmail(currentEmail)
          .orElseThrow(() -> new RuntimeException("User not found"));

      if (request.getFullName() != null) user.setFullName(request.getFullName());
      
      if (user instanceof Candidate) {
          Candidate candidate = (Candidate) user;
          if (request.getPhone() != null) candidate.setPhone(request.getPhone());
          if (request.getBio() != null) candidate.setBio(request.getBio());
          if (request.getProfilePhotoUrl() != null) candidate.setProfilePhotoUrl(request.getProfilePhotoUrl());
      } else if (user instanceof Interviewer) {
          Interviewer interviewer = (Interviewer) user;
          if (request.getPhone() != null) interviewer.setPhone(request.getPhone());
          if (request.getBio() != null) interviewer.setBio(request.getBio());
          if (request.getProfilePhotoUrl() != null) interviewer.setProfilePhotoUrl(request.getProfilePhotoUrl());
          if (request.getHourlyRate() != null) interviewer.setHourlyRate(request.getHourlyRate());
          if (request.getAvailabilityStatus() != null) interviewer.setAvailabilityStatus(request.getAvailabilityStatus());
      }

      userRepository.save(user);

      // Return updated profile
      return getUserProfile();
  }
}
