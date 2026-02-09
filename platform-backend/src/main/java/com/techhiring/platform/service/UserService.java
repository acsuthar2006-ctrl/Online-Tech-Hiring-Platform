package com.techhiring.platform.service;

import com.techhiring.platform.dto.AuthDto;
import com.techhiring.platform.entity.Candidate;
import com.techhiring.platform.entity.Interviewer;
import com.techhiring.platform.entity.User;
import com.techhiring.platform.repository.UserRepository;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class UserService {

  private final UserRepository userRepository;
  // companyRepository removed
  private final PasswordEncoder passwordEncoder;

  public User registerUser(AuthDto.SignupRequest request) {
    if (userRepository.existsByEmail(request.getEmail())) {
      throw new RuntimeException("Error: Email is already in use!");
    }

    User user;
    if ("CANDIDATE".equalsIgnoreCase(request.getRole())) {
      user = new Candidate(request.getFullName(), request.getEmail(), passwordEncoder.encode(request.getPassword()),
          request.getResumeUrl(), request.getSkills());
    } else if ("INTERVIEWER".equalsIgnoreCase(request.getRole())) {
      user = Interviewer.builder()
          .fullName(request.getFullName())
          .email(request.getEmail())
          .password(passwordEncoder.encode(request.getPassword()))
          .role("INTERVIEWER")
          .build();
    } else {
      throw new RuntimeException("Error: Invalid role!");
    }

    return userRepository.save(user);
  }

  public User findByEmail(String email) {
    return userRepository.findByEmail(email)
        .orElseThrow(() -> new RuntimeException("Error: User not found with email: " + email));
  }
}
