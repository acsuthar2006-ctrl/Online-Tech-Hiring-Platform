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
      builder.skills(candidate.getSkills())
          .resumeUrl(candidate.getResumeUrl());
    } else if (user instanceof Interviewer) {
      Interviewer interviewer = (Interviewer) user;
      builder.companyName(interviewer.getCompanyName());
    }

    return ResponseEntity.ok(builder.build());
  }
}
