import"./modulepreload-polyfill-B5Qt9EMX.js";/* empty css               */import"./auth-DKe50Cpr.js";import"./dashboard-DQEKwGMY.js";import{a as u}from"./api-BDkOtMsK.js";import{b as x,a as T}from"./dashboard-utils-BOnXSnva.js";import"./notifications-DCH5sCN5.js";let f="all",h="all",y="",I=[],b={},w=[],C={};document.addEventListener("DOMContentLoaded",()=>{const t=u.getUserInfo();if(!t){window.location.href="../../login/login.html";return}document.querySelectorAll("#userName, #profileName").forEach(i=>{i.textContent=t.fullName}),A(),F(),O(),S()});function A(){const t=document.getElementById("statusFilters");t&&t.addEventListener("click",e=>{const i=e.target&&e.target.closest?e.target.closest("button[data-status]"):null;if(!i)return;const n=i.getAttribute("data-status")||"all";L(n)})}function L(t){f=t,document.querySelectorAll("#statusFilters .status-filter-btn").forEach(e=>{e.classList.toggle("active",(e.getAttribute("data-status")||"all")===f)}),E()}function F(){const t=document.getElementById("postFilter");t&&t.addEventListener("change",()=>{h=t.value||"all",E()})}function O(){const t=document.getElementById("searchInput");t&&t.addEventListener("input",()=>{y=(t.value||"").trim().toLowerCase(),E()})}async function S(){const t=document.getElementById("companiesGrid");try{const e=u.getUserInfo(),[i,n,s,a]=await Promise.all([u.getAllCompanies(),u.getAllPositions(),u.getCandidateApplications(e.id).catch(()=>[]),u.getUpcomingInterviews(e.email).catch(()=>[])]);if(!i||i.length===0){t.innerHTML=x("No companies found at the moment.");return}const p={};(a||[]).forEach(o=>{if(o.position&&o.position.id){const l=p[o.position.id],v=g=>g==="ACCEPTED"||g==="REJECTED"?3:g==="COMPLETED"?2:1,c=o.candidateOutcome&&o.candidateOutcome!=="PENDING"?o.candidateOutcome:o.status;(!l||v(c)>v(l))&&(p[o.position.id]={interviewStatus:o.status,candidateOutcome:o.candidateOutcome})}});const r={};n.filter(o=>o.status==="OPEN").forEach(o=>{const l=o.company.id;r[l]||(r[l]=[]),r[l].push(o)}),I=i||[],b=r||{},w=s||[],C=p||{},$(),E()}catch(e){console.error("Failed to load companies:",e),t.innerHTML=T("Failed to load companies and positions. Please try again later.")}}function $(){const t=document.getElementById("postFilter");if(!t)return;const e=new Set,i=[{value:"all",label:"All Posts"}];Object.values(b||{}).flat().forEach(n=>{const s=((n==null?void 0:n.positionTitle)||"").trim();if(!s)return;const a=s.toLowerCase();e.has(a)||(e.add(a),i.push({value:s,label:s}))}),t.innerHTML=i.map(n=>`<option value="${n.value}">${n.label}</option>`).join(""),[...i].some(n=>n.value===h)||(h="all"),t.value=h}function N(t){const e=C[t];return e&&e.candidateOutcome==="ACCEPTED"?"accepted":e&&e.candidateOutcome==="REJECTED"?"rejected":w.find(n=>n.position&&n.position.id===t)||e?"applied":"none"}function M(t){const e=N(t);return f==="all"?!0:f==="applied"?e==="applied":f==="accepted"?e==="accepted":f==="rejected"?e==="rejected":!0}function E(){const t=document.getElementById("companiesGrid");if(!t)return;const e={};Object.keys(b||{}).forEach(n=>{const a=(b[n]||[]).filter(p=>{if(!M(p.id))return!1;const r=(p.positionTitle||"").toLowerCase();return!(h!=="all"&&r!==String(h||"").toLowerCase()||y&&!r.includes(y))});a.length>0&&(e[n]=a)});const i=(I||[]).filter(n=>e[n.id]&&e[n.id].length>0);if(!i||i.length===0){t.innerHTML=x("No companies match the selected filter.");return}D(i,e,w||[],C||{})}function D(t,e,i,n={}){const s=document.getElementById("companiesGrid");s.innerHTML="",t.forEach((a,p)=>{const r=e[a.id]||[],o=document.createElement("div");o.className="company-card";const l=["blue-bg","green-bg","purple-bg","orange-bg"],v=l[p%l.length];o.innerHTML=`
            <div class="company-header">
                <div class="company-logo-wrapper ${v}">
                    ${a.logoUrl?`<img src="${a.logoUrl}" alt="${a.companyName}">`:""}
                </div>
                <button class="btn-icon-sm">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
                    </svg>
                </button>
            </div>
            <h3>${a.companyName}</h3>
            <p class="company-description">${a.description||"No description available."}</p>
            <div class="company-meta">
                <span class="meta-item">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                        <circle cx="12" cy="10" r="3"/>
                    </svg>
                    ${a.location||"Remote"}
                </span>
                <span class="meta-item">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                        <circle cx="9" cy="7" r="4"/>
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                    </svg>
                    ${r.length} open positions
                </span>
            </div>
            <div class="positions-list">
                ${r.map(c=>{const g=i.find(P=>P.position&&P.position.id===c.id),d=n[c.id];let m="";return d&&d.candidateOutcome==="ACCEPTED"?m='<span class="badge badge-green" style="padding:4px 10px;font-weight:600;">✓ Accepted</span>':d&&d.candidateOutcome==="REJECTED"?m='<span class="badge" style="padding:4px 10px;font-weight:600;background:#fee2e2;color:#991b1b;">✕ Rejected</span>':d&&d.interviewStatus==="COMPLETED"?m='<span class="badge badge-blue" style="padding:4px 8px;">Interview Completed</span>':d&&(d.interviewStatus==="SCHEDULED"||d.interviewStatus==="IN_PROGRESS")?m='<span class="badge badge-blue" style="padding:4px 8px;">Interview Scheduled</span>':g?m=`<span class="badge badge-green" style="padding:4px 8px;">Applied (${g.status})</span>`:m=`<button class="btn-primary btn-sm" onclick="applyForPosition(${c.id})">Apply</button>`,`
                    <div class="position-item">
                        <div class="position-info">
                            <h4>${c.positionTitle}</h4>
                            <div class="position-tags">
                                <span class="badge badge-blue">Full-time</span>
                                <span class="badge badge-green">${c.salaryRange||"Competitive"}</span>
                                ${c.location?`<span class="badge badge-purple" style="margin-left: 4px;">${c.location}</span>`:""}
                            </div>
                        </div>
                        ${m}
                    </div>
                `}).join("")}
            </div>
        `,s.appendChild(o)})}window.applyForPosition=async t=>{try{const e=u.getUserInfo();if(!e||!e.id){alert("User ID not found. Please log in again.");return}const i=event.currentTarget;i&&(i.disabled=!0),await u.applyToPosition(e.id,t),alert("Successfully applied for position!"),S()}catch(e){alert("Failed to apply for position: "+e.message),event&&event.currentTarget&&(event.currentTarget.disabled=!1)}};
