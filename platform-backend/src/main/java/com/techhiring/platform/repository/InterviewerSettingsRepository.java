package com.techhiring.platform.repository;

import com.techhiring.platform.entity.InterviewerSettings;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface InterviewerSettingsRepository extends JpaRepository<InterviewerSettings, Long> {
    Optional<InterviewerSettings> findByInterviewerId(Long interviewerId);
}
