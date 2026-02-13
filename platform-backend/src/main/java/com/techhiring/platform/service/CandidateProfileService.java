package com.techhiring.platform.service;

import com.techhiring.platform.entity.*;
import com.techhiring.platform.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CandidateProfileService {

    private final CandidateRepository candidateRepository;
    private final CandidateSkillRepository skillRepository;
    private final CandidateExperienceRepository experienceRepository;
    private final CandidateEducationRepository educationRepository;

    // Skills
    public List<CandidateSkill> getSkills(Long candidateId) {
        return skillRepository.findByCandidateId(candidateId);
    }

    @Transactional
    public CandidateSkill addSkill(Long candidateId, CandidateSkill skill) {
        Candidate candidate = candidateRepository.findById(candidateId)
                .orElseThrow(() -> new RuntimeException("Candidate not found"));
        skill.setCandidate(candidate);
        return skillRepository.save(skill);
    }

    @Transactional
    public void deleteSkill(Long skillId) {
        skillRepository.deleteById(skillId);
    }

    // Experience
    public List<CandidateExperience> getExperience(Long candidateId) {
        return experienceRepository.findByCandidateId(candidateId);
    }

    @Transactional
    public CandidateExperience addExperience(Long candidateId, CandidateExperience experience) {
        Candidate candidate = candidateRepository.findById(candidateId)
                .orElseThrow(() -> new RuntimeException("Candidate not found"));
        experience.setCandidate(candidate);
        return experienceRepository.save(experience);
    }

    @Transactional
    public void deleteExperience(Long experienceId) {
        experienceRepository.deleteById(experienceId);
    }

    // Education
    public List<CandidateEducation> getEducation(Long candidateId) {
        return educationRepository.findByCandidateId(candidateId);
    }

    @Transactional
    public CandidateEducation addEducation(Long candidateId, CandidateEducation education) {
        Candidate candidate = candidateRepository.findById(candidateId)
                .orElseThrow(() -> new RuntimeException("Candidate not found"));
        education.setCandidate(candidate);
        return educationRepository.save(education);
    }

    @Transactional
    public void deleteEducation(Long educationId) {
        educationRepository.deleteById(educationId);
    }
}
