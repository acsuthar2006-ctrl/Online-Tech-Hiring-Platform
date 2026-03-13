import { api } from '../../common/api.js';
import { createErrorState, createEmptyState } from '../../common/dashboard-utils.js';

let currentUser = null;

document.addEventListener('DOMContentLoaded', () => {
    initializeHiringCompanies();
});

async function initializeHiringCompanies() {
    const grid = document.getElementById('companyGrid');
    const profileName = document.getElementById('profileName');

    try {
        currentUser = api.getUserInfo();

        const [companies, positions, applications, profile] = await Promise.all([
            api.getAllCompanies(),
            api.getAllPositions(),
            currentUser ? api.getInterviewerApplicationsByInterviewer(currentUser.id) : Promise.resolve([]),
            api.getUserProfile()
        ]);

        if (profile) {
            profileName.textContent = profile.fullName;
        } else if (currentUser) {
            profileName.textContent = currentUser.fullName || 'Interviewer';
        }

        // Map applications by companyId for quick access
        const applicationMap = {};
        if (applications) {
            applications.forEach(app => {
                applicationMap[app.company.id] = app.status;
            });
        }

        // Filter for OPEN positions
        const openPositions = positions.filter(p => p.status === 'OPEN');

        // Group positions by company
        const positionsByCompany = {};
        openPositions.forEach(p => {
            const cId = p.company?.id;
            if (cId) {
                if (!positionsByCompany[cId]) positionsByCompany[cId] = [];
                positionsByCompany[cId].push(p);
            }
        });

        // Only show companies that have open positions
        const activeCompanies = companies.filter(c => positionsByCompany[c.id] && positionsByCompany[c.id].length > 0);

        if (!activeCompanies || activeCompanies.length === 0) {
            grid.innerHTML = createEmptyState('No companies are currently hiring interviewers.');
            return;
        }

        // Update search results text
        const searchResults = document.querySelector('.search-results');
        if (searchResults) searchResults.textContent = `Showing ${activeCompanies.length} companies actively hiring interviewers`;

        renderCompanyGrid(activeCompanies, positionsByCompany, applicationMap);
    } catch (error) {
        console.error('Failed to load hiring companies:', error);
        grid.innerHTML = createErrorState('Failed to load companies. Please try again later.');
    }
}

function renderCompanyGrid(companies, positionsByCompany, applicationMap) {
    const grid = document.getElementById('companyGrid');
    grid.innerHTML = '';

    companies.forEach(company => {
        const positions = positionsByCompany[company.id] || [];
        const appStatus = applicationMap[company.id];

        const card = document.createElement('div');
        card.className = 'company-card';

        let positionsHtml = positions.map(p => `<span class="req-tag">${p.positionTitle}${p.location ? ' (' + p.location + ')' : ''}</span>`).join('');

        // Find all unique required expertises across positions for this company
        const allExpertise = new Set();
        positions.forEach(p => {
            if (p.requiredExpertise) {
                p.requiredExpertise.split(',').forEach(e => allExpertise.add(e.trim()));
            }
        });
        let expertiseHtml = Array.from(allExpertise).map(e => `<span class="req-tag" style="background:#f0fdf4;color:#166534;border:1px solid #bbf7d0">${e}</span>`).join('');

        let actionHtml = '';
        if (appStatus) {
            let statusClass = appStatus === 'APPROVED' ? 'status-accepted' : (appStatus === 'REJECTED' ? 'status-rejected' : 'status-pending');
            actionHtml = `<div class="company-action-status ${statusClass}" style="width:100%;text-align:center;padding:10px;border-radius:6px;font-weight:500;">Status: ${appStatus}</div>`;
        } else {
            actionHtml = `<button class="btn-primary" style="width:100%" onclick="applyToCompany(event, ${company.id})">Apply to Interview</button>`;
        }

        card.innerHTML = `
            <div class="company-status status-open">${positions.length} Open Position${positions.length > 1 ? 's' : ''}</div>
            <div class="company-header">
                <div class="company-logo">${(company.companyName || 'C').charAt(0)}</div>
                <div class="company-basic">
                    <h3>${company.companyName || 'Unknown Company'}</h3>
                    <p>${company.industry || 'Tech'} · ${company.location || 'Remote'}</p>
                </div>
            </div>
            <div class="company-details">
                <div class="detail-row">
                    <span class="detail-label">Positions:</span>
                    <span class="detail-value" style="display:flex;flex-wrap:wrap;gap:4px;margin-top:4px;">${positionsHtml}</span>
                </div>
            </div>
            <div class="job-requirements">
                <div class="req-title">Required Expertise</div>
                <div class="req-list" style="margin-top:8px;">
                    ${expertiseHtml}
                </div>
            </div>
            <div class="company-actions" style="margin-top:16px;">
                ${actionHtml}
            </div>
        `;
        grid.appendChild(card);
    });
}

window.applyToCompany = async (event, companyId) => {
    if (!currentUser) {
        alert("Please log in to apply.");
        return;
    }
    try {
        const btn = event.target;
        btn.disabled = true;
        btn.textContent = "Applying...";

        await api.applyToCompanyAsInterviewer(currentUser.id, companyId);
        alert('Application sent successfully!');

        // Reload grid to show new status
        initializeHiringCompanies();
    } catch (error) {
        alert('Failed to apply: ' + error.message);
        const btn = event.target;
        if (btn) {
            btn.disabled = false;
            btn.textContent = "Apply to Interview";
        }
    }
};
