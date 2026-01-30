package com.techhiring.platform.runner;

import com.techhiring.platform.entity.Candidate;
import com.techhiring.platform.entity.Company;
import com.techhiring.platform.entity.Interview;
import com.techhiring.platform.entity.InterviewType;
import com.techhiring.platform.entity.Interviewer;
import com.techhiring.platform.repository.CandidateRepository;
import com.techhiring.platform.repository.CompanyRepository;
import com.techhiring.platform.repository.InterviewRepository;
import com.techhiring.platform.repository.InterviewerRepository;
import com.techhiring.platform.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDateTime;

@Slf4j
@Component
@RequiredArgsConstructor
public class TestEmailRunner implements CommandLineRunner {

  private final InterviewRepository interviewRepository;
  private final InterviewerRepository interviewerRepository;
  private final CandidateRepository candidateRepository;
  private final UserRepository userRepository;
  private final CompanyRepository companyRepository;
  private final PasswordEncoder passwordEncoder;

  @Override
  public void run(String... args) throws Exception {
    log.info("--- TestEmailRunner: Preparing test data for 'sutharaarya793@gmail.com' ---");

    String targetEmail = "sutharaarya793@gmail.com";
    String interviewerEmail = "interviewer@test.com";

    // 1. Ensure Company Exists
    Company company = companyRepository.findAll().stream().findFirst().orElseGet(() -> {
      Company c = new Company();
      c.setName("Test Company");
      c.setSubscriptionStatus("FREE");
      return companyRepository.save(c);
    });

    // 2. Ensure Interviewer exists
    Interviewer interviewer = (Interviewer) userRepository.findByEmail(interviewerEmail)
        .orElseGet(() -> {
          Interviewer i = new Interviewer("Test Interviewer", interviewerEmail, passwordEncoder.encode("pass"),
              company);
          return interviewerRepository.save(i);
        });

    // 3. Ensure Candidate exists (User's email)
    Candidate candidate = (Candidate) userRepository.findByEmail(targetEmail)
        .orElseGet(() -> {
          Candidate c = new Candidate("Aarya Suthar", targetEmail, passwordEncoder.encode("pass"), null, null);
          return candidateRepository.save(c);
        });

    // 4. Create Interview scheduled 27 minutes from now (To verify reliability -
    // should wait)
    LocalDateTime scheduledTime = LocalDateTime.now().plusMinutes(27);

    Interview interview = Interview.builder()
        .title("Test Auto-Email Interview")
        .interviewer(interviewer)
        .candidate(candidate)
        .scheduledTime(scheduledTime)
        .meetingLink("test-link-" + System.currentTimeMillis())
        .status(Interview.InterviewStatus.SCHEDULED)
        .interviewType(InterviewType.TECHNICAL)
        .description("This is a test interview to verify email notifications.")
        .build();

    interviewRepository.save(interview);

    log.info("--- TestEmailRunner: Created Interview ID {} for {} at {} ---",
        interview.getId(), targetEmail, scheduledTime);
    log.info("--- TestEmailRunner: Scheduler should pick this up in ~1 minute ---");
  }
}
