package com.techhiring.platform.repository;

import com.techhiring.platform.entity.JobApplication;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface JobApplicationRepository extends JpaRepository<JobApplication, Long> {
  List<JobApplication> findByCandidateId(Long candidateId);
  List<JobApplication> findByJobPostingId(Long jobPostingId);
}
