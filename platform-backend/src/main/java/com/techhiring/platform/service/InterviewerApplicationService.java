package com.techhiring.platform.service;

import com.techhiring.platform.entity.InterviewerApplication;
import com.techhiring.platform.entity.Position;
import com.techhiring.platform.repository.InterviewerApplicationRepository;
import com.techhiring.platform.repository.PositionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class InterviewerApplicationService {

  private final InterviewerApplicationRepository interviewerApplicationRepository;
  private final PositionRepository positionRepository;

  public InterviewerApplication createApplication(InterviewerApplication application) {
    // New behavior: interviewer applies for a specific position
    if (application.getPosition() != null && application.getPosition().getId() != null) {
      Long positionId = application.getPosition().getId();
      Position pos = positionRepository.findById(positionId)
          .orElseThrow(() -> new RuntimeException("Position not found"));

      if (application.getInterviewer() == null || application.getInterviewer().getId() == null) {
        throw new RuntimeException("Interviewer is required");
      }

      // Prevent duplicate applications for the same position
      interviewerApplicationRepository
          .findByInterviewerIdAndPositionId(application.getInterviewer().getId(), positionId)
          .ifPresent(existing -> {
            throw new RuntimeException("Already applied for this position");
          });

      application.setCompany(pos.getCompany());
      application.setPosition(pos);
      if (application.getStatus() == null || application.getStatus().trim().isEmpty()) {
        application.setStatus("APPLIED");
      }
    }
    return interviewerApplicationRepository.save(application);
  }

  public Optional<InterviewerApplication> getApplicationById(Long id) {
    return interviewerApplicationRepository.findById(id);
  }

  public List<InterviewerApplication> getApplicationsByInterviewer(Long interviewerId) {
    return interviewerApplicationRepository.findByInterviewerId(interviewerId);
  }

  public List<InterviewerApplication> getApplicationsByCompany(Long companyId) {
    return interviewerApplicationRepository.findByCompanyId(companyId);
  }

  public InterviewerApplication updateApplicationStatus(Long id, String status) {
    InterviewerApplication application = interviewerApplicationRepository.findById(id)
        .orElseThrow(() -> new RuntimeException("Interviewer application not found"));
    
    application.setStatus(status);
    return interviewerApplicationRepository.save(application);
  }

  public void deleteApplication(Long id) {
    interviewerApplicationRepository.deleteById(id);
  }
}
