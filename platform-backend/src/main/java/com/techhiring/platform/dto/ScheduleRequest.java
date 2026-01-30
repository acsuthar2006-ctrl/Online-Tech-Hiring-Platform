package com.techhiring.platform.dto;

import lombok.Data;
import java.time.LocalDateTime;
import com.techhiring.platform.entity.InterviewType;

@Data
public class ScheduleRequest {
  private String interviewerEmail;
  private String candidateEmail;
  private String candidateName;
  private LocalDateTime scheduledTime;
  private String title;
  private String meetingLink;
  private String description;
  private InterviewType interviewType;
}
