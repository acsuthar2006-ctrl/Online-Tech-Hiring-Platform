package com.techhiring.platform.repository;

import com.techhiring.platform.entity.Position;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PositionRepository extends JpaRepository<Position, Long> {
  List<Position> findByCompanyId(Long companyId);
  List<Position> findByStatus(String status);
  List<Position> findByCompanyIdAndStatus(Long companyId, String status);
}
