package com.techhiring.platform.controller;

import com.techhiring.platform.dto.CompanyAdminDto;
import com.techhiring.platform.entity.Application;
import com.techhiring.platform.entity.InterviewerApplication;
import com.techhiring.platform.entity.Position;
import com.techhiring.platform.service.CompanyAdminService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/company-admin")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class CompanyAdminController {

  private final CompanyAdminService companyAdminService;

  // ==================== DASHBOARD ====================

  @GetMapping("/dashboard")
  public ResponseEntity<CompanyAdminDto.DashboardStats> getDashboard(@RequestParam Long companyId) {
    return ResponseEntity.ok(companyAdminService.getDashboardStats(companyId));
  }

  // ==================== PROFILE ====================

  @GetMapping("/profile")
  public ResponseEntity<CompanyAdminDto.ProfileResponse> getProfile(@RequestParam Long companyId) {
    return ResponseEntity.ok(companyAdminService.getCompanyProfile(companyId));
  }

  @PutMapping("/profile")
  public ResponseEntity<CompanyAdminDto.ProfileResponse> updateProfile(@RequestBody CompanyAdminDto.UpdateProfileRequest request) {
    return ResponseEntity.ok(companyAdminService.updateCompanyProfile(request));
  }

  @GetMapping("/approved-companies")
  public ResponseEntity<List<CompanyAdminDto.ApprovedCompanyInfo>> getApprovedCompanies(@RequestParam Long interviewerId) {
    return ResponseEntity.ok(companyAdminService.getApprovedCompaniesForInterviewer(interviewerId));
  }

  // ==================== POSITIONS ====================

  @GetMapping("/positions")
  public ResponseEntity<List<Position>> getPositions(@RequestParam Long companyId) {
    return ResponseEntity.ok(companyAdminService.getPositionsByCompany(companyId));
  }

  @PostMapping("/positions")
  public ResponseEntity<Position> createPosition(@RequestBody CompanyAdminDto.CreatePositionRequest req) {
    return ResponseEntity.ok(companyAdminService.createPosition(req));
  }

  @PatchMapping("/positions/{id}/status")
  public ResponseEntity<Position> updatePositionStatus(@PathVariable Long id, @RequestParam String status) {
    return ResponseEntity.ok(companyAdminService.updatePositionStatus(id, status));
  }

  @DeleteMapping("/positions/{id}")
  public ResponseEntity<Void> deletePosition(@PathVariable Long id) {
    companyAdminService.deletePosition(id);
    return ResponseEntity.ok().build();
  }

  // ==================== CANDIDATES ====================

  @GetMapping("/candidates")
  public ResponseEntity<List<CompanyAdminDto.CandidateInfo>> getCandidates(@RequestParam Long companyId) {
    return ResponseEntity.ok(companyAdminService.getCandidatesForCompany(companyId));
  }

  @GetMapping("/candidates/{candidateId}/profile")
  public ResponseEntity<CompanyAdminDto.CandidateProfileDetails> getCandidateProfileDetails(
      @PathVariable Long candidateId) {
    return ResponseEntity.ok(companyAdminService.getCandidateProfileDetails(candidateId));
  }

  @GetMapping("/positions/{positionId}/applications")
  public ResponseEntity<List<CompanyAdminDto.CandidateInfo>> getCandidatesByPosition(
      @PathVariable Long positionId,
      @RequestParam(required = false) Long interviewerId) {
    if (interviewerId != null) {
      return ResponseEntity.ok(companyAdminService.getCandidatesByPositionAssignedToInterviewer(positionId, interviewerId));
    }
    return ResponseEntity.ok(companyAdminService.getCandidatesByPosition(positionId));
  }

  // ==================== INTERVIEWERS ====================

  @GetMapping("/interviewers")
  public ResponseEntity<List<CompanyAdminDto.InterviewerInfo>> getInterviewers(@RequestParam Long companyId) {
    return ResponseEntity.ok(companyAdminService.getInterviewersForCompany(companyId));
  }

  @GetMapping("/positions/{positionId}/interviewer-applications")
  public ResponseEntity<List<CompanyAdminDto.InterviewerInfo>> getInterviewersByPosition(@PathVariable Long positionId) {
    return ResponseEntity.ok(companyAdminService.getInterviewersByPosition(positionId));
  }

  @PatchMapping("/interviewer-applications/{id}/status")
  public ResponseEntity<InterviewerApplication> updateInterviewerApplicationStatus(
      @PathVariable Long id, @RequestParam String status) {
    return ResponseEntity.ok(companyAdminService.updateInterviewerApplicationStatus(id, status));
  }

  @PatchMapping("/applications/{applicationId}/assign")
  public ResponseEntity<Application> assignCandidate(
      @PathVariable Long applicationId,
      @RequestParam Long companyId,
      @RequestParam Long interviewerId) {
    return ResponseEntity.ok(companyAdminService.assignCandidateToInterviewer(companyId, applicationId, interviewerId));
  }

  // ==================== INTERVIEWS ====================

  @GetMapping("/interviews")
  public ResponseEntity<List<CompanyAdminDto.InterviewInfo>> getInterviews(@RequestParam Long companyId) {
    return ResponseEntity.ok(companyAdminService.getInterviewsForCompany(companyId));
  }
}
