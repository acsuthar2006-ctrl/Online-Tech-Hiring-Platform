package com.techhiring.platform.service;

import com.techhiring.platform.entity.*;
import com.techhiring.platform.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class SettingsService {

    private final CandidateRepository candidateRepository;
    private final InterviewerRepository interviewerRepository;
    private final CandidateSettingsRepository candidateSettingsRepository;
    private final InterviewerSettingsRepository interviewerSettingsRepository;

    // Candidate Settings
    public CandidateSettings getCandidateSettings(Long candidateId) {
        return candidateSettingsRepository.findByCandidateId(candidateId)
                .orElseGet(() -> {
                    // Create default if not exists
                    Candidate candidate = candidateRepository.findById(candidateId)
                            .orElseThrow(() -> new RuntimeException("Candidate not found"));
                    return candidateSettingsRepository.save(CandidateSettings.builder().candidate(candidate).build());
                });
    }

    @Transactional
    public CandidateSettings updateCandidateSettings(Long candidateId, CandidateSettings settings) {
        CandidateSettings existing = getCandidateSettings(candidateId);
        existing.setEmailNotificationsEnabled(settings.getEmailNotificationsEnabled());
        existing.setInterviewRemindersEnabled(settings.getInterviewRemindersEnabled());
        existing.setThemePreference(settings.getThemePreference());
        existing.setLanguage(settings.getLanguage());
        return candidateSettingsRepository.save(existing);
    }

    // Interviewer Settings
    public InterviewerSettings getInterviewerSettings(Long interviewerId) {
        return interviewerSettingsRepository.findByInterviewerId(interviewerId)
                .orElseGet(() -> {
                    // Create default if not exists
                    Interviewer interviewer = interviewerRepository.findById(interviewerId)
                            .orElseThrow(() -> new RuntimeException("Interviewer not found"));
                    return interviewerSettingsRepository.save(InterviewerSettings.builder().interviewer(interviewer).build());
                });
    }

    @Transactional
    public InterviewerSettings updateInterviewerSettings(Long interviewerId, InterviewerSettings settings) {
        InterviewerSettings existing = getInterviewerSettings(interviewerId);
        existing.setEmailNotificationsEnabled(settings.getEmailNotificationsEnabled());
        existing.setInterviewRemindersEnabled(settings.getInterviewRemindersEnabled());
        existing.setTwoFactorAuthEnabled(settings.getTwoFactorAuthEnabled());
        existing.setTimezone(settings.getTimezone());
        existing.setLanguage(settings.getLanguage());
        existing.setPaymentMethod(settings.getPaymentMethod());
        return interviewerSettingsRepository.save(existing);
    }
}
