package com.techhiring.platform.service;

import com.techhiring.platform.entity.Interviewer;
import com.techhiring.platform.entity.InterviewerExpertise;
import com.techhiring.platform.repository.InterviewerExpertiseRepository;
import com.techhiring.platform.repository.InterviewerRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class InterviewerProfileService {

    private final InterviewerRepository interviewerRepository;
    private final InterviewerExpertiseRepository expertiseRepository;

    public List<InterviewerExpertise> getExpertise(Long interviewerId) {
        return expertiseRepository.findByInterviewerId(interviewerId);
    }

    @Transactional
    public InterviewerExpertise addExpertise(Long interviewerId, InterviewerExpertise expertise) {
        Interviewer interviewer = interviewerRepository.findById(interviewerId)
                .orElseThrow(() -> new RuntimeException("Interviewer not found"));
        expertise.setInterviewer(interviewer);
        return expertiseRepository.save(expertise);
    }

    @Transactional
    public void deleteExpertise(Long expertiseId) {
        expertiseRepository.deleteById(expertiseId);
    }
}
