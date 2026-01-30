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
  private final com.techhiring.platform.repository.CompanyRepository companyRepository; // Inject
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
      // Find or create company
      String companyName = request.getCompanyName();
      if (companyName == null || companyName.isEmpty()) {
        throw new RuntimeException("Error: Company name is required for Interviewers");
      }
      com.techhiring.platform.entity.Company company = companyRepository.findByName(companyName)
          .orElseGet(
              () -> companyRepository.save(com.techhiring.platform.entity.Company.builder().name(companyName).build()));

      user = new Interviewer(request.getFullName(), request.getEmail(), passwordEncoder.encode(request.getPassword()),
          company);
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
