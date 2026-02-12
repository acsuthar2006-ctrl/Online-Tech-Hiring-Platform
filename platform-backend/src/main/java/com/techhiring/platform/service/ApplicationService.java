package com.techhiring.platform.service;

import com.techhiring.platform.entity.Application;
import com.techhiring.platform.repository.ApplicationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class ApplicationService {

  private final ApplicationRepository applicationRepository;

  public Application createApplication(Application application) {
    return applicationRepository.save(application);
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
