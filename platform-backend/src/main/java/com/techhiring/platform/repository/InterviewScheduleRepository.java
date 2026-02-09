package com.techhiring.platform.repository;

import com.techhiring.platform.entity.InterviewSchedule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface InterviewScheduleRepository extends JpaRepository<InterviewSchedule, Long> {
  Optional<InterviewSchedule> findByInterviewId(Long interviewId);
  Optional<InterviewSchedule> findByRoomId(String roomId);
}
