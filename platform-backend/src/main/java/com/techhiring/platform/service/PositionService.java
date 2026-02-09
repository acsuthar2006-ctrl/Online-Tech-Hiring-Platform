package com.techhiring.platform.service;

import com.techhiring.platform.entity.Position;
import com.techhiring.platform.repository.PositionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class PositionService {

  private final PositionRepository positionRepository;

  public Position createPosition(Position position) {
    return positionRepository.save(position);
  }

  public Optional<Position> getPositionById(Long id) {
    return positionRepository.findById(id);
  }

  public List<Position> getAllPositions() {
    return positionRepository.findAll();
  }

  public List<Position> getPositionsByCompany(Long companyId) {
    return positionRepository.findByCompanyId(companyId);
  }

  public List<Position> getOpenPositions() {
    return positionRepository.findByStatus("OPEN");
  }

  public Position updatePosition(Long id, Position positionDetails) {
    Position position = positionRepository.findById(id)
        .orElseThrow(() -> new RuntimeException("Position not found"));
    
    position.setPositionTitle(positionDetails.getPositionTitle());
    position.setJobDescription(positionDetails.getJobDescription());
    position.setSalaryRange(positionDetails.getSalaryRange());
    position.setRequiredExpertise(positionDetails.getRequiredExpertise());
    position.setStatus(positionDetails.getStatus());
    
    return positionRepository.save(position);
  }

  public void deletePosition(Long id) {
    positionRepository.deleteById(id);
  }
}
