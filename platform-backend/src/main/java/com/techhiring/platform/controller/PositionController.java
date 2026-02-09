package com.techhiring.platform.controller;

import com.techhiring.platform.entity.Position;
import com.techhiring.platform.service.PositionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/positions")
@RequiredArgsConstructor
public class PositionController {

  private final PositionService positionService;

  @PostMapping
  public ResponseEntity<Position> createPosition(@RequestBody Position position) {
    return ResponseEntity.ok(positionService.createPosition(position));
  }

  @GetMapping("/{id}")
  public ResponseEntity<Position> getPosition(@PathVariable Long id) {
    return positionService.getPositionById(id)
        .map(ResponseEntity::ok)
        .orElse(ResponseEntity.notFound().build());
  }

  @GetMapping
  public ResponseEntity<List<Position>> getAllPositions() {
    return ResponseEntity.ok(positionService.getAllPositions());
  }

  @GetMapping("/company/{companyId}")
  public ResponseEntity<List<Position>> getPositionsByCompany(@PathVariable Long companyId) {
    return ResponseEntity.ok(positionService.getPositionsByCompany(companyId));
  }

  @GetMapping("/open")
  public ResponseEntity<List<Position>> getOpenPositions() {
    return ResponseEntity.ok(positionService.getOpenPositions());
  }

  @PutMapping("/{id}")
  public ResponseEntity<Position> updatePosition(@PathVariable Long id, @RequestBody Position position) {
    return ResponseEntity.ok(positionService.updatePosition(id, position));
  }

  @DeleteMapping("/{id}")
  public ResponseEntity<Void> deletePosition(@PathVariable Long id) {
    positionService.deletePosition(id);
    return ResponseEntity.ok().build();
  }
}
