package com.techhiring.platform.repository;

import com.techhiring.platform.entity.InterviewerExpertise;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface InterviewerExpertiseRepository extends JpaRepository<InterviewerExpertise, Long> {
    List<InterviewerExpertise> findByInterviewerId(Long interviewerId);
}
