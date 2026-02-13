package com.techhiring.platform.repository;

import com.techhiring.platform.entity.InterviewerJob;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface InterviewerJobRepository extends JpaRepository<InterviewerJob, Long> {
    List<InterviewerJob> findByStatus(String status);
}
