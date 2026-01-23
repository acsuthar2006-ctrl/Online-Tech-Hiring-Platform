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
}
