package com.techhiring.platform.repository;

import com.techhiring.platform.entity.InterviewerApplication;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface InterviewerApplicationRepository extends JpaRepository<InterviewerApplication, Long> {
  List<InterviewerApplication> findByInterviewerId(Long interviewerId);
  List<InterviewerApplication> findByCompanyId(Long companyId);
  List<InterviewerApplication> findByPositionId(Long positionId);
  Optional<InterviewerApplication> findByInterviewerIdAndPositionId(Long interviewerId, Long positionId);
  List<InterviewerApplication> findByStatus(String status);
  List<InterviewerApplication> findByCompanyIdAndStatus(Long companyId, String status);
  List<InterviewerApplication> findByPositionIdAndStatus(Long positionId, String status);
  List<InterviewerApplication> findByPositionIdAndStatusOrderByIdAsc(Long positionId, String status);
}
