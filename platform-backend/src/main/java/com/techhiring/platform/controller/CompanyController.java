package com.techhiring.platform.controller;

import com.techhiring.platform.entity.Company;
import com.techhiring.platform.service.CompanyService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/companies")
@RequiredArgsConstructor
public class CompanyController {

  private final CompanyService companyService;

  @PostMapping
  public ResponseEntity<Company> createCompany(@RequestBody Company company) {
    return ResponseEntity.ok(companyService.createCompany(company));
  }

  @GetMapping("/{id}")
  public ResponseEntity<Company> getCompany(@PathVariable Long id) {
    return companyService.getCompanyById(id)
        .map(ResponseEntity::ok)
        .orElse(ResponseEntity.notFound().build());
  }

  @GetMapping
  public ResponseEntity<List<Company>> getAllCompanies() {
    return ResponseEntity.ok(companyService.getAllCompanies());
  }

  @PutMapping("/{id}")
  public ResponseEntity<Company> updateCompany(@PathVariable Long id, @RequestBody Company company) {
    return ResponseEntity.ok(companyService.updateCompany(id, company));
  }

  @DeleteMapping("/{id}")
  public ResponseEntity<Void> deleteCompany(@PathVariable Long id) {
    companyService.deleteCompany(id);
    return ResponseEntity.ok().build();
  }
}
