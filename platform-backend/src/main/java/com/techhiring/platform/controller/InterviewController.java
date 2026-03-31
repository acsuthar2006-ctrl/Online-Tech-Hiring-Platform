package com.techhiring.platform.controller;

import com.techhiring.platform.dto.ScheduleRequest;
import com.techhiring.platform.entity.Interview;
import com.techhiring.platform.service.EmailService;
import com.techhiring.platform.service.InterviewService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;


import java.util.Map;
import jakarta.servlet.http.HttpServletRequest;

@RestController
@RequestMapping("/api/interviews")
@RequiredArgsConstructor
@CrossOrigin(origins = "*", maxAge = 3600)
public class InterviewController {

  private final InterviewService interviewService;
  private final EmailService emailService;

  @org.springframework.beans.factory.annotation.Value("${app.frontend.url:http://localhost:5173}")
  private String frontendUrl;

  @PostMapping("/schedule")
  @org.springframework.security.access.prepost.PreAuthorize("hasRole('INTERVIEWER')")
  public ResponseEntity<Interview> scheduleInterview(@RequestBody ScheduleRequest request, HttpServletRequest httpRequest) {
    // If scheduledTime is null/empty, parse from string if needed, or assume
    // Jackson handles ISO8601
    String interviewerIdentifier = request.getInterviewerId() != null 
        ? request.getInterviewerId().toString() 
        : request.getInterviewerEmail();
    
    String origin = httpRequest.getHeader("Origin");
    if (origin == null || origin.isEmpty()) {
       origin = frontendUrl;
    }

    Interview interview = interviewService.scheduleInterview(
        interviewerIdentifier,
        request.getCandidateEmail(),
        request.getCandidateName(),
        request.getScheduledTime(),
        request.getTitle(),
        request.getMeetingLink(),
        request.getDescription(),
        request.getDurationMinutes(),
        request.getInterviewType(),
        request.getCompanyId(),
        request.getPositionId(),
        origin);
    return ResponseEntity.ok(interview);
  }

  @GetMapping("/session/{meetingLink}/queue")
  public ResponseEntity<Map<String, Object>> getSessionQueue(@PathVariable String meetingLink) {
    return ResponseEntity.ok(interviewService.getSessionQueue(meetingLink));
  }

  @PostMapping("/{id}/complete")
  @org.springframework.security.access.prepost.PreAuthorize("hasRole('INTERVIEWER')")
  public ResponseEntity<Interview> completeAndGetNext(@PathVariable Long id,
      @RequestBody(required = false) com.techhiring.platform.dto.CompletionRequest request) {
    Interview next = interviewService.completeAndGetNext(id, request);
    // If next is null, it means no more scheduled candidates immediately
    return ResponseEntity.ok(next);
  }

  @GetMapping("/{id}/status")
  public ResponseEntity<Map<String, String>> getStatus(@PathVariable Long id) {
    Interview.InterviewStatus status = interviewService.getCandidateStatus(id);
    return ResponseEntity.ok(Map.of("status", status.name()));
  }

  @GetMapping("/candidate/upcoming")
  @org.springframework.security.access.prepost.PreAuthorize("hasRole('CANDIDATE')")
  public ResponseEntity<?> getUpcomingInterviews(@RequestParam String email) {
    return ResponseEntity.ok(interviewService.getUpcomingInterviews(email));
  }

  @GetMapping("/interviewer/upcoming")
  @org.springframework.security.access.prepost.PreAuthorize("hasRole('INTERVIEWER')")
  public ResponseEntity<?> getUpcomingInterviewsForInterviewer(@RequestParam String email) {
    return ResponseEntity.ok(interviewService.getUpcomingInterviewsForInterviewer(email));
  }

  @PostMapping("/{id}/start")
  public ResponseEntity<?> startInterview(@PathVariable Long id) {
    try {
      interviewService.startInterview(id);
      return ResponseEntity.ok().build();
    } catch (Exception e) {
      e.printStackTrace();
      return ResponseEntity.status(500).body("Error starting interview: " + e.getMessage());
    }
  }

  @PostMapping("/{id}/remind")
  public ResponseEntity<String> sendManualReminder(@PathVariable Long id, HttpServletRequest httpRequest) {
    Interview interview = interviewService.getInterview(id);
    String companyName   = (interview.getCompany()   != null) ? interview.getCompany().getCompanyName()          : "N/A";
    String positionTitle = (interview.getPosition()  != null) ? interview.getPosition().getPositionTitle()      : "N/A";
    
    String origin = httpRequest.getHeader("Origin");
    if (origin == null || origin.isEmpty()) {
        origin = frontendUrl;
    }

    emailService.sendManualNudge(
        interview.getCandidate().getEmail(),
        interview.getCandidate().getFullName(),
        origin + "/interview-screen/video-interview.html?room=" + interview.getMeetingLink() + "&role=candidate&email=" + interview.getCandidate().getEmail(),
        companyName,
        positionTitle);
    return ResponseEntity.ok("Reminder sent");
  }

  @PutMapping("/{id}/presence")
  public ResponseEntity<?> updatePresence(@PathVariable Long id) {
    interviewService.updatePresence(id);
    return ResponseEntity.ok().build();
  }

  @PatchMapping("/{id}/outcome")
  @org.springframework.security.access.prepost.PreAuthorize("hasRole('INTERVIEWER')")
  public ResponseEntity<Interview> updateOutcome(@PathVariable Long id, @RequestParam String result) {
      return ResponseEntity.ok(interviewService.updateCandidateOutcome(id, result));
  }
}
