package com.techhiring.platform.service;

import com.techhiring.platform.entity.Application;
import com.techhiring.platform.entity.Interviewer;
import com.techhiring.platform.entity.InterviewerApplication;
import com.techhiring.platform.repository.ApplicationRepository;
import com.techhiring.platform.repository.InterviewerApplicationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ApplicationService {

  private final ApplicationRepository applicationRepository;
  private final InterviewerApplicationRepository interviewerApplicationRepository;

  /**
   * Saves the application then automatically assigns it to the approved interviewer
   * for that position who currently has the fewest assigned candidates (least-loaded).
   * Ties are broken by earliest-approved order (lowest InterviewerApplication ID).
   * If no interviewers are approved yet, the application is saved without an assignment.
   */
  @Transactional
  public Application createApplication(Application application) {
    // Save first so this application exists in DB before counting
    Application saved = applicationRepository.save(application);

    Long positionId = saved.getPosition() != null ? saved.getPosition().getId() : null;
    if (positionId == null) {
      return saved;
    }

    // Fetch all APPROVED interviewer-applications for the position, ordered by ID (tie-breaker)
    List<InterviewerApplication> approved =
        interviewerApplicationRepository.findByPositionIdAndStatusOrderByIdAsc(positionId, "APPROVED");

    if (approved.isEmpty()) {
      // No approved interviewers yet – leave unassigned
      return saved;
    }

    // Build a map: interviewerId -> count of already-assigned applications for this position
    // (includes the one we just saved, but it has no assignedInterviewer yet, so it won't skew counts)
    List<Application> allAssigned = applicationRepository.findByPosition_Id(positionId)
        .stream()
        .filter(a -> a.getAssignedInterviewer() != null)
        .collect(Collectors.toList());

    Map<Long, Long> assignedCount = allAssigned.stream()
        .collect(Collectors.groupingBy(
            a -> a.getAssignedInterviewer().getId(),
            Collectors.counting()
        ));

    // Pick the approved interviewer with the minimum assigned count; tiebreak = lowest IA id (order already sorted)
    InterviewerApplication chosen = approved.stream()
        .min(Comparator.comparingLong(
            ia -> assignedCount.getOrDefault(ia.getInterviewer().getId(), 0L)
        ))
        .orElse(null);

    if (chosen == null) {
      return saved;
    }

    saved.setAssignedInterviewer(chosen.getInterviewer());
    return applicationRepository.save(saved);
  }

  public Optional<Application> getApplicationById(Long id) {
    return applicationRepository.findById(id);
  }

  public List<Application> getApplicationsByCandidate(Long candidateId) {
    return applicationRepository.findByCandidateId(candidateId);
  }

  public List<Application> getApplicationsByPosition(Long positionId) {
    return applicationRepository.findByPositionId(positionId);
  }

  public Application updateApplicationStatus(Long id, String status) {
    Application application = applicationRepository.findById(id)
        .orElseThrow(() -> new RuntimeException("Application not found"));
    
    application.setStatus(status);
    return applicationRepository.save(application);
  }

  public void deleteApplication(Long id) {
    applicationRepository.deleteById(id);
  }
}
