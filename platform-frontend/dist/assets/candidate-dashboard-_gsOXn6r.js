import"./modulepreload-polyfill-B5Qt9EMX.js";/* empty css               */import"./sidebar-ckr4qzLM.js";import{i as h}from"./notifications-CyUZvoHu.js";import{a as m}from"./api-BDkOtMsK.js";import{g as v}from"./media-config-DXL3pj2J.js";import{c as b,a as w,f as y}from"./dashboard-utils-BOnXSnva.js";let o=null,r=[];function p(e){try{if(!e)return null;const t=new Date(e);return isNaN(t.getTime())?null:t.toLocaleTimeString("en-US",{hour:"2-digit",minute:"2-digit"})}catch{return null}}function f(e){try{if(!e)return null;const t=new Date(e);return isNaN(t.getTime())?null:t.toLocaleDateString("en-US",{weekday:"short",month:"short",day:"numeric",year:"numeric"})}catch{return null}}async function x(){try{const e=document.getElementById("dashboard-content");e&&(e.innerHTML=b());const t=m.getUserInfo();if(t&&t.role==="CANDIDATE"){o=t;const i=document.getElementById("userName");i&&(i.textContent=o.fullName)}try{o=await m.getUserProfile()}catch(i){if(console.warn("Failed to refresh profile, using cached if available",i),!o)throw i}if(o.role!=="CANDIDATE"){window.location.href="/interviewer/interviewer-dashboard.html";return}r=await m.getUpcomingInterviews(o.email),D()}catch(e){console.error("Dashboard initialization error:",e);const t=document.getElementById("dashboard-content");t&&(t.innerHTML=w(e.message||"Failed to load dashboard"))}}function D(){const e=document.getElementById("dashboard-content");if(!e)return;const t=r?r.filter(n=>n.status==="SCHEDULED"||n.status==="IN_PROGRESS").length:0,a=r?r.filter(n=>n.status==="COMPLETED").length:0;o.averageRating&&o.averageRating>0&&o.averageRating.toFixed(1)+"";const i=`
    <!-- Header -->
    <div class="header" style="margin-bottom: 30px; display: flex; justify-content: space-between; align-items: center;">
      <div class="header-left">
        <h1>Welcome, <span id="userName">${o.fullName}</span>!</h1>
        <p class="text-muted">Track your interviews and explore opportunities</p>
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
                  <div class="profile-name" id="profileName">${o.fullName}</div>
                  <div class="profile-role">Candidate</div>
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
          <h3>Scheduled</h3>
          <p class="stat-number">${t}</p>
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
      <!-- Upcoming Interviews Card -->
      <div class="card" style="background: white; border-radius: 8px; border: 1px solid #e5e7eb; overflow: hidden; margin-bottom: 20px;">
        <div class="card-header" style="background: #f9fafb; padding: 15px 20px; border-bottom: 1px solid #e5e7eb; display: flex; justify-content: space-between; align-items: center;">
          <h2 style="margin: 0; font-size: 18px;">Upcoming Interviews</h2>
        </div>
        <div class="interview-list" style="padding: 20px;">
           ${g(r,"upcoming")}
        </div>
      </div>

      <!-- Past Interviews Card -->
      <div class="card" style="background: white; border-radius: 8px; border: 1px solid #e5e7eb; overflow: hidden;">
        <div class="card-header" style="background: #f9fafb; padding: 15px 20px; border-bottom: 1px solid #e5e7eb; display: flex; justify-content: space-between; align-items: center;">
          <h2 style="margin: 0; font-size: 18px;">Past Interviews</h2>
        </div>
        <div class="interview-list" style="padding: 20px;">
           ${g(r,"past")}
        </div>
      </div>

      <!-- Quick Actions -->
      <div class="card" style="background: white; border-radius: 8px; border: 1px solid #e5e7eb; overflow: hidden; margin-top: 20px;">
        <div class="card-header" style="background: #f9fafb; padding: 15px 20px; border-bottom: 1px solid #e5e7eb;">
          <h2 style="margin: 0; font-size: 18px;">Quick Actions</h2>
        </div>
        <div class="quick-actions" style="padding: 20px;">
          <a href="./profile.html" class="action-card">
            <div class="action-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
            </div>
            <div class="action-info">
              <h4>Update Profile</h4>
              <p>Keep your profile current</p>
            </div>
          </a>
        </div>
      </div>
    </div>
  `;e.innerHTML=i,h()}function g(e,t){if(!e||e.length===0)return'<p class="text-muted">No interviews found.</p>';let a=[];return t==="upcoming"?a=e.filter(i=>["SCHEDULED","IN_PROGRESS"].includes(i.status)).sort((i,n)=>new Date(i.scheduledDate+"T"+i.scheduledTime)-new Date(n.scheduledDate+"T"+n.scheduledTime)).slice(0,3):(a=e.filter(i=>["COMPLETED","CANCELLED"].includes(i.status)),a.sort((i,n)=>new Date(n.scheduledDate+"T"+n.scheduledTime)-new Date(i.scheduledDate+"T"+i.scheduledTime)),a=a.slice(0,3)),a.length===0?`<p class="text-muted">No ${t} interviews.</p>`:a.map(i=>T(i,t)).join("")}function T(e,t){var d;e.scheduledDate,e.scheduledTime;let a=y(e.scheduledDate,e.scheduledTime);if(e.status==="COMPLETED"){const l=p(e.actualStartTime),s=p(e.actualEndTime),c=f(e.actualStartTime)||f(e.actualEndTime);l&&s&&c&&(a=`${c} @ ${l} - ${s}`)}let i="";t==="upcoming"?i=`<button class="btn btn-primary btn-sm" onclick="joinInterview(${e.id}, '${e.meetingLink}')">Join</button>`:e.recordingUrl?i=`<button class="btn btn-primary btn-sm force-download-btn" style="margin-left:5px;" data-url="${`${v()}/recordings/${e.recordingUrl}`}" data-filename="${e.recordingUrl}">Download Recording</button>`:i='<span class="text-muted" style="font-size: 0.8rem">No Recording</span>';const n=e.status==="COMPLETED"&&e.candidateOutcome&&e.candidateOutcome!=="PENDING"?`<span class="badge ${e.candidateOutcome==="ACCEPTED"?"badge-green":"badge-red"}">${e.candidateOutcome}</span>`:"";return`
    <div class="interview-item">
      <div class="interview-info">
        <h4>${e.title||"Technical Interview"}</h4>
        <p>with ${((d=e.interviewer)==null?void 0:d.fullName)||"Interviewer"}</p>
        <div class="interview-meta">
          <span class="badge badge-blue">${e.interviewRound||"General"}</span>
          <span>${a}</span>
          <span class="badge ${e.status==="COMPLETED"?"badge-green":"badge-gray"}">${e.status}</span>
          ${n}
        </div>
      </div>
      <div>${i}</div>
    </div>
  `}async function C(e,t){try{console.log(`Joining interview ${e}`);const a=o?o.email:"";window.location.href=`../../interview-screen/video-interview.html?room=${encodeURIComponent(t)}&role=candidate&email=${encodeURIComponent(a)}`}catch(a){alert(`Failed to join interview: ${a.message}`)}}async function k(){confirm("Are you sure you want to logout?")&&(m.clearToken(),localStorage.removeItem("isLoggedIn"),localStorage.removeItem("userId"),localStorage.removeItem("username"),localStorage.removeItem("userRole"),window.location.href="/login/login.html")}window.joinInterview=C;window.logout=k;document.addEventListener("click",async e=>{const t=e.target.closest(".force-download-btn");if(t){e.preventDefault();const a=t.innerHTML;try{t.innerHTML="Downloading...",t.disabled=!0;const i=t.getAttribute("data-url"),n=t.getAttribute("data-filename")||"recording.mp4",d=await fetch(i);if(!d.ok)throw new Error("Network response was not ok");const l=await d.blob(),s=window.URL||window.webkitURL,c=s.createObjectURL(l),u=document.createElement("a");u.href=c,u.download=n,document.body.appendChild(u),u.click(),s.revokeObjectURL(c),document.body.removeChild(u)}catch(i){console.error("Force download failed:",i)}finally{t.innerHTML=a,t.disabled=!1}}});document.addEventListener("DOMContentLoaded",x);
