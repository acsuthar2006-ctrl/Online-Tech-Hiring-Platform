package com.techhiring.platform.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.techhiring.platform.dto.ScheduleRequest;
import com.techhiring.platform.entity.InterviewType;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class InterviewControllerTest {

  @Autowired
  private MockMvc mockMvc;

  @Autowired
  private ObjectMapper objectMapper;

  @Test
  @WithMockUser(username = "interviewer@techcorp.com", roles = "INTERVIEWER")
  public void testScheduleInterview_Success() throws Exception {
    ScheduleRequest request = new ScheduleRequest();
    request.setCandidateEmail("candidate@test.com"); // Exists in data.sql
    request.setInterviewerEmail("interviewer@techcorp.com"); // Exists in data.sql
    request.setTitle("New Tech Interview");
    request.setScheduledTime(LocalDateTime.now().plusDays(1));
    request.setMeetingLink("room-new-123");
    request.setDescription("Discussion on Java");
    request.setInterviewType(InterviewType.TECHNICAL);

    mockMvc.perform(post("/api/interviews/schedule")
        .contentType(MediaType.APPLICATION_JSON)
        .content(objectMapper.writeValueAsString(request)))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.id").exists())
        .andExpect(jsonPath("$.title").value("New Tech Interview"))
        .andExpect(jsonPath("$.status").value("SCHEDULED"));
  }

  @Test
  public void testGetSessionQueue_Success() throws Exception {
    // "room-123" is associated with a SCHEDULED interview in data.sql for candidate
    // id 1
    String meetingLink = "room-123";

    mockMvc.perform(get("/api/interviews/session/" + meetingLink + "/queue")
        .contentType(MediaType.APPLICATION_JSON))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.timeline", hasSize(greaterThanOrEqualTo(1))));
  }

  @Test
  @WithMockUser(username = "interviewer@techcorp.com", roles = "INTERVIEWER")
  public void testCompleteAndGetNext_Success() throws Exception {
    // We have interview ID 1 as SCHEDULED. Let's complete it.
    Long interviewId = 1L;

    mockMvc.perform(post("/api/interviews/" + interviewId + "/complete")
        .contentType(MediaType.APPLICATION_JSON))
        .andExpect(status().isOk());
    // May return next interview or null/empty body if none.
    // The test verifies endpoint is reachable and executes logic without error.
  }
}
