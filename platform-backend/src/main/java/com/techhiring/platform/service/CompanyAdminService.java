package com.techhiring.platform.service;

import com.techhiring.platform.dto.CompanyAdminDto;
import com.techhiring.platform.entity.*;
import com.techhiring.platform.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CompanyAdminService {

  private final CompanyRepository companyRepository;
  private final PositionRepository positionRepository;
  private final ApplicationRepository applicationRepository;
  private final InterviewerApplicationRepository interviewerApplicationRepository;
  private final InterviewRepository interviewRepository;
  private final CandidateSkillRepository candidateSkillRepository;
  private final InterviewerExpertiseRepository interviewerExpertiseRepository;
  private final CandidateRepository candidateRepository;
  private final InterviewerRepository interviewerRepository;
  private final UserRepository userRepository;
  private final CompanyAdminRepository companyAdminRepository;


  // ==================== DASHBOARD ====================

  public CompanyAdminDto.DashboardStats getDashboardStats(Long companyId) {
    List<Position> positions = positionRepository.findByCompanyId(companyId);

    long totalInterviews = interviewRepository.findByCompanyId(companyId).size();

    long activeCandidates = applicationRepository.findByPosition_CompanyId(companyId).stream()
        .filter(a -> !"REJECTED".equals(a.getStatus()))
        .map(a -> a.getCandidate().getId())
        .distinct().count();

    long hiredInterviewers = interviewerApplicationRepository.findByCompanyId(companyId).stream()
        .filter(ia -> "APPROVED".equals(ia.getStatus())).count();

    long openPositions = positions.stream().filter(p -> "OPEN".equals(p.getStatus())).count();

    return CompanyAdminDto.DashboardStats.builder()
        .totalInterviews(totalInterviews)
        .activeCandidates(activeCandidates)
        .hiredInterviewers(hiredInterviewers)
        .openPositions(openPositions)
        .build();
  }

  // ==================== POSITIONS ====================

  public List<Position> getPositionsByCompany(Long companyId) {
    return positionRepository.findByCompanyId(companyId);
  }

  @Transactional
  public Position createPosition(CompanyAdminDto.CreatePositionRequest req) {
    Company company = companyRepository.findById(req.getCompanyId())
        .orElseThrow(() -> new RuntimeException("Company not found"));
    Position position = Position.builder()
        .company(company)
        .positionTitle(req.getPositionTitle())
        .jobDescription(req.getJobDescription())
        .salaryRange(req.getSalaryRange())
        .requiredExpertise(req.getRequiredExpertise())
        .status("OPEN")
        .build();
    return positionRepository.save(position);
  }

  @Transactional
  public Position updatePositionStatus(Long positionId, String status) {
    Position position = positionRepository.findById(positionId)
        .orElseThrow(() -> new RuntimeException("Position not found"));
    position.setStatus(status);
    return positionRepository.save(position);
  }

  @Transactional
  public void deletePosition(Long positionId) {
    positionRepository.deleteById(positionId);
  }

  // ==================== CANDIDATES ====================
  // Returns ALL candidates on the platform; candidates who applied to this
  // company's jobs get their application details overlaid.

  public List<CompanyAdminDto.CandidateInfo> getCandidatesForCompany(Long companyId) {
    // Build a map: candidateId -> best application for this company
    List<Application> applications = applicationRepository.findByPosition_CompanyId(companyId);
    Map<Long, Application> appliedMap = new LinkedHashMap<>();
    for (Application app : applications) {
      Long cid = app.getCandidate().getId();
      // Keep the most recent application per candidate
      appliedMap.merge(cid, app, (existing, incoming) ->
          incoming.getApplicationDate() != null && existing.getApplicationDate() != null &&
          incoming.getApplicationDate().isAfter(existing.getApplicationDate()) ? incoming : existing);
    }

    List<Candidate> allCandidates = candidateRepository.findAll();
    List<CompanyAdminDto.CandidateInfo> result = new ArrayList<>();

    for (Candidate c : allCandidates) {
      List<String> skills = candidateSkillRepository.findByCandidateId(c.getId())
          .stream().map(CandidateSkill::getSkillName).collect(Collectors.toList());

      Application app = appliedMap.get(c.getId());
      boolean applied = app != null;

      result.add(CompanyAdminDto.CandidateInfo.builder()
          .id(c.getId())
          .fullName(c.getFullName())
          .email(c.getEmail())
          .applicationId(applied ? app.getId() : null)
          .positionId(applied ? app.getPosition().getId() : null)
          .positionTitle(applied ? app.getPosition().getPositionTitle() : null)
          .applicationDate(applied && app.getApplicationDate() != null
              ? app.getApplicationDate().toLocalDate().toString() : null)
          .status(applied ? app.getStatus() : "NOT_APPLIED")
          .score(null)
          .skills(skills)
          .appliedDirectly(applied)
          .build());
    }

    return result;
  }

  // ==================== INTERVIEWERS ====================
  // Returns ALL interviewers; those who applied to this company get their
  // application details overlaid.

  public List<CompanyAdminDto.InterviewerInfo> getInterviewersForCompany(Long companyId) {
    // Build a map: interviewerId -> their application for this company
    List<InterviewerApplication> iApps = interviewerApplicationRepository.findByCompanyId(companyId);
    Map<Long, InterviewerApplication> appliedMap = new LinkedHashMap<>();
    for (InterviewerApplication ia : iApps) {
      Long ivId = ia.getInterviewer().getId();
      appliedMap.put(ivId, ia);
    }

    List<Interviewer> allInterviewers = interviewerRepository.findAll();
    List<CompanyAdminDto.InterviewerInfo> result = new ArrayList<>();

    for (Interviewer iv : allInterviewers) {
      List<String> expertises = interviewerExpertiseRepository.findByInterviewerId(iv.getId())
          .stream().map(InterviewerExpertise::getExpertiseArea).collect(Collectors.toList());

      InterviewerApplication ia = appliedMap.get(iv.getId());
      boolean applied = ia != null;

      long upcoming = interviewRepository
          .findByInterviewerIdAndStatus(iv.getId(), Interview.InterviewStatus.SCHEDULED).size();

      result.add(CompanyAdminDto.InterviewerInfo.builder()
          .id(iv.getId())
          .fullName(iv.getFullName())
          .email(iv.getEmail())
          .hourlyRate(iv.getHourlyRate())
          .totalInterviewsConducted(iv.getTotalInterviewsConducted())
          .averageRating(iv.getAverageRating())
          .availabilityStatus(iv.getAvailabilityStatus())
          .expertises(expertises)
          .applicationId(applied ? ia.getId() : null)
          .applicationStatus(applied ? ia.getStatus() : null)
          .appliedToCompany(applied)
          .upcomingScheduled(upcoming)
          .build());
    }

    return result;
  }

  @Transactional
  public InterviewerApplication updateInterviewerApplicationStatus(Long applicationId, String status) {
    InterviewerApplication ia = interviewerApplicationRepository.findById(applicationId)
        .orElseThrow(() -> new RuntimeException("Interviewer application not found"));
    ia.setStatus(status);
    return interviewerApplicationRepository.save(ia);
  }

  // ==================== INTERVIEWS ====================

  public List<CompanyAdminDto.InterviewInfo> getInterviewsForCompany(Long companyId) {
    return interviewRepository.findByCompanyId(companyId).stream()
        .map(this::toInterviewInfo)
        .collect(Collectors.toList());
  }

  private CompanyAdminDto.InterviewInfo toInterviewInfo(Interview iv) {
    return CompanyAdminDto.InterviewInfo.builder()
        .id(iv.getId())
        .interviewId(iv.getInterviewId())
        .title(iv.getTitle())
        .candidateName(iv.getCandidate() != null ? iv.getCandidate().getFullName() : null)
        .candidateEmail(iv.getCandidate() != null ? iv.getCandidate().getEmail() : null)
        .candidateId(iv.getCandidate() != null ? iv.getCandidate().getId() : null)
        .interviewerName(iv.getInterviewer() != null ? iv.getInterviewer().getFullName() : null)
        .interviewerEmail(iv.getInterviewer() != null ? iv.getInterviewer().getEmail() : null)
        .interviewerId(iv.getInterviewer() != null ? iv.getInterviewer().getId() : null)
        .positionTitle(iv.getPosition() != null ? iv.getPosition().getPositionTitle() : null)
        .positionId(iv.getPosition() != null ? iv.getPosition().getId() : null)
        .scheduledDate(iv.getScheduledDate())
        .scheduledTime(iv.getScheduledTime())
        .status(iv.getStatus() != null ? iv.getStatus().name() : null)
        .interviewRound(iv.getInterviewRound())
        .interviewType(iv.getInterviewType() != null ? iv.getInterviewType().name() : null)
        .score(iv.getScore())
        .feedback(iv.getFeedback())
        .durationMinutes(iv.getDurationMinutes())
        .meetingLink(iv.getMeetingLink())
        .build();
  }

  // ==================== PER-POSITION APPLICATIONS ====================

  public List<CompanyAdminDto.CandidateInfo> getCandidatesByPosition(Long positionId) {
    return applicationRepository.findByPosition_Id(positionId).stream()
        .map(app -> {
          Candidate c = app.getCandidate();
          List<String> skills = candidateSkillRepository.findByCandidateId(c.getId())
              .stream().map(CandidateSkill::getSkillName).collect(Collectors.toList());
          return CompanyAdminDto.CandidateInfo.builder()
              .id(c.getId())
              .fullName(c.getFullName())
              .email(c.getEmail())
              .applicationId(app.getId())
              .positionId(positionId)
              .positionTitle(app.getPosition().getPositionTitle())
              .applicationDate(app.getApplicationDate() != null
                  ? app.getApplicationDate().toLocalDate().toString() : null)
              .status(app.getStatus())
              .skills(skills)
              .appliedDirectly(true)
              .build();
        }).collect(Collectors.toList());
  }

  public List<CompanyAdminDto.InterviewerInfo> getInterviewersByPosition(Long positionId) {
    Position position = positionRepository.findById(positionId)
        .orElseThrow(() -> new RuntimeException("Position not found"));
    Long companyId = position.getCompany().getId();
    return interviewerApplicationRepository.findByCompanyId(companyId).stream()
        .map(ia -> {
          Interviewer iv = ia.getInterviewer();
          List<String> expertises = interviewerExpertiseRepository.findByInterviewerId(iv.getId())
              .stream().map(InterviewerExpertise::getExpertiseArea).collect(Collectors.toList());
          return CompanyAdminDto.InterviewerInfo.builder()
              .id(iv.getId())
              .fullName(iv.getFullName())
              .email(iv.getEmail())
              .hourlyRate(iv.getHourlyRate())
              .totalInterviewsConducted(iv.getTotalInterviewsConducted())
              .averageRating(iv.getAverageRating())
              .availabilityStatus(iv.getAvailabilityStatus())
              .expertises(expertises)
              .applicationId(ia.getId())
              .applicationStatus(ia.getStatus())
              .appliedToCompany(true)
              .upcomingScheduled(0)
              .build();
        }).collect(Collectors.toList());
  }

  // ==================== PROFILE ====================

  public CompanyAdminDto.ProfileResponse getCompanyProfile(Long companyId) {
    Company company = companyRepository.findById(companyId)
        .orElseThrow(() -> new RuntimeException("Company not found"));
    
    // Assuming 1-to-1 or just getting the first admin for the company
    CompanyAdmin admin = companyAdminRepository.findByCompany_Id(companyId).orElse(null);
    String adminName = admin != null ? admin.getFullName() : null;
    String adminEmail = admin != null ? admin.getEmail() : null;

    return CompanyAdminDto.ProfileResponse.builder()
        .companyName(company.getCompanyName())
        .adminName(adminName)
        .adminEmail(adminEmail)
        .industry(company.getIndustry())
        .phone(company.getPhone())
        .location(company.getLocation())
        .website(company.getWebsite())
        .description(company.getDescription())
        .build();
  }

  @Transactional
  public CompanyAdminDto.ProfileResponse updateCompanyProfile(CompanyAdminDto.UpdateProfileRequest request) {
    Company company = companyRepository.findById(request.getCompanyId())
        .orElseThrow(() -> new RuntimeException("Company not found"));
    
    company.setCompanyName(request.getCompanyName());
    company.setIndustry(request.getIndustry());
    company.setPhone(request.getPhone());
    company.setLocation(request.getLocation());
    company.setWebsite(request.getWebsite());
    company.setDescription(request.getDescription());
    
    Company savedCompany = companyRepository.save(company);
    
    CompanyAdmin admin = companyAdminRepository.findByCompany_Id(company.getId()).orElse(null);
    if (admin != null) {
      admin.setFullName(request.getAdminName());
      userRepository.save(admin); 
    }

    return getCompanyProfile(savedCompany.getId());
  }

  // ==================== APPROVED COMPANIES FOR INTERVIEWER ====================

  public List<CompanyAdminDto.ApprovedCompanyInfo> getApprovedCompaniesForInterviewer(Long interviewerId) {
    List<InterviewerApplication> applications = interviewerApplicationRepository.findAll().stream()
      .filter(ia -> ia.getInterviewer().getId().equals(interviewerId) && "APPROVED".equals(ia.getStatus()))
      .collect(Collectors.toList());

    return applications.stream().map(ia -> {
      Company company = ia.getCompany();
      List<CompanyAdminDto.PositionMinimalInfo> positions = positionRepository.findByCompanyId(company.getId())
          .stream()
          .map(p -> new CompanyAdminDto.PositionMinimalInfo(p.getId(), p.getPositionTitle()))
          .collect(Collectors.toList());

      return CompanyAdminDto.ApprovedCompanyInfo.builder()
          .companyId(company.getId())
          .companyName(company.getCompanyName())
          .positions(positions)
          .build();
    }).collect(Collectors.toList());
  }

}
