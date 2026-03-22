import"./modulepreload-polyfill-B5Qt9EMX.js";/* empty css               *//* empty css                    */import"./interviewer-sidebar-BBk2cHuw.js";import{i as C}from"./notifications-k8PWt7_S.js";import{a as u}from"./api-BDkOtMsK.js";import{c as E,a as $}from"./dashboard-utils-BOnXSnva.js";let c=null,m=[],h=[],v={};async function b(){try{const t=document.getElementById("dashboard-content");if(t&&(t.innerHTML=E()),c=await u.getUserProfile(),c.role!=="INTERVIEWER"){window.location.href="/candidate/candidate-dashboard.html";return}m=await u.getUpcomingInterviewsForInterviewer(c.email),console.log("Scheduled interviews loaded:",m);try{const[e,n]=await Promise.all([u.getApprovedCompanies(c.id),u.getAllPositions()]);h=e,v={},(n||[]).forEach(a=>{v[a.id]=a.status}),console.log("Approved Companies loaded:",h)}catch(e){console.warn("Failed to load approved companies or positions:",e),h=[]}await I()}catch(t){console.error("Dashboard initialization error:",t);const e=document.getElementById("dashboard-content");e&&(e.innerHTML=$(t.message||"Failed to load dashboard"))}}async function I(){if(!document.getElementById("dashboard-styles")){const s=document.createElement("style");s.id="dashboard-styles",s.textContent=`
      .empty-state { text-align: center; padding: 30px; }
      .empty-icon { font-size: 48px; margin-bottom: 10px; }
      .empty-state h3 { color: #374151; margin-bottom: 5px; }
    `,document.head.appendChild(s)}const t=document.getElementById("dashboard-content");if(!t)return;const e=m.filter(s=>s.status==="SCHEDULED"||s.status==="IN_PROGRESS").length,a=m.filter(s=>s.status==="COMPLETED").length,i=new Set(m.map(s=>s.companyName).filter(Boolean));c.activeCompanies||i.size,c.totalEarnings&&`${c.totalEarnings}`;const r=await w(m,"upcoming"),d=await w(m,"completed"),l=`
    <!-- Header -->
    <div class="header" style="margin-bottom: 30px; display: flex; justify-content: space-between; align-items: center;">
      <div class="header-left">
        <h1>Welcome, <span id="userName">${c.fullName}</span>!</h1>
        <p class="text-muted">Manage your interviews and explore opportunities</p>
      </div>
      <div class="header-right">
        <button class="btn-icon" id="notificationBtn">
            <span class="notification-badge" style="display:none;">0</span>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M18 8A6 6 0 0 0 6 8C6 15 3 17 3 17H21C21 17 18 15 18 8Z" stroke="currentColor" stroke-width="2"
                        stroke-linecap="round" stroke-linejoin="round" />
                    <path
                          d="M13.73 21C13.5542 21.3031 13.3019 21.5547 12.9982 21.7295C12.6946 21.9044 12.3504 21.9965 12 21.9965C11.6496 21.9965 11.3054 21.9044 11.0018 21.7295C10.6982 21.5547 10.4458 21.3031 10.27 21"
                          stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
        </button>
        <div class="profile-menu">
            <div class="profile-info">
                 <div class="profile-name" id="profileName">${c.fullName}</div>
                    <div class="profile-role">Interviewer</div>
                 </div>
            </div>
        </div>
      </div>
    </div>

    <!-- Stats Grid -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
        </div>
        <div class="stat-info">
          <h3>Upcoming</h3>
          <p class="stat-number">${e}</p>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background-color: #dcfce7; color: #16a34a;">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
        </div>
        <div class="stat-info">
          <h3>Completed</h3>
          <p class="stat-number">${a}</p>
        </div>
      </div>
    </div>

    <!-- Content Grid -->
    <div class="content-grid">
      <!-- Upcoming Interviews -->
      <div class="card" style="background: white; border-radius: 8px; border: 1px solid #e5e7eb; overflow: hidden; width: 100%; margin-bottom: 20px;">
        <div class="card-header" style="background: #f9fafb; padding: 15px 20px; border-bottom: 1px solid #e5e7eb; display: flex; justify-content: space-between; align-items: center;">
          <h2 style="margin: 0; font-size: 18px;">Upcoming Interviews</h2>
        </div>
        <div class="schedule-list" style="padding: 20px;">
           ${r}
        </div>
      </div>

      <!-- Completed Interviews -->
      <div class="card" style="background: white; border-radius: 8px; border: 1px solid #e5e7eb; overflow: hidden; width: 100%; margin-bottom: 20px;">
        <div class="card-header" style="background: #f9fafb; padding: 15px 20px; border-bottom: 1px solid #e5e7eb; display: flex; justify-content: space-between; align-items: center;">
          <h2 style="margin: 0; font-size: 18px;">Completed Interviews</h2>
        </div>
        <div class="schedule-list" style="padding: 20px;">
           ${d}
        </div>
      </div>

      <!-- Approved Companies -->
      <div class="card" style="background: white; border-radius: 8px; border: 1px solid #e5e7eb; overflow: hidden;">
        <div class="card-header" style="background: #f9fafb; padding: 15px 20px; border-bottom: 1px solid #e5e7eb; display: flex; justify-content: space-between; align-items: center;">
          <h2 style="margin: 0; font-size: 18px;">My Approved Companies</h2>
        </div>
        <div class="company-list" style="padding: 20px;" id="companyListContainer">
           ${S(h)}
        </div>
      </div>
    </div>
    
    <!-- Candidates Modal -->
    <div id="candidatesModal" class="modal-backdrop" style="display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 100; align-items: center; justify-content: center;">
        <div class="modal-content" style="background: white; border-radius: 8px; padding: 24px; min-width: 500px; max-width: 800px; max-height: 80vh; overflow-y: auto;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                <h2 id="modalTitle" style="margin: 0;">Candidates</h2>
                <button onclick="closeCandidatesModal()" style="background: none; border: none; font-size: 24px; cursor: pointer;">&times;</button>
            </div>
            <div id="candidatesList">
                <p>Loading candidates...</p>
            </div>
        </div>
    </div>
    


  `;t.innerHTML=l,await C()}function S(t){return!t||t.length===0?'<p class="text-muted">You have not been approved for any companies yet.</p>':t.map(e=>{let n="";if(e.positions&&e.positions.length>0){const a=e.positions.filter(i=>v[i.positionId]==="OPEN");a.length>0?n=a.map(i=>`<button class="btn btn-outline btn-sm" style="margin-right: 8px; margin-top: 8px;" onclick="viewCandidates(${e.companyId}, ${i.positionId}, '${i.positionTitle.replace(/'/g,"\\'")}', '${e.companyName.replace(/'/g,"\\'")}')">
                  ${i.positionTitle} (View Candidates)
              </button>`).join(""):n='<p class="text-muted" style="font-size: 12px;">No open positions at the moment.</p>'}else n='<p class="text-muted" style="font-size: 12px;">No open positions.</p>';return`
    <div class="company-item" style="padding: 15px; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; margin-bottom: 10px;">
      <div class="company-info" style="margin-bottom: 10px;">
        <h4 style="margin: 0 0 5px 0; font-size: 16px;">${e.companyName}</h4>
        <p style="margin: 0; font-size: 14px; color: #166534;">Approved Interviewer</p>
      </div>
      <div>
        ${n}
      </div>
    </div>
  `}).join("")}function D(t){return t.filter(e=>e.candidateOutcome&&e.candidateOutcome!=="PENDING"||e.interviewStatus==="SCHEDULED"||e.interviewStatus==="IN_PROGRESS"||e.interviewStatus==="COMPLETED"?!1:e.status==="APPLIED"||e.status==="SHORTLISTED"||e.status==="PENDING")}function k(t,e,n,a,i){return`schedule-an-interview.html?${new URLSearchParams({email:t.join(", "),positionTitle:e,companyName:n,...a?{companyId:a}:{},...i?{positionId:i}:{}}).toString()}`}window.viewCandidates=async(t,e,n,a)=>{const i=document.getElementById("candidatesModal"),r=document.getElementById("modalTitle"),d=document.getElementById("candidatesList");r.textContent=`Candidates for ${n}`,d.innerHTML="<p>Loading candidates...</p>",i.style.display="flex";try{const l=await u.getCandidatesForPositionAssigned(e,c==null?void 0:c.id);if(!l||l.length===0){d.innerHTML='<p class="text-muted">No candidates have applied for this position yet.</p>';return}const s=D(l),p=s.length>0?`<div style="margin-bottom:16px;padding-bottom:16px;border-bottom:1px solid #e5e7eb;">
           <button
             class="btn btn-primary"
             style="width:100%;font-weight:600;"
             onclick="window.location.href='${k(s.map(o=>o.email),n,a,t,e)}'">
             📅 Schedule Interview for all (${s.length} candidate${s.length>1?"s":""})
           </button>
         </div>`:"",y=o=>{let g="";if(o.candidateOutcome&&o.candidateOutcome!=="PENDING"){const f=o.candidateOutcome==="ACCEPTED"?"badge-green":"badge-red",x=o.candidateOutcome==="ACCEPTED"?"✓ Accepted":"✕ Rejected";g=`<span class="badge ${f}" style="font-size:12px;font-weight:600;padding:6px 10px;">${x}</span>`}else o.interviewStatus==="COMPLETED"?g=`
          <div style="display:flex;flex-direction:column;gap:6px;align-items:flex-end;">
            <span class="badge badge-green" style="font-size:12px;">Interview Completed</span>
            <div style="display:flex;gap:6px;">
              <button class="btn btn-sm" style="background:#16a34a;color:white;" onclick="markOutcomeInModal(event, ${o.interviewId}, 'ACCEPTED', ${e}, '${n.replace(/'/g,"\\'")}', '${a.replace(/'/g,"\\'")}')">✓ Accept</button>
              <button class="btn btn-sm" style="background:#dc2626;color:white;" onclick="markOutcomeInModal(event, ${o.interviewId}, 'REJECTED', ${e}, '${n.replace(/'/g,"\\'")}', '${a.replace(/'/g,"\\'")}')">✕ Reject</button>
            </div>
          </div>`:o.interviewStatus==="SCHEDULED"||o.interviewStatus==="IN_PROGRESS"?g=`<span class="badge badge-blue" style="font-size:12px;font-weight:500;padding:6px 10px;">${o.interviewStatus==="IN_PROGRESS"?"🔴 In Progress":"📅 Scheduled"}</span>`:o.status==="APPLIED"||o.status==="SHORTLISTED"||o.status==="PENDING"?g=`<button class="btn btn-primary btn-sm" onclick="openSchedulePage('${o.email}', '${o.fullName.replace(/'/g,"\\'")}', '${n.replace(/'/g,"\\'")}', '${a.replace(/'/g,"\\'")}'${t?`, ${t}`:""}, ${e})">Schedule Interview</button>`:g=`<span class="badge ${o.status==="REJECTED"?"badge-red":o.status==="OFFERED"||o.status==="ACCEPTED"?"badge-green":"badge-blue"}" style="font-size:12px;font-weight:500;">${o.status.replace("_"," ")}</span>`;return`
        <div data-candidate-id="${o.id}" style="border:1px solid #e5e7eb;border-radius:6px;padding:12px;margin-bottom:10px;display:flex;justify-content:space-between;align-items:center;">
          <div>
            <h4 style="margin:0 0 4px 0">${o.fullName}</h4>
            <p style="margin:0;font-size:13px;color:#6b7280;">${o.email} | Status: ${o.status}</p>
          </div>
          <div class="candidate-action">${g}</div>
        </div>
      `};d.innerHTML=p+l.map(y).join("")}catch(l){d.innerHTML=`<p style="color:red;">Failed to load candidates: ${l.message}</p>`}};window.closeCandidatesModal=()=>{document.getElementById("candidatesModal").style.display="none"};window.openSchedulePage=(t,e,n,a,i,r)=>{const d=new URLSearchParams({email:t,name:e,positionTitle:n,companyName:a,companyId:i,positionId:r});window.location.href=`schedule-an-interview.html?${d.toString()}`};window.closeScheduleModal=()=>{document.getElementById("scheduleModal").style.display="none"};window.handleScheduleSubmit=async t=>{t.preventDefault();const e=t.target.querySelector('button[type="submit"]');e.disabled=!0,e.textContent="Scheduling...";const a=`meet-${Math.random().toString(36).substring(2,10)}`,i={candidateEmail:document.getElementById("schedCandidateEmail").value,candidateName:document.getElementById("schedCandidateName").value,interviewerEmail:c.email,interviewerId:c.id,scheduledTime:document.getElementById("schedDate").value,title:document.getElementById("schedTitle").value,meetingLink:a,description:"Technical Interview generated via Dashboard",durationMinutes:parseInt(document.getElementById("schedDuration").value),interviewType:"TECHNICAL"};try{await u.scheduleInterview(i),alert("Interview scheduled successfully!"),window.closeScheduleModal(),b()}catch(r){alert("Failed to schedule: "+r.message),e.disabled=!1,e.textContent="Confirm Schedule"}};async function w(t,e="upcoming"){if(!t||t.length===0)return e==="upcoming"?'<p class="text-muted">No upcoming interviews.</p>':e==="completed"?'<p class="text-muted">No completed interviews.</p>':'<p class="text-muted">No interviews found.</p>';const n=e==="completed"?t.filter(i=>i.status==="COMPLETED"||i.status==="CANCELLED"):t.filter(i=>i.status==="SCHEDULED"||i.status==="IN_PROGRESS");return!n||n.length===0?e==="upcoming"?'<p class="text-muted">No upcoming interviews.</p>':e==="completed"?'<p class="text-muted">No completed interviews.</p>':'<p class="text-muted">No interviews found.</p>':[...n].sort((i,r)=>{const d=new Date((i.scheduledDate||"")+"T"+(i.scheduledTime||"00:00:00")),l=new Date((r.scheduledDate||"")+"T"+(r.scheduledTime||"00:00:00"));return e==="completed"?l-d:d-l}).slice(0,3).map(L).join("")}function L(t){const e=t.scheduledTime?t.scheduledTime.substring(0,5):"TBD",n=t.candidate?t.candidate.fullName:"Candidate",a=t.status==="COMPLETED"?"badge-green":"badge-blue";return`
      <div class="schedule-item">
        <div class="schedule-time">
          <div class="time-badge">${e}</div>
        </div>
        <div class="schedule-info">
          <h4>${t.title||"Technical Interview"}</h4>
          <p>${t.companyName||"Company"} • Candidate: ${n}</p>
          <div class="schedule-meta">
            <span class="badge ${a}">${t.status}</span>
            <span>${t.interviewRound||"Round"}</span>
          </div>
        </div>
        <div class="schedule-actions">
            ${T(t)}
        </div>
      </div>
    `}function T(t){if(t.status==="SCHEDULED"||t.status==="IN_PROGRESS")return`<button class="btn btn-primary btn-sm" onclick="joinInterview(${t.id}, '${t.meetingLink}')">Start</button>`;if(t.status==="COMPLETED"){let e="";if(!t.candidateOutcome||t.candidateOutcome==="PENDING")e+=`<button class="btn btn-sm" style="background:#16a34a;color:white;margin-right:4px;" onclick="window.markOutcome(${t.id}, 'ACCEPTED')">✓ Accept</button>`,e+=`<button class="btn btn-sm" style="background:#dc2626;color:white;margin-right:4px;" onclick="window.markOutcome(${t.id}, 'REJECTED')">✕ Reject</button>`;else{let n=t.candidateOutcome==="ACCEPTED"?"badge-green":"badge-red";e+=`<span class="badge ${n}" style="margin-right:4px;">${t.candidateOutcome}</span>`}if(t.recordingUrl){const a=`${window.location.port==="5173"?"http://localhost:3000":window.location.origin}/recordings/${t.recordingUrl}`;e+=`<button class="btn btn-primary btn-sm force-download-btn" style="margin-left: 5px;" data-url="${a}" data-filename="${t.recordingUrl}">Download Recording</button>`}return e}return""}window.markOutcome=async(t,e)=>{if(confirm(`Mark this candidate as ${e}?`))try{await u.updateInterviewOutcome(t,e),b()}catch(n){alert("Failed to update candidate outcome: "+n.message)}};window.markOutcomeInModal=async(t,e,n,a,i,r)=>{if(!confirm(`Mark this candidate as ${n}?`))return;const d=t.target;d.disabled=!0,d.textContent="Saving...";try{await u.updateInterviewOutcome(e,n);const l=d.closest(".candidate-action");if(l){const s=n==="ACCEPTED"?"badge-green":"badge-red",p=n==="ACCEPTED"?"✓ Accepted":"✕ Rejected";l.innerHTML=`<span class="badge ${s}" style="font-size:12px;font-weight:600;padding:6px 10px;">${p}</span>`}b()}catch(l){alert("Failed to update candidate outcome: "+l.message),d.disabled=!1,d.textContent=n==="ACCEPTED"?"✓ Accept":"✕ Reject"}};async function N(t,e){try{console.log(`Joining interview ${t} with meeting link: ${e}`);const n=c?c.email:"";window.location.href=`../../interview-screen/video-interview.html?room=${encodeURIComponent(e)}&role=interviewer&email=${encodeURIComponent(n)}`}catch(n){alert(`Failed to join interview: ${n.message}`)}}async function P(){confirm("Are you sure you want to logout?")&&(u.clearToken(),localStorage.removeItem("isLoggedIn"),localStorage.removeItem("userId"),localStorage.removeItem("username"),localStorage.removeItem("userRole"),window.location.href="/login/login.html")}window.joinInterview=N;window.logout=P;window.refreshQueue=b;document.addEventListener("click",async t=>{const e=t.target.closest(".force-download-btn");if(e){t.preventDefault();const n=e.innerHTML;try{e.innerHTML="Downloading...",e.disabled=!0;const a=e.getAttribute("data-url"),i=e.getAttribute("data-filename")||"recording.mp4",r=await fetch(a);if(!r.ok)throw new Error("Network response was not ok");const d=await r.blob(),l=window.URL||window.webkitURL,s=l.createObjectURL(d),p=document.createElement("a");p.href=s,p.download=i,document.body.appendChild(p),p.click(),l.revokeObjectURL(s),document.body.removeChild(p)}catch(a){console.error("Force download failed:",a)}finally{e.innerHTML=n,e.disabled=!1}}});document.addEventListener("DOMContentLoaded",b);
