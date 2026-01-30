package com.techhiring.platform.controller;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.hamcrest.Matchers.is;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class UserControllerTest {

  @Autowired
  private MockMvc mockMvc;

  // Use users defined in data.sql

  @Test
  @WithMockUser(username = "candidate@test.com", roles = "CANDIDATE")
  public void testGetProfile_Candidate() throws Exception {
    mockMvc.perform(get("/api/users/profile")
        .contentType(MediaType.APPLICATION_JSON))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.email", is("candidate@test.com")))
        .andExpect(jsonPath("$.fullName", is("John Candidate")))
        .andExpect(jsonPath("$.role", is("CANDIDATE")))
        .andExpect(jsonPath("$.resumeUrl").exists())
        .andExpect(jsonPath("$.skills").value("Java, Spring"));
  }

  @Test
  @WithMockUser(username = "interviewer@techcorp.com", roles = "INTERVIEWER")
  public void testGetProfile_Interviewer() throws Exception {
    mockMvc.perform(get("/api/users/profile")
        .contentType(MediaType.APPLICATION_JSON))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.email", is("interviewer@techcorp.com")))
        .andExpect(jsonPath("$.fullName", is("Alice Interviewer")))
        .andExpect(jsonPath("$.role", is("INTERVIEWER")))
        .andExpect(jsonPath("$.companyName", is("TechCorp")));
  }

  @Test
  @WithMockUser(username = "nonexistent@test.com", roles = "CANDIDATE")
  public void testGetProfile_NotFound() throws Exception {
    // Since we mock the security context user but they don't exist in DB, it should
    // likely fail or throw exception
    // The controller fetches user by email from DB.
    mockMvc.perform(get("/api/users/profile")
        .contentType(MediaType.APPLICATION_JSON))
        .andExpect(status().isInternalServerError()); // Or 404 depending on error handling in controller
    // Controller throws RuntimeException("User not found") which usually results in
    // 500 default
  }
}
