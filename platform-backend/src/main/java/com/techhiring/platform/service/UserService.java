package com.techhiring.platform.service;

import com.techhiring.platform.dto.AuthDto;
import com.techhiring.platform.entity.Candidate;
import com.techhiring.platform.entity.Company;
import com.techhiring.platform.entity.CompanyAdmin;
import com.techhiring.platform.entity.Interviewer;
import com.techhiring.platform.entity.User;
import com.techhiring.platform.repository.CompanyRepository;
import com.techhiring.platform.repository.UserRepository;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class UserService {

  private final UserRepository userRepository;
  private final CompanyRepository companyRepository;
  private final PasswordEncoder passwordEncoder;

  @Transactional
  public User registerUser(AuthDto.SignupRequest request) {
    if (userRepository.existsByEmail(request.getEmail())) {
      throw new RuntimeException("Error: Email is already in use!");
    }

    User user;
    if ("CANDIDATE".equalsIgnoreCase(request.getRole())) {
      user = new Candidate(request.getFullName(), request.getEmail(), passwordEncoder.encode(request.getPassword()));
    } else if ("INTERVIEWER".equalsIgnoreCase(request.getRole())) {
      Interviewer interviewer = new Interviewer();
      interviewer.setFullName(request.getFullName());
      interviewer.setEmail(request.getEmail());
      interviewer.setPassword(passwordEncoder.encode(request.getPassword()));
      interviewer.setRole("INTERVIEWER");
      interviewer.setAvailabilityStatus("AVAILABLE");
      interviewer.setHourlyRate(0.0);
      interviewer.setTotalEarnings(0.0);
      interviewer.setTotalInterviewsConducted(0);
      interviewer.setAverageRating(0.0);
      user = interviewer;
    } else if ("COMPANY_ADMIN".equalsIgnoreCase(request.getRole())) {
      if (request.getCompanyName() == null || request.getCompanyName().isBlank()) {
        throw new RuntimeException("Error: Company name is required for Company Admin registration!");
      }
      // Create the company first
      Company company = new Company();
      company.setCompanyName(request.getCompanyName());
      company.setEmail(request.getEmail());
      Company savedCompany = companyRepository.save(company);

      // Create the admin user linked to the company
      CompanyAdmin admin = new CompanyAdmin();
      admin.setFullName(request.getFullName());
      admin.setEmail(request.getEmail());
      admin.setPassword(passwordEncoder.encode(request.getPassword()));
      admin.setRole("COMPANY_ADMIN");
      admin.setCompany(savedCompany);
      user = admin;
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
