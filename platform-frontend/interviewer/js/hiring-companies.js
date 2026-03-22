import { api } from '../../common/api.js';
import { createErrorState, createEmptyState } from '../../common/dashboard-utils.js';

let currentUser = null;
let interviewerProfile = null;
let currentStatusFilter = 'all'; // all | applied | accepted | rejected
let currentPostFilter = 'all';   // all | positionTitle
let currentSearchQuery = '';
let activeCompaniesCache = [];
let positionsByCompanyCache = {};
let applicationByPositionCache = {};

document.addEventListener('DOMContentLoaded', () => {
    wireUpStatusFilters();
    wireUpPostFilter();
    wireUpSearch();
    initializeHiringCompanies();
});

function wireUpPostFilter() {
    const el = document.getElementById('postFilter');
    if (!el) return;
    el.addEventListener('change', () => {
        currentPostFilter = el.value || 'all';
        renderWithFilters();
    });
}

function wireUpSearch() {
    const el = document.getElementById('searchInput');
    if (!el) return;
    el.addEventListener('input', () => {
        currentSearchQuery = (el.value || '').trim().toLowerCase();
        renderWithFilters();
    });
}

function populatePostFilter() {
    const el = document.getElementById('postFilter');
    if (!el) return;
    const seen = new Set();
    const options = [{ value: 'all', label: 'All Posts' }];
    Object.values(positionsByCompanyCache || {}).flat().forEach(p => {
        const title = (p?.positionTitle || '').trim();
        if (!title) return;
        const key = title.toLowerCase();
        if (seen.has(key)) return;
        seen.add(key);
        options.push({
            value: title,
            label: title
        });
    });
    el.innerHTML = options.map(o => `<option value="${o.value}">${o.label}</option>`).join('');
    if (![...options].some(o => o.value === currentPostFilter)) currentPostFilter = 'all';
    el.value = currentPostFilter;
}

function wireUpStatusFilters() {
    const container = document.getElementById('statusFilters');
    if (!container) return;

    container.addEventListener('click', (e) => {
        const btn = e.target && e.target.closest ? e.target.closest('button[data-status]') : null;
        if (!btn) return;
        currentStatusFilter = btn.getAttribute('data-status') || 'all';
        document.querySelectorAll('#statusFilters .status-filter-btn').forEach(b => {
            b.classList.toggle('active', (b.getAttribute('data-status') || 'all') === currentStatusFilter);
        });
        renderWithFilters();
    });
}

function normalizeInterviewerAppStatus(status) {
    const s = (status || '').toUpperCase();
    if (s === 'APPROVED' || s === 'ACCEPTED') return 'accepted';
    if (s === 'REJECTED') return 'rejected';
    if (s) return 'applied';
    return 'none';
}

function renderWithFilters() {
    const grid = document.getElementById('companyGrid');
    if (!grid) return;

    const filteredCompanyPositions = {};
    Object.keys(positionsByCompanyCache || {}).forEach(companyId => {
        const list = positionsByCompanyCache[companyId] || [];
        const filtered = list.filter(p => {
            const state = normalizeInterviewerAppStatus(applicationByPositionCache[p.id]);
            if (currentStatusFilter === 'all') return true;
            if (currentStatusFilter === 'applied') return state === 'applied';
            if (currentStatusFilter === 'accepted') return state === 'accepted';
            if (currentStatusFilter === 'rejected') return state === 'rejected';
            return true;
        }).filter(p => {
            const title = (p.positionTitle || '').toLowerCase();

            // Post dropdown filter: match by title only (across all companies)
            if (currentPostFilter !== 'all' && title !== String(currentPostFilter || '').toLowerCase()) return false;

            // Search: match by title only (not company name)
            if (currentSearchQuery && !title.includes(currentSearchQuery)) return false;

            return true;
        });
        if (filtered.length > 0) filteredCompanyPositions[companyId] = filtered;
    });

    const filteredCompanies = (activeCompaniesCache || []).filter(c => filteredCompanyPositions[c.id] && filteredCompanyPositions[c.id].length > 0);

    const searchResults = document.querySelector('.search-results');
    if (searchResults) {
        const suffix = currentStatusFilter === 'all' ? '' : ` (${currentStatusFilter})`;
        searchResults.textContent = `Showing ${filteredCompanies.length} companies actively hiring interviewers${suffix}`;
    }

    if (!filteredCompanies || filteredCompanies.length === 0) {
        grid.innerHTML = createEmptyState('No companies match the selected filter.');
        return;
    }

    renderCompanyGrid(filteredCompanies, filteredCompanyPositions, applicationByPositionCache);
}

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
            interviewerProfile = profile;
        } else if (currentUser) {
            profileName.textContent = currentUser.fullName || 'Interviewer';
            interviewerProfile = currentUser;
        }

        // Map applications by companyId for quick access
        const applicationByPosition = {};
        if (applications) {
            applications.forEach(app => {
                if (app.position && app.position.id) {
                    applicationByPosition[app.position.id] = app.status;
                }
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

        activeCompaniesCache = activeCompanies || [];
        positionsByCompanyCache = positionsByCompany || {};
        applicationByPositionCache = applicationByPosition || {};
        populatePostFilter();

        // Default search results (will be overwritten by filters if active)
        const searchResults = document.querySelector('.search-results');
        if (searchResults) searchResults.textContent = `Showing ${activeCompaniesCache.length} companies actively hiring interviewers`;

        renderWithFilters();
    } catch (error) {
        console.error('Failed to load hiring companies:', error);
        grid.innerHTML = createErrorState('Failed to load companies. Please try again later.');
    }
}

function renderCompanyGrid(companies, positionsByCompany, applicationByPosition) {
    const grid = document.getElementById('companyGrid');
    grid.innerHTML = '';

    companies.forEach(company => {
        const positions = positionsByCompany[company.id] || [];

        const card = document.createElement('div');
        card.className = 'company-card';

        let positionsHtml = positions.map(p => {
            const st = applicationByPosition[p.id];
            if (st) {
                const cls = st === 'APPROVED' ? 'badge-green' : (st === 'REJECTED' ? 'badge-red' : 'badge-blue');
                const actions = st === 'APPROVED'
                  ? `<div style="display:flex; gap:6px; align-items:center;">
                      <span class="badge ${cls}" style="padding:4px 8px;">${st}</span>
                      <button class="btn-outline btn-sm" onclick="viewAssignedCandidates(${p.id}, ${JSON.stringify(p.positionTitle || 'Position').replace(/\"/g, '&quot;')}, ${JSON.stringify(company.companyName || 'Company').replace(/\"/g, '&quot;')}, ${company.id})">View Candidates</button>
                    </div>`
                  : `<span class="badge ${cls}" style="padding:4px 8px;">${st}</span>`;
                return `<div class="req-tag" style="display:flex;align-items:center;justify-content:space-between;gap:8px;width:100%;">
                  <span>${p.positionTitle}${p.location ? ' (' + p.location + ')' : ''}</span>
                  ${actions}
                </div>`;
            }
            return `<div class="req-tag" style="display:flex;align-items:center;justify-content:space-between;gap:8px;width:100%;">
              <span>${p.positionTitle}${p.location ? ' (' + p.location + ')' : ''}</span>
              <button class="btn-primary btn-sm" onclick="applyToPosition(event, ${p.id})">Apply</button>
            </div>`;
        }).join('');

        // Find all unique required expertises across positions for this company
        const allExpertise = new Set();
        positions.forEach(p => {
            if (p.requiredExpertise) {
                p.requiredExpertise.split(',').forEach(e => allExpertise.add(e.trim()));
            }
        });
        let expertiseHtml = Array.from(allExpertise).map(e => `<span class="req-tag" style="background:#f0fdf4;color:#166534;border:1px solid #bbf7d0">${e}</span>`).join('');

        const actionHtml = ``;

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
                    <span class="detail-value" style="display:flex;flex-direction:column;flex-wrap:nowrap;gap:8px;margin-top:4px;color:inherit;">${positionsHtml}</span>
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

window.applyToPosition = async (event, positionId) => {
    if (!currentUser) {
        alert("Please log in to apply.");
        return;
    }
    try {
        const btn = event.target;
        btn.disabled = true;
        btn.textContent = "Applying...";

        await api.applyToPositionAsInterviewer(currentUser.id, positionId);
        alert('Application sent successfully!');
        initializeHiringCompanies();
    } catch (error) {
        alert('Failed to apply: ' + error.message);
        const btn = event.target;
        if (btn) {
            btn.disabled = false;
            btn.textContent = "Apply";
        }
    }
};

window.viewAssignedCandidates = async (positionId, positionTitle, companyName, companyId) => {
    const modal = document.getElementById('candidatesModal');
    const title = document.getElementById('modalTitle');
    const list = document.getElementById('candidatesList');
    if (!modal || !title || !list) return;

    title.textContent = `Candidates for ${positionTitle}`;
    list.innerHTML = `<p>Loading candidates...</p>`;
    modal.style.display = 'flex';

    try {
        const candidates = await api.getCandidatesForPositionAssigned(positionId, interviewerProfile?.id);
        if (!candidates || candidates.length === 0) {
            list.innerHTML = `<p class="text-muted">No assigned candidates for this position yet.</p>`;
            return;
        }

        // --- Schedule All button ---
        const pendingCandidates = getPendingCandidates(candidates);
        const scheduleAllHtml = pendingCandidates.length > 0
            ? `<div style="margin-bottom:16px;padding-bottom:16px;border-bottom:1px solid #e5e7eb;">
                 <button
                   class="btn btn-primary"
                   style="width:100%;font-weight:600;"
                   onclick="window.location.href='${buildScheduleAllUrl(pendingCandidates.map(c => c.email), positionTitle, companyName, companyId, positionId)}'">
                   📅 Schedule Interview for all (${pendingCandidates.length} candidate${pendingCandidates.length > 1 ? 's' : ''})
                 </button>
               </div>`
            : '';

        const renderCandidateRow = (c) => {
            let actionHTML = '';

            if (c.candidateOutcome && c.candidateOutcome !== 'PENDING') {
                const badgeClass = c.candidateOutcome === 'ACCEPTED' ? 'badge-green' : 'badge-red';
                const label = c.candidateOutcome === 'ACCEPTED' ? '✓ Accepted' : '✕ Rejected';
                actionHTML = `<span class="badge ${badgeClass}" style="font-size:12px;font-weight:600;padding:6px 10px;">${label}</span>`;
            } else if (c.interviewStatus === 'COMPLETED') {
                actionHTML = `
                  <div style="display:flex;flex-direction:column;gap:6px;align-items:flex-end;">
                    <span class="badge badge-green" style="font-size:12px;">Interview Completed</span>
                    <div style="display:flex;gap:6px;">
                      <button class="btn btn-sm" style="background:#16a34a;color:white;" onclick="markOutcomeInModal(event, ${c.interviewId}, 'ACCEPTED')">✓ Accept</button>
                      <button class="btn btn-sm" style="background:#dc2626;color:white;" onclick="markOutcomeInModal(event, ${c.interviewId}, 'REJECTED')">✕ Reject</button>
                    </div>
                  </div>`;
            } else if (c.interviewStatus === 'SCHEDULED' || c.interviewStatus === 'IN_PROGRESS') {
                const label = c.interviewStatus === 'IN_PROGRESS' ? '🔴 In Progress' : '📅 Scheduled';
                actionHTML = `<span class="badge badge-blue" style="font-size:12px;font-weight:500;padding:6px 10px;">${label}</span>`;
            } else if (c.status === 'APPLIED' || c.status === 'SHORTLISTED' || c.status === 'PENDING') {
                actionHTML = `<button class="btn btn-primary btn-sm" onclick="openSchedulePage('${c.email}', '${(c.fullName || 'Candidate').replace(/'/g, "\\'")}', '${String(positionTitle).replace(/'/g, "\\'")}', '${String(companyName).replace(/'/g, "\\'")}', ${positionId}, ${companyId || 'null'})">Schedule Interview</button>`;
            } else {
                const badgeClass = c.status === 'REJECTED' ? 'badge-red' : (c.status === 'OFFERED' || c.status === 'ACCEPTED' ? 'badge-green' : 'badge-blue');
                actionHTML = `<span class="badge ${badgeClass}" style="font-size:12px;font-weight:500;">${String(c.status || '').replace('_', ' ')}</span>`;
            }

            return `
              <div style="border:1px solid #e5e7eb;border-radius:6px;padding:12px;margin-bottom:10px;display:flex;justify-content:space-between;align-items:center;">
                <div>
                  <h4 style="margin:0 0 4px 0">${c.fullName}</h4>
                  <p style="margin:0;font-size:13px;color:#6b7280;">${c.email} | Status: ${c.status}</p>
                </div>
                <div class="candidate-action">${actionHTML}</div>
              </div>
            `;
        };

        list.innerHTML = scheduleAllHtml + candidates.map(renderCandidateRow).join('');
    } catch (e) {
        list.innerHTML = `<p style="color:red;">Failed to load candidates: ${e.message}</p>`;
    }
};

// Returns candidates who still need an interview scheduled
function getPendingCandidates(candidates) {
    return candidates.filter(c => {
        if (c.candidateOutcome && c.candidateOutcome !== 'PENDING') return false;
        if (c.interviewStatus === 'SCHEDULED' || c.interviewStatus === 'IN_PROGRESS' || c.interviewStatus === 'COMPLETED') return false;
        return c.status === 'APPLIED' || c.status === 'SHORTLISTED' || c.status === 'PENDING';
    });
}

// Builds the URL to open the schedule page with multiple emails pre-filled
function buildScheduleAllUrl(emails, positionTitle, companyName, companyId, positionId) {
    const params = new URLSearchParams({
        email: emails.join(', '),
        positionTitle,
        companyName,
        ...(companyId ? { companyId } : {}),
        ...(positionId ? { positionId } : {})
    });
    return `schedule-an-interview.html?${params.toString()}`;
}

window.closeCandidatesModal = () => {
    const modal = document.getElementById('candidatesModal');
    if (modal) modal.style.display = 'none';
};

window.openSchedulePage = (email, name, positionTitle, companyName, positionId, companyId) => {
    const params = new URLSearchParams({
        email,
        name,
        positionTitle,
        companyName,
        positionId,
        ...(companyId ? { companyId } : {})
    });
    window.location.href = `schedule-an-interview.html?${params.toString()}`;
};

window.markOutcomeInModal = async (event, interviewId, outcome) => {
    if (!confirm(`Mark this candidate as ${outcome}?`)) return;
    const btn = event.target;
    btn.disabled = true;
    const original = btn.textContent;
    btn.textContent = 'Saving...';
    try {
        await api.updateInterviewOutcome(interviewId, outcome);
        const actionDiv = btn.closest('.candidate-action');
        if (actionDiv) {
            const badgeClass = outcome === 'ACCEPTED' ? 'badge-green' : 'badge-red';
            const label = outcome === 'ACCEPTED' ? '✓ Accepted' : '✕ Rejected';
            actionDiv.innerHTML = `<span class="badge ${badgeClass}" style="font-size:12px;font-weight:600;padding:6px 10px;">${label}</span>`;
        }
    } catch (e) {
        alert('Failed to update candidate outcome: ' + e.message);
        btn.disabled = false;
        btn.textContent = original;
    }
};
