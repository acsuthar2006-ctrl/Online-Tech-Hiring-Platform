package com.techhiring.platform.dto;

import lombok.Data;
import java.time.LocalDateTime;
import com.techhiring.platform.entity.InterviewType;

@Data
public class ScheduleRequest {
  private Long interviewerId;  // Support ID-based scheduling
  private String interviewerEmail;  // Support email-based scheduling
  private String candidateEmail;
  private String candidateName;
  private LocalDateTime scheduledTime;
  private String title;
  private String meetingLink;
  private String description;
  private Integer durationMinutes;
  private InterviewType interviewType;
}
