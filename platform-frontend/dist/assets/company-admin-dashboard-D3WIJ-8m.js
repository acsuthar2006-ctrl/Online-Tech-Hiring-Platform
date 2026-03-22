import"./modulepreload-polyfill-B5Qt9EMX.js";/* empty css               *//* empty css                      */import"./auth-DKe50Cpr.js";import{a as s}from"./api-BDkOtMsK.js";import"./notifications-init-AG13z0We.js";import"./notifications-DCH5sCN5.js";const l=sessionStorage.getItem("companyId");async function d(){const o=s.getUserInfo();if(o){const e=document.getElementById("adminUsername"),t=document.getElementById("adminName");e&&(e.textContent=o.fullName||"Admin"),t&&(t.textContent=o.fullName||"Admin")}if(l){try{const e=await s.getCompanyDashboard(l),t=document.querySelectorAll(".stat-value");t.length>=4&&(t[0].textContent=e.totalInterviews,t[1].textContent=e.activeCandidates,t[2].textContent=e.hiredInterviewers,t[3].textContent=e.openPositions);const a=document.querySelectorAll(".stat-label");a.length>=4&&(a[3].textContent="Open Positions"),document.querySelectorAll(".stat-change").forEach(n=>n.textContent="")}catch(e){console.error("Error loading dashboard stats:",e)}try{const e=await s.getCompanyInterviews(l),t=document.querySelector(".activities-list");if(!t)return;if(t.innerHTML="",e.length===0){t.innerHTML='<p class="text-muted" style="padding:16px;">No interview activities yet.</p>';return}e.slice(0,5).forEach(n=>{const r={SCHEDULED:{bg:"var(--blue-100)",color:"var(--blue-800)",label:"Upcoming"},IN_PROGRESS:{bg:"#fef3c7",color:"#92400e",label:"In Progress"},COMPLETED:{bg:"#dcfce7",color:"#166534",label:"Completed"},CANCELLED:{bg:"#fee2e2",color:"#991b1b",label:"Cancelled"}}[n.status]||{bg:"var(--blue-100)",color:"var(--blue-800)",label:n.status},c=n.scheduledDate?new Date(n.scheduledDate).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"}):"TBD",i=n.scheduledTime?n.scheduledTime.substring(0,5):"";t.insertAdjacentHTML("beforeend",`
        <div class="activity-item">
          <div class="activity-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm4.59-12.42L10 14.17l-2.59-2.58L6 13l4 4 8-8z" fill="currentColor"/>
            </svg>
          </div>
          <div class="activity-details">
            <h4>${n.candidateName||"Unknown"} - ${n.title||n.interviewRound||""}</h4>
            <p>${c}${i?" at "+i:""} &bull; Interviewer: ${n.interviewerName||"N/A"}</p>
          </div>
          <span class="badge" style="background: ${r.bg}; color: ${r.color};">${r.label}</span>
        </div>
      `)})}catch(e){console.error("Error loading recent interviews:",e)}}}document.addEventListener("DOMContentLoaded",d);
