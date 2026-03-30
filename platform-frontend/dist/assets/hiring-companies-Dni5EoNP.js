import"./modulepreload-polyfill-B5Qt9EMX.js";/* empty css               */import"./notifications-CyUZvoHu.js";import"./dashboard-BJbQFGYd.js";import"./interviewer-sidebar-BBk2cHuw.js";import{a as g}from"./api-BDkOtMsK.js";import{b as A,a as I}from"./dashboard-utils-BOnXSnva.js";let u=null,x=null,f="all",h="all",C="",$=[],w={},P={};document.addEventListener("DOMContentLoaded",()=>{M(),L(),D(),S()});function L(){const e=document.getElementById("postFilter");e&&e.addEventListener("change",()=>{h=e.value||"all",E()})}function D(){const e=document.getElementById("searchInput");e&&e.addEventListener("input",()=>{C=(e.value||"").trim().toLowerCase(),E()})}function k(){const e=document.getElementById("postFilter");if(!e)return;const t=new Set,a=[{value:"all",label:"All Posts"}];Object.values(w||{}).flat().forEach(i=>{const s=((i==null?void 0:i.positionTitle)||"").trim();if(!s)return;const l=s.toLowerCase();t.has(l)||(t.add(l),a.push({value:s,label:s}))}),e.innerHTML=a.map(i=>`<option value="${i.value}">${i.label}</option>`).join(""),[...a].some(i=>i.value===h)||(h="all"),e.value=h}function M(){const e=document.getElementById("statusFilters");e&&e.addEventListener("click",t=>{const a=t.target&&t.target.closest?t.target.closest("button[data-status]"):null;a&&(f=a.getAttribute("data-status")||"all",document.querySelectorAll("#statusFilters .status-filter-btn").forEach(i=>{i.classList.toggle("active",(i.getAttribute("data-status")||"all")===f)}),E())})}function R(e){const t=(e||"").toUpperCase();return t==="APPROVED"||t==="ACCEPTED"?"accepted":t==="REJECTED"?"rejected":t?"applied":"none"}function E(){const e=document.getElementById("companyGrid");if(!e)return;const t={};Object.keys(w||{}).forEach(s=>{const d=(w[s]||[]).filter(c=>{const r=R(P[c.id]);return f==="all"?!0:f==="applied"?r==="applied":f==="accepted"?r==="accepted":f==="rejected"?r==="rejected":!0}).filter(c=>{const r=(c.positionTitle||"").toLowerCase();return!(h!=="all"&&r!==String(h||"").toLowerCase()||C&&!r.includes(C))});d.length>0&&(t[s]=d)});const a=($||[]).filter(s=>t[s.id]&&t[s.id].length>0),i=document.querySelector(".search-results");if(i){const s=f==="all"?"":` (${f})`;i.textContent=`Showing ${a.length} companies actively hiring interviewers${s}`}if(!a||a.length===0){e.innerHTML=A("No companies match the selected filter.");return}N(a,t,P)}async function S(){const e=document.getElementById("companyGrid"),t=document.getElementById("profileName");try{u=g.getUserInfo();const[a,i,s,l]=await Promise.all([g.getAllCompanies(),g.getAllPositions(),u?g.getInterviewerApplicationsByInterviewer(u.id):Promise.resolve([]),g.getUserProfile()]);l?(t.textContent=l.fullName,x=l):u&&(t.textContent=u.fullName||"Interviewer",x=u);const d={};s&&s.forEach(n=>{n.position&&n.position.id&&(d[n.position.id]=n.status)});const c=i.filter(n=>n.status==="OPEN"),r={};c.forEach(n=>{var o;const p=(o=n.company)==null?void 0:o.id;p&&(r[p]||(r[p]=[]),r[p].push(n))});const b=a.filter(n=>r[n.id]&&r[n.id].length>0);if(!b||b.length===0){e.innerHTML=A("No companies are currently hiring interviewers.");return}$=b||[],w=r||{},P=d||{},k();const y=document.querySelector(".search-results");y&&(y.textContent=`Showing ${$.length} companies actively hiring interviewers`),E()}catch(a){console.error("Failed to load hiring companies:",a),e.innerHTML=I("Failed to load companies. Please try again later.")}}function N(e,t,a){const i=document.getElementById("companyGrid");i.innerHTML="",e.forEach((s,l)=>{const d=t[s.id]||[],c=document.createElement("div");c.className="company-card";const r=["blue-bg","green-bg","purple-bg","orange-bg"],b=r[l%r.length];let y=d.map(o=>{const m=a[o.id];let v="";return m==="APPROVED"?v=`
                    <div style="display:flex; flex-direction:column; gap:6px; align-items:flex-end;">
                        <button class="btn-primary btn-sm" onclick="viewAssignedCandidates(${o.id}, ${JSON.stringify(o.positionTitle||"Position").replace(/\"/g,"&quot;")}, ${JSON.stringify(s.companyName||"Company").replace(/\"/g,"&quot;")}, ${s.id})">View Candidates</button>
                    </div>`:m==="REJECTED"?v='<span class="badge badge-error" style="padding:4px 8px;font-weight:600;background:#fee2e2;color:#991b1b;">✕ Rejected</span>':m?v=`<span class="badge badge-green" style="padding:4px 8px;">Applied (${m})</span>`:v=`<button class="btn-primary btn-sm" onclick="applyToPosition(event, ${o.id})">Apply</button>`,`
                    <div class="position-item" style="align-items: flex-start;">
                        <div class="position-info" style="flex: 1; padding-right: 16px;">
                            <h4 style="margin-bottom: 6px;">${o.positionTitle}</h4>
                            <div class="position-tags" style="margin-bottom: 8px;">
                                <span class="badge badge-blue">Full-time</span>
                                ${o.location?`<span class="badge badge-purple" style="margin-left: 4px;">${o.location}</span>`:""}
                            </div>
                            ${o.jobDescription?`<p style="font-size: 13px; color: #4b5563; margin: 8px 0; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; text-overflow: ellipsis; line-height: 1.4;">${o.jobDescription}</p>`:""}
                            ${o.requiredExpertise?`
                            <div style="display: flex; flex-wrap: wrap; gap: 4px; margin-top: 8px;">
                                ${o.requiredExpertise.split(",").map(T=>`<span style="font-size: 11px; background: #f3f4f6; color: #4b5563; padding: 2px 6px; border-radius: 4px; border: 1px solid #e5e7eb;">${T.trim()}</span>`).join("")}
                            </div>`:""}
                        </div>
                        <div style="flex-shrink: 0; padding-top: 2px;">
                            ${v}
                        </div>
                    </div>`}).join("");const n=new Set;d.forEach(o=>{o.requiredExpertise&&o.requiredExpertise.split(",").forEach(m=>n.add(m.trim()))});let p=Array.from(n).map(o=>`<span class="badge badge-success" style="background:#f0fdf4;color:#166534;border:1px solid #bbf7d0">${o}</span>`).join("");c.innerHTML=`
            <div class="company-header">
                <div class="company-logo-wrapper ${b}">
                    <span style="font-size: 28px; font-weight: bold;">${(s.companyName||"C").charAt(0)}</span>
                </div>
                <button class="btn-icon-sm">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
                    </svg>
                </button>
            </div>
            <h3>${s.companyName}</h3>
            <p class="company-description">${s.industry||"Tech"} · ${s.location||"Remote"}</p>
            <div class="company-meta">
                <span class="meta-item">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                        <circle cx="12" cy="10" r="3"/>
                    </svg>
                    ${s.location||"Remote"}
                </span>
                <span class="meta-item">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                        <circle cx="9" cy="7" r="4"/>
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                    </svg>
                    ${d.length} open position${d.length>1?"s":""}
                </span>
            </div>
            <div class="job-requirements" style="margin-bottom: 16px;">
                <div style="font-size: 11px; font-weight: 700; color: #6b7280; text-transform: uppercase; margin-bottom: 8px;">Required Expertise</div>
                <div style="display: flex; flex-wrap: wrap; gap: 6px;">
                    ${p}
                </div>
            </div>
            <div class="positions-list" style="margin-bottom: 0;">
                <div style="font-size: 13px; font-weight: 600; color: #374151; margin-bottom: 8px;">Positions:</div>
                <div class="positions-list" style="margin-bottom: 0;">
                    ${y}
                </div>
            </div>
        `,i.appendChild(c)})}window.applyToCompany=async(e,t)=>{if(!u){alert("Please log in to apply.");return}try{const a=e.target;a.disabled=!0,a.textContent="Applying...",await g.applyToCompanyAsInterviewer(u.id,t),alert("Application sent successfully!"),S()}catch(a){alert("Failed to apply: "+a.message);const i=e.target;i&&(i.disabled=!1,i.textContent="Apply to Interview")}};window.applyToPosition=async(e,t)=>{if(!u){alert("Please log in to apply.");return}try{const a=e.target;a.disabled=!0,a.textContent="Applying...",await g.applyToPositionAsInterviewer(u.id,t),alert("Application sent successfully!"),S()}catch(a){alert("Failed to apply: "+a.message);const i=e.target;i&&(i.disabled=!1,i.textContent="Apply")}};window.viewAssignedCandidates=async(e,t,a,i)=>{const s=document.getElementById("candidatesModal"),l=document.getElementById("modalTitle"),d=document.getElementById("candidatesList");if(!(!s||!l||!d)){l.textContent=`Candidates for ${t}`,d.innerHTML="<p>Loading candidates...</p>",s.style.display="flex";try{const c=await g.getCandidatesForPositionAssigned(e,x==null?void 0:x.id);if(!c||c.length===0){d.innerHTML='<p class="text-muted">No assigned candidates for this position yet.</p>';return}const r=O(c),b=r.length>0?`<div style="margin-bottom:16px;padding-bottom:16px;border-bottom:1px solid #e5e7eb;">
                 <button
                   class="btn btn-primary"
                   style="width:100%;font-weight:600;"
                   onclick="window.location.href='${H(r.map(n=>n.email),t,a,i,e)}'">
                   📅 Schedule Interview for all (${r.length} candidate${r.length>1?"s":""})
                 </button>
               </div>`:"",y=n=>{let p="";if(n.candidateOutcome&&n.candidateOutcome!=="PENDING"){const o=n.candidateOutcome==="ACCEPTED"?"badge-green":"badge-red",m=n.candidateOutcome==="ACCEPTED"?"✓ Accepted":"✕ Rejected";p=`<span class="badge ${o}" style="font-size:12px;font-weight:600;padding:6px 10px;">${m}</span>`}else n.interviewStatus==="COMPLETED"?p=`
                  <div style="display:flex;flex-direction:column;gap:6px;align-items:flex-end;">
                    <span class="badge badge-green" style="font-size:12px;">Interview Completed</span>
                    <div style="display:flex;gap:6px;">
                      <button class="btn btn-sm" style="background:#16a34a;color:white;" onclick="markOutcomeInModal(event, ${n.interviewId}, 'ACCEPTED')">✓ Accept</button>
                      <button class="btn btn-sm" style="background:#dc2626;color:white;" onclick="markOutcomeInModal(event, ${n.interviewId}, 'REJECTED')">✕ Reject</button>
                    </div>
                  </div>`:n.interviewStatus==="SCHEDULED"||n.interviewStatus==="IN_PROGRESS"?p=`<span class="badge badge-blue" style="font-size:12px;font-weight:500;padding:6px 10px;">${n.interviewStatus==="IN_PROGRESS"?"🔴 In Progress":"📅 Scheduled"}</span>`:n.status==="APPLIED"||n.status==="SHORTLISTED"||n.status==="PENDING"?p=`<button class="btn btn-primary btn-sm" onclick="openSchedulePage('${n.email}', '${(n.fullName||"Candidate").replace(/'/g,"\\'")}', '${String(t).replace(/'/g,"\\'")}', '${String(a).replace(/'/g,"\\'")}', ${e}, ${i||"null"})">Schedule Interview</button>`:p=`<span class="badge ${n.status==="REJECTED"?"badge-red":n.status==="OFFERED"||n.status==="ACCEPTED"?"badge-green":"badge-blue"}" style="font-size:12px;font-weight:500;">${String(n.status||"").replace("_"," ")}</span>`;return`
              <div style="border:1px solid #e5e7eb;border-radius:6px;padding:12px;margin-bottom:10px;display:flex;justify-content:space-between;align-items:center;">
                <div>
                  <h4 style="margin:0 0 4px 0">${n.fullName}</h4>
                  <p style="margin:0;font-size:13px;color:#6b7280;">${n.email} | Status: ${n.status}</p>
                </div>
                <div class="candidate-action">${p}</div>
              </div>
            `};d.innerHTML=b+c.map(y).join("")}catch(c){d.innerHTML=`<p style="color:red;">Failed to load candidates: ${c.message}</p>`}}};function O(e){return e.filter(t=>t.candidateOutcome&&t.candidateOutcome!=="PENDING"||t.interviewStatus==="SCHEDULED"||t.interviewStatus==="IN_PROGRESS"||t.interviewStatus==="COMPLETED"?!1:t.status==="APPLIED"||t.status==="SHORTLISTED"||t.status==="PENDING")}function H(e,t,a,i,s){return`schedule-an-interview.html?${new URLSearchParams({email:e.join(", "),positionTitle:t,companyName:a,...i?{companyId:i}:{},...s?{positionId:s}:{}}).toString()}`}window.closeCandidatesModal=()=>{const e=document.getElementById("candidatesModal");e&&(e.style.display="none")};window.openSchedulePage=(e,t,a,i,s,l)=>{const d=new URLSearchParams({email:e,name:t,positionTitle:a,companyName:i,positionId:s,...l?{companyId:l}:{}});window.location.href=`schedule-an-interview.html?${d.toString()}`};window.markOutcomeInModal=async(e,t,a)=>{if(!confirm(`Mark this candidate as ${a}?`))return;const i=e.target;i.disabled=!0;const s=i.textContent;i.textContent="Saving...";try{await g.updateInterviewOutcome(t,a);const l=i.closest(".candidate-action");if(l){const d=a==="ACCEPTED"?"badge-green":"badge-red",c=a==="ACCEPTED"?"✓ Accepted":"✕ Rejected";l.innerHTML=`<span class="badge ${d}" style="font-size:12px;font-weight:600;padding:6px 10px;">${c}</span>`}}catch(l){alert("Failed to update candidate outcome: "+l.message),i.disabled=!1,i.textContent=s}};
