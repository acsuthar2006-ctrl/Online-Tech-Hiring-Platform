package com.techhiring.platform.runner;

import com.techhiring.platform.entity.Candidate;
// Company removed
import com.techhiring.platform.entity.Interview;
import com.techhiring.platform.entity.InterviewType;
import com.techhiring.platform.entity.Interviewer;
import com.techhiring.platform.repository.CandidateRepository;
// CompanyRepository removed
import com.techhiring.platform.repository.InterviewRepository;
import com.techhiring.platform.repository.InterviewerRepository;
import com.techhiring.platform.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDateTime;

import org.springframework.context.annotation.Profile;

@Profile({"dev", "test"})
@Slf4j
@Component
@RequiredArgsConstructor
public class TestEmailRunner implements CommandLineRunner {

  private final InterviewRepository interviewRepository;
  private final InterviewerRepository interviewerRepository;
  private final CandidateRepository candidateRepository;
  private final UserRepository userRepository;
  // companyRepository removed
  private final PasswordEncoder passwordEncoder;

  @Override
  public void run(String... args) throws Exception {
    log.info("--- TestEmailRunner: Preparing test data for 'sutharaarya793@gmail.com' ---");

    String targetEmail = "sutharaarya793@gmail.com";
    String interviewerEmail = "interviewer@test.com";

    // 2. Ensure Interviewer exists
    Interviewer interviewer = (Interviewer) userRepository.findByEmail(interviewerEmail)
        .orElseGet(() -> {
          Interviewer i = Interviewer.builder()
              .fullName("Test Interviewer")
              .email(interviewerEmail)
              .password(passwordEncoder.encode("pass"))
              .role("INTERVIEWER")
              .build();
          return interviewerRepository.save(i);
        });

    // 2.1 Ensure Second Interviewer exists (User Request)
    String interviewerEmail2 = "acsuthar2006@gmail.com";
    Interviewer interviewer2 = (Interviewer) userRepository.findByEmail(interviewerEmail2)
        .orElseGet(() -> {
          Interviewer i = Interviewer.builder()
              .fullName("Aa")
              .email(interviewerEmail2)
              .password(passwordEncoder.encode("pass"))
              .role("INTERVIEWER")
              .build();
          return interviewerRepository.save(i);
        });

    log.info("--- TestEmailRunner: Ensure Interviewer 2 ({}) exists ---", interviewer2.getEmail());

    // 3. Ensure Candidate exists (User's email)
    // This creates "sutharaarya793@gmail.com" as a Candidate
    userRepository.findByEmail(targetEmail)
        .orElseGet(() -> {
          Candidate c = new Candidate("Aarya Suthar", targetEmail, passwordEncoder.encode("pass"));
          return candidateRepository.save(c);
        });

  }
}