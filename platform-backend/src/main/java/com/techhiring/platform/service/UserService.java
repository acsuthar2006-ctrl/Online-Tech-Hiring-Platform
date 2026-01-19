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
  private final PasswordEncoder passwordEncoder;

  public User registerUser(AuthDto.SignupRequest request) {
    if (userRepository.existsByEmail(request.getEmail())) {
      throw new RuntimeException("Error: Email is already in use!");
    }

    User user;
    if ("CANDIDATE".equalsIgnoreCase(request.getRole())) {
      user = new Candidate(request.getEmail(), passwordEncoder.encode(request.getPassword()));
    } else if ("INTERVIEWER".equalsIgnoreCase(request.getRole())) {
      user = new Interviewer(request.getEmail(), passwordEncoder.encode(request.getPassword()));
    } else {
      throw new RuntimeException("Error: Invalid role!");
    }

    return userRepository.save(user);
  }

  public User authenticateUser(AuthDto.LoginRequest request) {
    User user = userRepository.findByEmail(request.getEmail())
        .orElseThrow(() -> new RuntimeException("Error: User not found"));

    if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
      throw new RuntimeException("Error: Invalid credentials");
    }

    return user;
  }
}
