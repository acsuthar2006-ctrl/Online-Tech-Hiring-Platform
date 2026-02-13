package com.techhiring.platform.repository;

import com.techhiring.platform.entity.CandidateEducation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface CandidateEducationRepository extends JpaRepository<CandidateEducation, Long> {
    List<CandidateEducation> findByCandidateId(Long candidateId);
}
