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

    // 3. Ensure Candidate exists (User's email)
    Candidate candidate = (Candidate) userRepository.findByEmail(targetEmail)
        .orElseGet(() -> {
          Candidate c = new Candidate("Aarya Suthar", targetEmail, passwordEncoder.encode("pass"), null, null);
          return candidateRepository.save(c);
        });

    // 4. Create Interview scheduled 27 minutes from now (To verify reliability -
    // should wait)
    LocalDateTime scheduledDateTime = LocalDateTime.now().plusMinutes(27);

    Interview interview = Interview.builder()
        .title("Test Auto-Email Interview")
        .interviewer(interviewer)
        .candidate(candidate)
        .scheduledDate(scheduledDateTime.toLocalDate())
        .scheduledTime(scheduledDateTime.toLocalTime())
        .meetingLink("test-link-" + System.currentTimeMillis())
        .status(Interview.InterviewStatus.SCHEDULED)
        .interviewType(InterviewType.TECHNICAL)
        .description("This is a test interview to verify email notifications.")
        .build();

    interviewRepository.save(interview);

    log.info("--- TestEmailRunner: Created Interview ID {} for {} at {} {} ---",
        interview.getId(), targetEmail, scheduledDateTime.toLocalDate(), scheduledDateTime.toLocalTime());
    log.info("--- TestEmailRunner: Scheduler should pick this up in ~1 minute ---");
  }
}
