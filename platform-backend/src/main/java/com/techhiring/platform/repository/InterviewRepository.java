package com.techhiring.platform.repository;

import com.techhiring.platform.entity.Interview;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface InterviewRepository extends JpaRepository<Interview, Long> {
  List<Interview> findByCandidateId(Long candidateId);

  List<Interview> findByInterviewerId(Long interviewerId);

  List<Interview> findByMeetingLink(String meetingLink);

  List<Interview> findByMeetingLinkAndStatus(String meetingLink, Interview.InterviewStatus status);

  @org.springframework.data.jpa.repository.Query("SELECT i FROM Interview i WHERE i.status = 'SCHEDULED' AND i.scheduledDate = :date AND i.scheduledTime BETWEEN :start AND :end")
  List<Interview> findScheduledInterviewsBetween(java.time.LocalDate date, java.time.LocalTime start, java.time.LocalTime end);

  List<Interview> findByCandidate_Email(String email);

  List<Interview> findByInterviewer_Email(String email);
}
