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
  private final CandidateExperienceRepository candidateExperienceRepository;
  private final CandidateEducationRepository candidateEducationRepository;
  private final InterviewerExpertiseRepository interviewerExpertiseRepository;
  private final CandidateRepository candidateRepository;
  private final InterviewerRepository interviewerRepository;
  private final UserRepository userRepository;
  private final CompanyAdminRepository companyAdminRepository;
  private final ResumeRepository resumeRepository;


  private String getResumeUrl(Long userId) {
    if (userId == null) return null;
    return resumeRepository.existsByUserId(userId)
        ? "/api/users/" + userId + "/resume"
        : null;
  }

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
        .location(req.getLocation())
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
    List<Application> applications = applicationRepository.findByPosition_CompanyId(companyId);
    List<Candidate> allCandidates = candidateRepository.findAll();
    List<CompanyAdminDto.CandidateInfo> result = new ArrayList<>();

    for (Candidate c : allCandidates) {
      List<String> skills = candidateSkillRepository.findByCandidateId(c.getId())
          .stream().map(CandidateSkill::getSkillName).collect(Collectors.toList());

      List<Application> candidateApps = applications.stream()
          .filter(app -> app.getCandidate().getId().equals(c.getId()))
          .collect(Collectors.toList());

      if (candidateApps.isEmpty()) {
        result.add(CompanyAdminDto.CandidateInfo.builder()
            .id(c.getId())
            .fullName(c.getFullName())
            .email(c.getEmail())
            .applicationId(null)
            .positionId(null)
            .positionTitle(null)
            .applicationDate(null)
            .appliedDirectly(false) // just viewing profile
            .skills(skills)
            .resumeUrl(getResumeUrl(c.getId()))
            .build());
      } else {
        for (Application app : candidateApps) {
          Long posId = app.getPosition().getId();
          String interviewStatus = null;
          String candidateOutcome = null;
          Long interviewId = null;

          List<Interview> candidateInterviews = interviewRepository.findByCandidateId(c.getId());
          Interview relatedInterview = candidateInterviews.stream()
              .filter(i -> i.getPosition() != null && i.getPosition().getId().equals(posId))
              .findFirst()
              .orElse(null);

          if (relatedInterview != null) {
            interviewStatus = relatedInterview.getStatus() != null ? relatedInterview.getStatus().name() : null;
            candidateOutcome = relatedInterview.getCandidateOutcome() != null ? relatedInterview.getCandidateOutcome().name() : null;
            interviewId = relatedInterview.getId();
          }

          result.add(CompanyAdminDto.CandidateInfo.builder()
              .id(c.getId())
              .fullName(c.getFullName())
              .email(c.getEmail())
              .applicationId(app.getId())
              .positionId(posId)
              .positionTitle(app.getPosition().getPositionTitle())
              .applicationDate(app.getApplicationDate() != null ? app.getApplicationDate().toString() : null)
              .status(app.getStatus())
              .interviewStatus(interviewStatus)
              .candidateOutcome(candidateOutcome)
              .interviewId(interviewId)
              .score(null)
              .appliedDirectly(true)
              .assignedInterviewerId(app.getAssignedInterviewer() != null ? app.getAssignedInterviewer().getId() : null)
              .assignedInterviewerName(app.getAssignedInterviewer() != null ? app.getAssignedInterviewer().getFullName() : null)
              .resumeUrl(getResumeUrl(c.getId()))
              .build());
        }
      }
    }
    return result;
  }

  public CompanyAdminDto.CandidateProfileDetails getCandidateProfileDetails(Long candidateId) {
    Candidate candidate = candidateRepository.findById(candidateId)
        .orElseThrow(() -> new RuntimeException("Candidate not found"));

    List<String> skills = candidateSkillRepository.findByCandidateId(candidateId)
        .stream().map(CandidateSkill::getSkillName).collect(Collectors.toList());

    return CompanyAdminDto.CandidateProfileDetails.builder()
        .id(candidate.getId())
        .fullName(candidate.getFullName())
        .email(candidate.getEmail())
        .phone(candidate.getPhone())
        .location(candidate.getLocation())
        .bio(candidate.getBio())
        .skills(skills)
        .experience(candidateExperienceRepository.findByCandidateId(candidateId))
        .education(candidateEducationRepository.findByCandidateId(candidateId))
        .resumeUrl(getResumeUrl(candidate.getId()))
        .build();
  }

  // ==================== INTERVIEWERS ====================
  // Returns ALL interviewers; those who applied to this company get their
  // application details overlaid.

  public List<CompanyAdminDto.InterviewerInfo> getInterviewersForCompany(Long companyId) {
    // Applications are per-position now. We render one card per application.
    List<InterviewerApplication> iApps = interviewerApplicationRepository.findByCompanyId(companyId)
        .stream()
        .filter(ia -> ia.getPosition() != null) // ignore legacy company-level applications
        .collect(Collectors.toList());

    List<Interviewer> allInterviewers = interviewerRepository.findAll();
    List<CompanyAdminDto.InterviewerInfo> result = new ArrayList<>();

    // First: cards for each application (per position)
    for (InterviewerApplication ia : iApps) {
      Interviewer iv = ia.getInterviewer();
      if (iv == null) continue;
      List<String> expertises = interviewerExpertiseRepository.findByInterviewerId(iv.getId())
          .stream().map(InterviewerExpertise::getExpertiseArea).collect(Collectors.toList());

      long upcoming = interviewRepository.countByCompanyIdAndInterviewerIdAndStatusIn(
          companyId,
          iv.getId(),
          List.of(Interview.InterviewStatus.SCHEDULED, Interview.InterviewStatus.IN_PROGRESS)
      );
      long completed = interviewRepository.countByCompanyIdAndInterviewerIdAndStatus(
          companyId,
          iv.getId(),
          Interview.InterviewStatus.COMPLETED
      );

      result.add(CompanyAdminDto.InterviewerInfo.builder()
          .id(iv.getId())
          .fullName(iv.getFullName())
          .email(iv.getEmail())
          .bio(iv.getBio())
          .hourlyRate(iv.getHourlyRate())
          .totalInterviewsConducted(iv.getTotalInterviewsConducted())
          .averageRating(iv.getAverageRating())
          .availabilityStatus(iv.getAvailabilityStatus())
          .expertises(expertises)
          .applicationId(ia.getId())
          .applicationStatus(ia.getStatus())
          .appliedToCompany(true)
          .positionId(ia.getPosition() != null ? ia.getPosition().getId() : null)
          .upcomingScheduled(upcoming)
          .upcomingInterviews(upcoming)
          .completedInterviews(completed)
          .resumeUrl(getResumeUrl(iv.getId()))
          .build());
    }

    // Second: add one "not applied" card for interviewers with no applications to this company
    Set<Long> appliedInterviewerIds = iApps.stream()
        .map(ia -> ia.getInterviewer() != null ? ia.getInterviewer().getId() : null)
        .filter(Objects::nonNull)
        .collect(Collectors.toSet());

    for (Interviewer iv : allInterviewers) {
      if (appliedInterviewerIds.contains(iv.getId())) continue;
      List<String> expertises = interviewerExpertiseRepository.findByInterviewerId(iv.getId())
          .stream().map(InterviewerExpertise::getExpertiseArea).collect(Collectors.toList());

      long upcoming = interviewRepository.countByCompanyIdAndInterviewerIdAndStatusIn(
          companyId,
          iv.getId(),
          List.of(Interview.InterviewStatus.SCHEDULED, Interview.InterviewStatus.IN_PROGRESS)
      );
      long completed = interviewRepository.countByCompanyIdAndInterviewerIdAndStatus(
          companyId,
          iv.getId(),
          Interview.InterviewStatus.COMPLETED
      );

      result.add(CompanyAdminDto.InterviewerInfo.builder()
          .id(iv.getId())
          .fullName(iv.getFullName())
          .email(iv.getEmail())
          .bio(iv.getBio())
          .hourlyRate(iv.getHourlyRate())
          .totalInterviewsConducted(iv.getTotalInterviewsConducted())
          .averageRating(iv.getAverageRating())
          .availabilityStatus(iv.getAvailabilityStatus())
          .expertises(expertises)
          .applicationId(null)
          .applicationStatus(null)
          .appliedToCompany(false)
          .positionId(null)
          .upcomingScheduled(upcoming)
          .upcomingInterviews(upcoming)
          .completedInterviews(completed)
          .resumeUrl(getResumeUrl(iv.getId()))
          .build());
    }

    return result;
  }

  @Transactional
  public InterviewerApplication updateInterviewerApplicationStatus(Long applicationId, String status) {
    InterviewerApplication ia = interviewerApplicationRepository.findById(applicationId)
        .orElseThrow(() -> new RuntimeException("Interviewer application not found"));
    ia.setStatus(status);
    InterviewerApplication saved = interviewerApplicationRepository.save(ia);

    // When a new interviewer is approved, retroactively assign any unassigned candidates
    // for that position using the least-loaded strategy (catch-up round-robin).
    if ("APPROVED".equalsIgnoreCase(status) && ia.getPosition() != null) {
      Long positionId = ia.getPosition().getId();

      // All currently approved interviewers for this position, sorted by IA id (stable tiebreaker)
      List<InterviewerApplication> approvedIas =
          interviewerApplicationRepository.findByPositionIdAndStatusOrderByIdAsc(positionId, "APPROVED");

      if (!approvedIas.isEmpty()) {
        // Unassigned applications for this position, sorted by application id (arrival order)
        List<Application> unassigned =
            applicationRepository.findByPosition_IdAndAssignedInterviewerIsNull(positionId)
                .stream()
                .sorted(java.util.Comparator.comparingLong(Application::getId))
                .collect(java.util.stream.Collectors.toList());

        if (!unassigned.isEmpty()) {
          // Build a mutable count map: interviewerId -> current assignment count
          java.util.Map<Long, Long> countMap = new java.util.HashMap<>();
          for (InterviewerApplication approved : approvedIas) {
            Long ivId = approved.getInterviewer().getId();
            long count = applicationRepository.findByPosition_IdAndAssignedInterviewer_Id(positionId, ivId).size();
            countMap.put(ivId, count);
          }

          // Assign each unassigned application to the least-loaded interviewer
          for (Application app : unassigned) {
            InterviewerApplication chosen = approvedIas.stream()
                .min(java.util.Comparator.comparingLong(
                    a -> countMap.getOrDefault(a.getInterviewer().getId(), 0L)
                ))
                .orElse(null);
            if (chosen != null) {
              app.setAssignedInterviewer(chosen.getInterviewer());
              applicationRepository.save(app);
              // Increment local count so next iteration picks correctly
              countMap.merge(chosen.getInterviewer().getId(), 1L, Long::sum);
            }
          }
        }
      }
    }

    return saved;
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
        .actualStartTime(iv.getActualStartTime())
        .actualEndTime(iv.getActualEndTime())
        .status(iv.getStatus() != null ? iv.getStatus().name() : null)
        .candidateOutcome(iv.getCandidateOutcome() != null ? iv.getCandidateOutcome().name() : null)
        .interviewRound(iv.getInterviewRound())
        .interviewType(iv.getInterviewType() != null ? iv.getInterviewType().name() : null)
        .score(iv.getScore())
        .feedback(iv.getFeedback())
        .durationMinutes(iv.getDurationMinutes())
        .meetingLink(iv.getMeetingLink())
        .recordingUrl(iv.getRecordingUrl())
        .build();
  }

  // ==================== PER-POSITION APPLICATIONS ====================

  public List<CompanyAdminDto.CandidateInfo> getCandidatesByPosition(Long positionId) {
    return applicationRepository.findByPosition_Id(positionId).stream()
        .map(app -> {
          Candidate c = app.getCandidate();
          List<String> skills = candidateSkillRepository.findByCandidateId(c.getId())
              .stream().map(CandidateSkill::getSkillName).collect(Collectors.toList());
          List<Interview> candidateInterviews = interviewRepository.findByCandidateId(c.getId());
          Interview relatedInterview = candidateInterviews.stream()
              .filter(i -> i.getPosition() != null && i.getPosition().getId().equals(positionId))
              .findFirst()
              .orElse(null);
          String interviewStatus = null;
          String candidateOutcome = null;
          Long interviewId = null;
          if (relatedInterview != null) {
            interviewStatus = relatedInterview.getStatus() != null ? relatedInterview.getStatus().name() : null;
            candidateOutcome = relatedInterview.getCandidateOutcome() != null ? relatedInterview.getCandidateOutcome().name() : null;
            interviewId = relatedInterview.getId();
          }

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
              .interviewStatus(interviewStatus)
              .candidateOutcome(candidateOutcome)
              .interviewId(interviewId)
              .skills(skills)
              .appliedDirectly(true)
              .appliedDirectly(true)
              .assignedInterviewerId(app.getAssignedInterviewer() != null ? app.getAssignedInterviewer().getId() : null)
              .assignedInterviewerName(app.getAssignedInterviewer() != null ? app.getAssignedInterviewer().getFullName() : null)
              .resumeUrl(getResumeUrl(c.getId()))
              .build();
        }).collect(Collectors.toList());
  }

  // Only candidates assigned to a given interviewer for this position
  public List<CompanyAdminDto.CandidateInfo> getCandidatesByPositionAssignedToInterviewer(Long positionId, Long interviewerId) {
    return applicationRepository.findByPosition_IdAndAssignedInterviewer_Id(positionId, interviewerId).stream()
        .map(app -> {
          Candidate c = app.getCandidate();
          List<String> skills = candidateSkillRepository.findByCandidateId(c.getId())
              .stream().map(CandidateSkill::getSkillName).collect(Collectors.toList());

          List<Interview> candidateInterviews = interviewRepository.findByCandidateId(c.getId());
          Interview relatedInterview = candidateInterviews.stream()
              .filter(i -> i.getPosition() != null && i.getPosition().getId().equals(positionId))
              .findFirst()
              .orElse(null);
          String interviewStatus = null;
          String candidateOutcome = null;
          Long interviewId = null;
          if (relatedInterview != null) {
            interviewStatus = relatedInterview.getStatus() != null ? relatedInterview.getStatus().name() : null;
            candidateOutcome = relatedInterview.getCandidateOutcome() != null ? relatedInterview.getCandidateOutcome().name() : null;
            interviewId = relatedInterview.getId();
          }

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
              .interviewStatus(interviewStatus)
              .candidateOutcome(candidateOutcome)
              .interviewId(interviewId)
              .skills(skills)
              .appliedDirectly(true)
              .assignedInterviewerId(app.getAssignedInterviewer() != null ? app.getAssignedInterviewer().getId() : null)
              .assignedInterviewerName(app.getAssignedInterviewer() != null ? app.getAssignedInterviewer().getFullName() : null)
              .resumeUrl(getResumeUrl(c.getId()))
              .build();
        }).collect(Collectors.toList());
  }

  public List<CompanyAdminDto.InterviewerInfo> getInterviewersByPosition(Long positionId) {
    Position position = positionRepository.findById(positionId)
        .orElseThrow(() -> new RuntimeException("Position not found"));

    return interviewerApplicationRepository.findByPositionId(positionId).stream()
        .map(ia -> {
          Interviewer iv = ia.getInterviewer();
          List<String> expertises = interviewerExpertiseRepository.findByInterviewerId(iv.getId())
              .stream().map(InterviewerExpertise::getExpertiseArea).collect(Collectors.toList());
          return CompanyAdminDto.InterviewerInfo.builder()
              .id(iv.getId())
              .fullName(iv.getFullName())
              .email(iv.getEmail())
              .bio(iv.getBio())
              .hourlyRate(iv.getHourlyRate())
              .totalInterviewsConducted(iv.getTotalInterviewsConducted())
              .averageRating(iv.getAverageRating())
              .availabilityStatus(iv.getAvailabilityStatus())
              .expertises(expertises)
              .applicationId(ia.getId())
              .applicationStatus(ia.getStatus())
              .appliedToCompany(true)
              .positionId(positionId)
              .positionTitle(position.getPositionTitle())
              .upcomingScheduled(0)
              .build();
        }).collect(Collectors.toList());
  }

  @Transactional
  public Application assignCandidateToInterviewer(Long companyId, Long applicationId, Long interviewerId) {
    Application app = applicationRepository.findById(applicationId)
        .orElseThrow(() -> new RuntimeException("Application not found"));

    if (app.getPosition() == null || app.getPosition().getId() == null || app.getPosition().getCompany() == null) {
      throw new RuntimeException("Application position not found");
    }
    if (!app.getPosition().getCompany().getId().equals(companyId)) {
      throw new RuntimeException("Application does not belong to this company");
    }

    Interviewer interviewer = interviewerRepository.findById(interviewerId)
        .orElseThrow(() -> new RuntimeException("Interviewer not found"));

    // Must be approved for this position
    InterviewerApplication ia = interviewerApplicationRepository
        .findByInterviewerIdAndPositionId(interviewerId, app.getPosition().getId())
        .orElseThrow(() -> new RuntimeException("Interviewer is not approved for this position"));
    if (!"APPROVED".equalsIgnoreCase(ia.getStatus())) {
      throw new RuntimeException("Interviewer is not approved for this position");
    }

    app.setAssignedInterviewer(interviewer);
    return applicationRepository.save(app);
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
      .filter(ia -> ia.getPosition() != null) // ignore legacy
      .filter(ia -> ia.getInterviewer().getId().equals(interviewerId) && "APPROVED".equals(ia.getStatus()))
      .collect(Collectors.toList());

    Map<Long, List<InterviewerApplication>> byCompany = applications.stream()
        .collect(Collectors.groupingBy(ia -> ia.getCompany().getId()));

    return byCompany.entrySet().stream().map(entry -> {
      Long companyId = entry.getKey();
      List<InterviewerApplication> apps = entry.getValue();
      Company company = apps.get(0).getCompany();
      List<CompanyAdminDto.PositionMinimalInfo> positions = apps.stream()
          .map(ia -> ia.getPosition())
          .filter(Objects::nonNull)
          .map(p -> new CompanyAdminDto.PositionMinimalInfo(p.getId(), p.getPositionTitle()))
          .collect(Collectors.toList());

      return CompanyAdminDto.ApprovedCompanyInfo.builder()
          .companyId(companyId)
          .companyName(company.getCompanyName())
          .positions(positions)
          .build();
    }).collect(Collectors.toList());
  }

}
