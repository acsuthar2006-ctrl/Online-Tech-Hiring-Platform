import { api } from '../../common/api.js';
import { createErrorState, createEmptyState } from '../../common/dashboard-utils.js';

document.addEventListener('DOMContentLoaded', () => {
    initializeHiringCompanies();
});

async function initializeHiringCompanies() {
    const grid = document.getElementById('companyGrid');
    const profileName = document.getElementById('profileName');

    try {
        const [companies, profile] = await Promise.all([
            api.getAllCompanies(),
            api.getUserProfile()
        ]);

        if (profile) {
            profileName.textContent = profile.fullName;
        }

        if (!companies || companies.length === 0) {
            grid.innerHTML = createEmptyState('No companies are currently hiring interviewers.');
            return;
        }

        renderCompanyGrid(companies);
    } catch (error) {
        console.error('Failed to load hiring companies:', error);
        grid.innerHTML = createErrorState('Failed to load companies. Please try again later.');
    }
}

function renderCompanyGrid(companies) {
    const grid = document.getElementById('companyGrid');
    grid.innerHTML = '';

    companies.forEach(company => {
        const card = document.createElement('div');
        card.className = 'company-card';

        card.innerHTML = `
            <div class="company-status status-open">Open Position</div>
            <div class="company-header">
                <div class="company-logo">${company.companyName.charAt(0)}</div>
                <div class="company-basic">
                    <h3>${company.companyName}</h3>
                    <p>${company.industry || 'Tech'} · ${company.location || 'Remote'}</p>
                </div>
            </div>
            <div class="company-details">
                <div class="detail-row">
                    <span class="detail-label">Hourly Rate:</span>
                    <span class="detail-value">Competitive</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Availability:</span>
                    <span class="detail-value">Various</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Positions:</span>
                    <span class="detail-value">Available</span>
                </div>
            </div>
            <div class="job-requirements">
                <div class="req-title">Required Expertise</div>
                <div class="req-list">
                    <span class="req-tag">Technical Interviewing</span>
                    <span class="req-tag">Code Review</span>
                </div>
            </div>
            <div class="company-actions">
                <button class="btn-secondary btn-half" onclick="alert('Viewing details for ${company.companyName}...')">Learn More</button>
                <button class="btn-primary btn-half" onclick="applyToCompany(${company.id})">Apply Now</button>
            </div>
        `;
        grid.appendChild(card);
    });
}

window.applyToCompany = (companyId) => {
    alert(`Application sent to company ID: ${companyId}. (Integration in progress)`);
};
