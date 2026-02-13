import { api } from '../../common/api.js';
import { createErrorState, createEmptyState } from '../../common/dashboard-utils.js';

document.addEventListener('DOMContentLoaded', () => {
    initializeCompanies();
});

async function initializeCompanies() {
    const grid = document.getElementById('companiesGrid');

    try {
        const [companies, positions] = await Promise.all([
            api.getAllCompanies(),
            api.getAllPositions()
        ]);

        if (!companies || companies.length === 0) {
            grid.innerHTML = createEmptyState('No companies found at the moment.');
            return;
        }

        // Map positions to companies
        const companyPositions = {};
        positions.forEach(pos => {
            const companyId = pos.company.id;
            if (!companyPositions[companyId]) {
                companyPositions[companyId] = [];
            }
            companyPositions[companyId].push(pos);
        });

        renderCompanies(companies, companyPositions);
    } catch (error) {
        console.error('Failed to load companies:', error);
        grid.innerHTML = createErrorState('Failed to load companies and positions. Please try again later.');
    }
}

function renderCompanies(companies, companyPositions) {
    const grid = document.getElementById('companiesGrid');
    grid.innerHTML = '';

    companies.forEach((company, index) => {
        const positions = companyPositions[company.id] || [];
        const card = document.createElement('div');
        card.className = 'company-card';

        // Cycle through some background colors for logos
        const colors = ['blue-bg', 'green-bg', 'purple-bg', 'orange-bg'];
        const colorClass = colors[index % colors.length];

        card.innerHTML = `
            <div class="company-header">
                <div class="company-logo-wrapper ${colorClass}">
                    ${company.logoUrl ? `<img src="${company.logoUrl}" alt="${company.companyName}">` : ''}
                </div>
                <button class="btn-icon-sm">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
                    </svg>
                </button>
            </div>
            <h3>${company.companyName}</h3>
            <p class="company-description">${company.description || 'No description available.'}</p>
            <div class="company-meta">
                <span class="meta-item">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                        <circle cx="12" cy="10" r="3"/>
                    </svg>
                    ${company.location || 'Remote'}
                </span>
                <span class="meta-item">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                        <circle cx="9" cy="7" r="4"/>
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                    </svg>
                    ${positions.length} open positions
                </span>
            </div>
            <div class="positions-list">
                ${positions.slice(0, 2).map(pos => `
                    <div class="position-item">
                        <div class="position-info">
                            <h4>${pos.positionTitle}</h4>
                            <div class="position-tags">
                                <span class="badge badge-blue">Full-time</span>
                                <span class="badge badge-green">${pos.salaryRange || 'Competitive'}</span>
                            </div>
                        </div>
                        <button class="btn-primary btn-sm" onclick="applyForPosition(${pos.id})">Apply</button>
                    </div>
                `).join('')}
            </div>
            ${positions.length > 2 ? `<button class="btn-outline btn-full">View All ${positions.length} Positions</button>` : ''}
        `;
        grid.appendChild(card);
    });
}

window.applyForPosition = (positionId) => {
    alert(`Application submitted for position ID: ${positionId}. (Integration in progress)`);
};
