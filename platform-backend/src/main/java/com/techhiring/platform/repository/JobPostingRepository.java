package com.techhiring.platform.repository;

import com.techhiring.platform.entity.JobPosting;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface JobPostingRepository extends JpaRepository<JobPosting, Long> {
  List<JobPosting> findByCompanyId(Long companyId);
  List<JobPosting> findByStatus(JobPosting.JobStatus status);
}
