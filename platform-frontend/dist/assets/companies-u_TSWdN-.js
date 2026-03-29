import"./modulepreload-polyfill-B5Qt9EMX.js";/* empty css               */import"./notifications-CyUZvoHu.js";import"./dashboard-BJbQFGYd.js";import"./sidebar-ckr4qzLM.js";import{a as u}from"./api-BDkOtMsK.js";import{b as P,a as S}from"./dashboard-utils-BOnXSnva.js";let f="all",h="all",x="",$=[],y={},w=[],C={};document.addEventListener("DOMContentLoaded",()=>{const t=u.getUserInfo();if(!t){window.location.href="../../login/login.html";return}document.querySelectorAll("#userName, #profileName").forEach(n=>{n.textContent=t.fullName}),T(),L(),F(),I()});function T(){const t=document.getElementById("statusFilters");t&&t.addEventListener("click",e=>{const n=e.target&&e.target.closest?e.target.closest("button[data-status]"):null;if(!n)return;const i=n.getAttribute("data-status")||"all";A(i)})}function A(t){f=t,document.querySelectorAll("#statusFilters .status-filter-btn").forEach(e=>{e.classList.toggle("active",(e.getAttribute("data-status")||"all")===f)}),E()}function L(){const t=document.getElementById("postFilter");t&&t.addEventListener("change",()=>{h=t.value||"all",E()})}function F(){const t=document.getElementById("searchInput");t&&t.addEventListener("input",()=>{x=(t.value||"").trim().toLowerCase(),E()})}async function I(){const t=document.getElementById("companiesGrid");try{const e=u.getUserInfo(),[n,i,r,a]=await Promise.all([u.getAllCompanies(),u.getAllPositions(),u.getCandidateApplications(e.id).catch(()=>[]),u.getUpcomingInterviews(e.email).catch(()=>[])]);if(!n||n.length===0){t.innerHTML=P("No companies found at the moment.");return}const p={};(a||[]).forEach(o=>{if(o.position&&o.position.id){const c=p[o.position.id],b=g=>g==="ACCEPTED"||g==="REJECTED"?3:g==="COMPLETED"?2:1,s=o.candidateOutcome&&o.candidateOutcome!=="PENDING"?o.candidateOutcome:o.status;(!c||b(s)>b(c))&&(p[o.position.id]={interviewStatus:o.status,candidateOutcome:o.candidateOutcome})}});const l={};i.filter(o=>o.status==="OPEN").forEach(o=>{const c=o.company.id;l[c]||(l[c]=[]),l[c].push(o)}),$=n||[],y=l||{},w=r||[],C=p||{},O(),E()}catch(e){console.error("Failed to load companies:",e),t.innerHTML=S("Failed to load companies and positions. Please try again later.")}}function O(){const t=document.getElementById("postFilter");if(!t)return;const e=new Set,n=[{value:"all",label:"All Posts"}];Object.values(y||{}).flat().forEach(i=>{const r=((i==null?void 0:i.positionTitle)||"").trim();if(!r)return;const a=r.toLowerCase();e.has(a)||(e.add(a),n.push({value:r,label:r}))}),t.innerHTML=n.map(i=>`<option value="${i.value}">${i.label}</option>`).join(""),[...n].some(i=>i.value===h)||(h="all"),t.value=h}function k(t){const e=C[t];return e&&e.candidateOutcome==="ACCEPTED"?"accepted":e&&e.candidateOutcome==="REJECTED"?"rejected":w.find(i=>i.position&&i.position.id===t)||e?"applied":"none"}function D(t){const e=k(t);return f==="all"?!0:f==="applied"?e==="applied":f==="accepted"?e==="accepted":f==="rejected"?e==="rejected":!0}function E(){const t=document.getElementById("companiesGrid");if(!t)return;const e={};Object.keys(y||{}).forEach(i=>{const a=(y[i]||[]).filter(p=>{if(!D(p.id))return!1;const l=(p.positionTitle||"").toLowerCase();return!(h!=="all"&&l!==String(h||"").toLowerCase()||x&&!l.includes(x))});a.length>0&&(e[i]=a)});const n=($||[]).filter(i=>e[i.id]&&e[i.id].length>0);if(!n||n.length===0){t.innerHTML=P("No companies match the selected filter.");return}N(n,e,w||[],C||{})}function N(t,e,n,i={}){const r=document.getElementById("companiesGrid");r.innerHTML="",t.forEach((a,p)=>{const l=e[a.id]||[],o=document.createElement("div");o.className="company-card";const c=["blue-bg","green-bg","purple-bg","orange-bg"],b=c[p%c.length];o.innerHTML=`
            <div class="company-header">
                <div class="company-logo-wrapper ${b}">
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
                    ${l.length} open positions
                </span>
            </div>
            <div class="positions-list">
                ${l.map(s=>{const g=n.find(v=>v.position&&v.position.id===s.id),d=i[s.id];let m="";return d&&d.candidateOutcome==="ACCEPTED"?m='<span class="badge badge-green" style="padding:4px 10px;font-weight:600;">✓ Accepted</span>':d&&d.candidateOutcome==="REJECTED"?m='<span class="badge" style="padding:4px 10px;font-weight:600;background:#fee2e2;color:#991b1b;">✕ Rejected</span>':d&&d.interviewStatus==="COMPLETED"?m='<span class="badge badge-blue" style="padding:4px 8px;">Interview Completed</span>':d&&(d.interviewStatus==="SCHEDULED"||d.interviewStatus==="IN_PROGRESS")?m='<span class="badge badge-blue" style="padding:4px 8px;">Interview Scheduled</span>':g?m=`<span class="badge badge-green" style="padding:4px 8px;">Applied (${g.status})</span>`:m=`<button class="btn-primary btn-sm" onclick="applyForPosition(${s.id})">Apply</button>`,`
                    <div class="position-item" style="align-items: flex-start;">
                        <div class="position-info" style="flex: 1; padding-right: 16px;">
                            <h4 style="margin-bottom: 6px;">${s.positionTitle}</h4>
                            <div class="position-tags" style="margin-bottom: 8px;">
                                <span class="badge badge-blue">Full-time</span>
                                <span class="badge badge-green">${s.salaryRange||"Competitive"}</span>
                                ${s.location?`<span class="badge badge-purple" style="margin-left: 4px;">${s.location}</span>`:""}
                            </div>
                            ${s.jobDescription?`<p style="font-size: 13px; color: #4b5563; margin: 8px 0; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; text-overflow: ellipsis; line-height: 1.4;">${s.jobDescription}</p>`:""}
                            ${s.requiredExpertise?`
                            <div style="display: flex; flex-wrap: wrap; gap: 4px; margin-top: 8px;">
                                ${s.requiredExpertise.split(",").map(v=>`<span style="font-size: 11px; background: #f3f4f6; color: #4b5563; padding: 2px 6px; border-radius: 4px; border: 1px solid #e5e7eb;">${v.trim()}</span>`).join("")}
                            </div>`:""}
                        </div>
                        <div style="flex-shrink: 0; padding-top: 2px;">
                            ${m}
                        </div>
                    </div>
                `}).join("")}
            </div>
        `,r.appendChild(o)})}window.applyForPosition=async t=>{try{const e=u.getUserInfo();if(!e||!e.id){alert("User ID not found. Please log in again.");return}const n=event.currentTarget;n&&(n.disabled=!0),await u.applyToPosition(e.id,t),alert("Successfully applied for position!"),I()}catch(e){alert("Failed to apply for position: "+e.message),event&&event.currentTarget&&(event.currentTarget.disabled=!1)}};
