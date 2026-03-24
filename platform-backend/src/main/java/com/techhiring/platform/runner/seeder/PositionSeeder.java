package com.techhiring.platform.runner.seeder;

import com.techhiring.platform.entity.Company;
import com.techhiring.platform.entity.Position;
import com.techhiring.platform.repository.PositionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import net.datafaker.Faker;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class PositionSeeder {

    private final PositionRepository positionRepository;
    private final Faker faker = new Faker();

    public List<Position> seed(int countPerCompany, List<Company> companies) {
        log.info("Seeding {} positions per company...", countPerCompany);
        List<Position> positions = new ArrayList<>();

        for (Company company : companies) {
            for (int i = 0; i < countPerCompany; i++) {
                Position position = Position.builder()
                        .company(company)
                        .positionTitle(faker.job().title())
                        .jobDescription(faker.lorem().paragraph(3))
                        .salaryRange("$" + faker.number().numberBetween(60, 100) + "k - $" + faker.number().numberBetween(110, 180) + "k")
                        .location(faker.address().cityName() + " / Remote")
                        .requiredExpertise(faker.programmingLanguage().name() + ", " + faker.programmingLanguage().name())
                        .status("OPEN")
                        .build();

                positions.add(positionRepository.save(position));
            }
        }
        log.info("Successfully seeded {} positions.", positions.size());
        return positions;
    }
}
