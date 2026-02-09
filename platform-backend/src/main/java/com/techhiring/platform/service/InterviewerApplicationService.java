package com.techhiring.platform.service;

import com.techhiring.platform.entity.InterviewerApplication;
import com.techhiring.platform.repository.InterviewerApplicationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class InterviewerApplicationService {

  private final InterviewerApplicationRepository interviewerApplicationRepository;

  public InterviewerApplication createApplication(InterviewerApplication application) {
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
