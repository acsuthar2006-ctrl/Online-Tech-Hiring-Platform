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

    companies.forEach((company, index) => {
        const positions = positionsByCompany[company.id] || [];
        const card = document.createElement('div');
        card.className = 'company-card';

        // Cycle through some background colors for logos
        const colors = ['blue-bg', 'green-bg', 'purple-bg', 'orange-bg'];
        const colorClass = colors[index % colors.length];

        let positionsHtml = positions.map(p => {
            const st = applicationByPosition[p.id];
            let actionHtml = '';

            if (st === 'APPROVED') {
                actionHtml = `
                    <div style="display:flex; flex-direction:column; gap:6px; align-items:flex-end;">
                        <button class="btn-primary btn-sm" onclick="viewAssignedCandidates(${p.id}, ${JSON.stringify(p.positionTitle || 'Position').replace(/\"/g, '&quot;')}, ${JSON.stringify(company.companyName || 'Company').replace(/\"/g, '&quot;')}, ${company.id})">View Candidates</button>
                    </div>`;
            } else if (st === 'REJECTED') {
                actionHtml = `<span class="badge badge-error" style="padding:4px 8px;font-weight:600;background:#fee2e2;color:#991b1b;">✕ Rejected</span>`;
            } else if (st) {
                actionHtml = `<span class="badge badge-green" style="padding:4px 8px;">Applied (${st})</span>`;
            } else {
                actionHtml = `<button class="btn-primary btn-sm" onclick="applyToPosition(event, ${p.id})">Apply</button>`;
            }

            return `
                    <div class="position-item" style="align-items: flex-start;">
                        <div class="position-info" style="flex: 1; padding-right: 16px;">
                            <h4 style="margin-bottom: 6px;">${p.positionTitle}</h4>
                            <div class="position-tags" style="margin-bottom: 8px;">
                                <span class="badge badge-blue">Full-time</span>
                                ${p.location ? `<span class="badge badge-purple" style="margin-left: 4px;">${p.location}</span>` : ''}
                            </div>
                            ${p.jobDescription ? `<p style="font-size: 13px; color: #4b5563; margin: 8px 0; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; text-overflow: ellipsis; line-height: 1.4;">${p.jobDescription}</p>` : ''}
                            ${p.requiredExpertise ? `
                            <div style="display: flex; flex-wrap: wrap; gap: 4px; margin-top: 8px;">
                                ${p.requiredExpertise.split(',').map(skill => `<span style="font-size: 11px; background: #f3f4f6; color: #4b5563; padding: 2px 6px; border-radius: 4px; border: 1px solid #e5e7eb;">${skill.trim()}</span>`).join('')}
                            </div>` : ''}
                        </div>
                        <div style="flex-shrink: 0; padding-top: 2px;">
                            ${actionHtml}
                        </div>
                    </div>`;
        }).join('');

        // Find all unique required expertises across positions for this company
        const allExpertise = new Set();
        positions.forEach(p => {
            if (p.requiredExpertise) {
                p.requiredExpertise.split(',').forEach(e => allExpertise.add(e.trim()));
            }
        });
        let expertiseHtml = Array.from(allExpertise).map(e => `<span class="badge badge-success" style="background:#f0fdf4;color:#166534;border:1px solid #bbf7d0">${e}</span>`).join('');

        card.innerHTML = `
            <div class="company-header">
                <div class="company-logo-wrapper ${colorClass}">
                    <span style="font-size: 28px; font-weight: bold;">${(company.companyName || 'C').charAt(0)}</span>
                </div>
                <button class="btn-icon-sm">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
                    </svg>
                </button>
            </div>
            <h3>${company.companyName}</h3>
            <p class="company-description">${company.industry || 'Tech'} · ${company.location || 'Remote'}</p>
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
                    ${positions.length} open position${positions.length > 1 ? 's' : ''}
                </span>
            </div>
            <div class="job-requirements" style="margin-bottom: 16px;">
                <div style="font-size: 11px; font-weight: 700; color: #6b7280; text-transform: uppercase; margin-bottom: 8px;">Required Expertise</div>
                <div style="display: flex; flex-wrap: wrap; gap: 6px;">
                    ${expertiseHtml}
                </div>
            </div>
            <div class="positions-list" style="margin-bottom: 0;">
                <div style="font-size: 13px; font-weight: 600; color: #374151; margin-bottom: 8px;">Positions:</div>
                <div class="positions-list" style="margin-bottom: 0;">
                    ${positionsHtml}
                </div>
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
