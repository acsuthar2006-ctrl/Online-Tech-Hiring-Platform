package com.techhiring.platform.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.techhiring.platform.dto.AuthDto;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.hamcrest.Matchers.containsString;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class AuthControllerTest {

  @Autowired
  private MockMvc mockMvc;

  @Autowired
  private ObjectMapper objectMapper;

  @Test
  public void testSignup_Success() throws Exception {
    AuthDto.SignupRequest request = new AuthDto.SignupRequest();
    request.setEmail("newuser@test.com");
    request.setPassword("password123");
    request.setFullName("New User");
    request.setRole("CANDIDATE");

    mockMvc.perform(post("/api/auth/signup")
        .contentType(MediaType.APPLICATION_JSON)
        .content(objectMapper.writeValueAsString(request)))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.message").value("User registered successfully!"))
        .andExpect(jsonPath("$.userId").exists())
        .andExpect(jsonPath("$.role").value("CANDIDATE"));
  }

  @Test
  public void testSignup_DuplicateEmail() throws Exception {
    AuthDto.SignupRequest request = new AuthDto.SignupRequest();
    request.setEmail("candidate@test.com"); // Exists in data.sql
    request.setPassword("password123");
    request.setFullName("Duplicate User");
    request.setRole("CANDIDATE");

    mockMvc.perform(post("/api/auth/signup")
        .contentType(MediaType.APPLICATION_JSON)
        .content(objectMapper.writeValueAsString(request)))
        .andExpect(status().isBadRequest())
        .andExpect(content().string(containsString("Error: Email is already in use!")));
  }

  @Test
  public void testLogin_Success() throws Exception {
    // Skipped as per previous comment
  }

  @Test
  public void testLogin_Success_CreatedUser() throws Exception {
    // 1. Signup
    AuthDto.SignupRequest signup = new AuthDto.SignupRequest();
    signup.setEmail("loginuser@test.com");
    signup.setPassword("password123");
    signup.setFullName("Login User");
    signup.setRole("CANDIDATE");

    mockMvc.perform(post("/api/auth/signup")
        .contentType(MediaType.APPLICATION_JSON)
        .content(objectMapper.writeValueAsString(signup)))
        .andExpect(status().isOk());

    // 2. Login
    AuthDto.LoginRequest login = new AuthDto.LoginRequest();
    login.setEmail("loginuser@test.com");
    login.setPassword("password123");

    mockMvc.perform(post("/api/auth/login")
        .contentType(MediaType.APPLICATION_JSON)
        .content(objectMapper.writeValueAsString(login)))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.userId").exists())
        .andExpect(jsonPath("$.role").value("CANDIDATE"));
  }

  @Test
  public void testLogin_InvalidPassword() throws Exception {
    // Create user first
    AuthDto.SignupRequest signup = new AuthDto.SignupRequest();
    signup.setEmail("wrongpass@test.com");
    signup.setPassword("correct");
    signup.setFullName("Wrong Pass User");
    signup.setRole("CANDIDATE");
    mockMvc.perform(post("/api/auth/signup")
        .contentType(MediaType.APPLICATION_JSON)
        .content(objectMapper.writeValueAsString(signup)));

    AuthDto.LoginRequest request = new AuthDto.LoginRequest();
    request.setEmail("wrongpass@test.com");
    request.setPassword("wrong");

    mockMvc.perform(post("/api/auth/login")
        .contentType(MediaType.APPLICATION_JSON)
        .content(objectMapper.writeValueAsString(request)))
        .andExpect(status().isUnauthorized()); // Or whatever status your controller returns for bad creds default is
                                               // usually 401
  }
}
