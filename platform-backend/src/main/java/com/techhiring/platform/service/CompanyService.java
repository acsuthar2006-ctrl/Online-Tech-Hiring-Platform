package com.techhiring.platform.service;

import com.techhiring.platform.entity.Company;
import com.techhiring.platform.repository.CompanyRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class CompanyService {

  private final CompanyRepository companyRepository;

  public Company createCompany(Company company) {
    return companyRepository.save(company);
  }

  public Optional<Company> getCompanyById(Long id) {
    return companyRepository.findById(id);
  }

  public List<Company> getAllCompanies() {
    return companyRepository.findAll();
  }

  public Company updateCompany(Long id, Company companyDetails) {
    Company company = companyRepository.findById(id)
        .orElseThrow(() -> new RuntimeException("Company not found"));
    
    company.setCompanyName(companyDetails.getCompanyName());
    company.setIndustry(companyDetails.getIndustry());
    company.setEmail(companyDetails.getEmail());
    company.setPhone(companyDetails.getPhone());
    company.setLocation(companyDetails.getLocation());
    company.setWebsite(companyDetails.getWebsite());
    company.setDescription(companyDetails.getDescription());
    company.setLogoUrl(companyDetails.getLogoUrl());
    
    return companyRepository.save(company);
  }

  public void deleteCompany(Long id) {
    companyRepository.deleteById(id);
  }
}
