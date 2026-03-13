import { api } from '../../common/api.js';
import { createErrorState, createEmptyState } from '../../common/dashboard-utils.js';

document.addEventListener('DOMContentLoaded', () => {

    const userInfo = api.getUserInfo();
    if (!userInfo) {
        window.location.href = '../../login/login.html';
        return;
    }

    // Update headers
    const userNameElements = document.querySelectorAll("#userName, #profileName");
    userNameElements.forEach((element) => {
        element.textContent = userInfo.fullName;
    });

    initializeCompanies();
});

async function initializeCompanies() {
    const grid = document.getElementById('companiesGrid');

    try {
        const userInfo = api.getUserInfo();
        const [companies, positions, rawApplications, interviews] = await Promise.all([
            api.getAllCompanies(),
            api.getAllPositions(),
            api.getCandidateApplications(userInfo.id).catch(() => []),
            api.getUpcomingInterviews(userInfo.email).catch(() => [])
        ]);

        if (!companies || companies.length === 0) {
            grid.innerHTML = createEmptyState('No companies found at the moment.');
            return;
        }

        // Build a map: positionId -> interview outcome
        const interviewOutcomeByPosition = {};
        (interviews || []).forEach(iv => {
            if (iv.position && iv.position.id) {
                // Keep the most decisive outcome: ACCEPTED/REJECTED > COMPLETED > SCHEDULED
                const existing = interviewOutcomeByPosition[iv.position.id];
                const rank = s => s === 'ACCEPTED' || s === 'REJECTED' ? 3 : s === 'COMPLETED' ? 2 : 1;
                const outcome = iv.candidateOutcome && iv.candidateOutcome !== 'PENDING'
                    ? iv.candidateOutcome
                    : iv.status; // fall back to interview status
                if (!existing || rank(outcome) > rank(existing)) {
                    interviewOutcomeByPosition[iv.position.id] = {
                        interviewStatus: iv.status,
                        candidateOutcome: iv.candidateOutcome
                    };
                }
            }
        });

        // Map positions to companies
        const companyPositions = {};
        positions.forEach(pos => {
            const companyId = pos.company.id;
            if (!companyPositions[companyId]) {
                companyPositions[companyId] = [];
            }
            companyPositions[companyId].push(pos);
        });

        renderCompanies(companies, companyPositions, rawApplications || [], interviewOutcomeByPosition);
    } catch (error) {
        console.error('Failed to load companies:', error);
        grid.innerHTML = createErrorState('Failed to load companies and positions. Please try again later.');
    }
}

function renderCompanies(companies, companyPositions, myApplications, interviewOutcomeByPosition = {}) {
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
                ${positions.map(pos => {
            const existingApp = myApplications.find(app => app.position && app.position.id === pos.id);
            const ivInfo = interviewOutcomeByPosition[pos.id];
            let actionHtml = '';

            if (ivInfo && ivInfo.candidateOutcome === 'ACCEPTED') {
                actionHtml = `<span class="badge badge-green" style="padding:4px 10px;font-weight:600;">✓ Accepted</span>`;
            } else if (ivInfo && ivInfo.candidateOutcome === 'REJECTED') {
                actionHtml = `<span class="badge" style="padding:4px 10px;font-weight:600;background:#fee2e2;color:#991b1b;">✕ Rejected</span>`;
            } else if (ivInfo && (ivInfo.interviewStatus === 'COMPLETED')) {
                actionHtml = `<span class="badge badge-blue" style="padding:4px 8px;">Interview Completed</span>`;
            } else if (ivInfo && (ivInfo.interviewStatus === 'SCHEDULED' || ivInfo.interviewStatus === 'IN_PROGRESS')) {
                actionHtml = `<span class="badge badge-blue" style="padding:4px 8px;">Interview Scheduled</span>`;
            } else if (existingApp) {
                actionHtml = `<span class="badge badge-green" style="padding:4px 8px;">Applied (${existingApp.status})</span>`;
            } else {
                actionHtml = `<button class="btn-primary btn-sm" onclick="applyForPosition(${pos.id})">Apply</button>`;
            }

            return `
                    <div class="position-item">
                        <div class="position-info">
                            <h4>${pos.positionTitle}</h4>
                            <div class="position-tags">
                                <span class="badge badge-blue">Full-time</span>
                                <span class="badge badge-green">${pos.salaryRange || 'Competitive'}</span>
                                ${pos.location ? `<span class="badge badge-purple" style="margin-left: 4px;">${pos.location}</span>` : ''}
                            </div>
                        </div>
                        ${actionHtml}
                    </div>
                `}).join('')}
            </div>
        `;
        grid.appendChild(card);
    });
}

window.applyForPosition = async (positionId) => {
    try {
        const userInfo = api.getUserInfo();
        if (!userInfo || !userInfo.id) {
            alert('User ID not found. Please log in again.');
            return;
        }

        const btn = event.currentTarget;
        if (btn) btn.disabled = true;

        await api.applyToPosition(userInfo.id, positionId);
        alert(`Successfully applied for position!`);
        initializeCompanies();
    } catch (error) {
        alert('Failed to apply for position: ' + error.message);
        if (event && event.currentTarget) event.currentTarget.disabled = false;
    }
};
