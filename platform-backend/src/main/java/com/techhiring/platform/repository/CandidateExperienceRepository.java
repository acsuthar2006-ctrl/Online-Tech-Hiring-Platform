package com.techhiring.platform.repository;

import com.techhiring.platform.entity.CandidateExperience;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface CandidateExperienceRepository extends JpaRepository<CandidateExperience, Long> {
    List<CandidateExperience> findByCandidateId(Long candidateId);
}
