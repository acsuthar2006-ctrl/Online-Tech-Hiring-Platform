package com.techhiring.platform.repository;

import com.techhiring.platform.entity.Application;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ApplicationRepository extends JpaRepository<Application, Long> {
  List<Application> findByCandidateId(Long candidateId);
  List<Application> findByPositionId(Long positionId);
  List<Application> findByStatus(String status);
  List<Application> findByCandidateIdAndPositionId(Long candidateId, Long positionId);
}
