package com.techhiring.platform.repository;

import com.techhiring.platform.entity.Interview;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Collection;

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

  List<Interview> findByCompanyId(Long companyId);

  List<Interview> findByInterviewerIdAndStatus(Long interviewerId, Interview.InterviewStatus status);

  long countByCompanyIdAndInterviewerIdAndStatus(Long companyId, Long interviewerId, Interview.InterviewStatus status);

  long countByCompanyIdAndInterviewerIdAndStatusIn(Long companyId, Long interviewerId, Collection<Interview.InterviewStatus> statuses);

  @org.springframework.data.jpa.repository.Query(
    "SELECT i FROM Interview i WHERE i.meetingLink = :roomId AND i.scheduledDate = :date AND i.status <> com.techhiring.platform.entity.Interview.InterviewStatus.CANCELLED"
  )
  List<Interview> findByMeetingLinkAndScheduledDate(
    @org.springframework.data.repository.query.Param("roomId") String roomId,
    @org.springframework.data.repository.query.Param("date") java.time.LocalDate date
  );
}

