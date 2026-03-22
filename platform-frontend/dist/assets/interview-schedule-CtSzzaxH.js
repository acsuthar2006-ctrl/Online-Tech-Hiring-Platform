import"./modulepreload-polyfill-B5Qt9EMX.js";/* empty css               */import{i as f}from"./notifications-k8PWt7_S.js";import"./dashboard-Ddi9wLvF.js";import"./interviewer-sidebar-BBk2cHuw.js";import{a as m}from"./api-BDkOtMsK.js";import{a as y,b,d as w,e as v}from"./dashboard-utils-BOnXSnva.js";document.addEventListener("DOMContentLoaded",()=>{g()});window.markOutcome=async(e,t)=>{if(confirm(`Mark this candidate as ${t}?`))try{await m.updateInterviewOutcome(e,t),await g(),await f()}catch(o){alert("Failed to update candidate outcome: "+(o.message||o))}};async function g(){const e=document.getElementById("scheduleContainer"),t=document.getElementById("profileName");try{const o=await m.getUserProfile();if(o){t.textContent=o.fullName;const n=await m.getUpcomingInterviewsForInterviewer(o.email);k(n),await f()}else throw new Error("Profile not found")}catch(o){console.error("Failed to load schedule:",o),e.innerHTML=y("Failed to load your schedule. Please try again later.")}}function k(e){const t=document.getElementById("scheduleContainer"),o=t.querySelector(".loading-state");if(o&&o.remove(),!e||e.length===0){t.innerHTML=b("You have no interviews scheduled at the moment.");return}const n=new Date;n.setHours(0,0,0,0);const a=[],s=[],l=[];e.forEach(i=>{const r=`${i.scheduledDate}T${i.scheduledTime}`,c=new Date(r),d=new Date(c);if(d.setHours(0,0,0,0),i.status==="COMPLETED")l.push(i);else if(i.status==="SCHEDULED"||i.status==="IN_PROGRESS"){if(!!Number.isNaN(d.getTime()))return;d.getTime()===n.getTime()?a.push(i):d>n&&s.push(i)}}),u("today",a),u("week",s),u("completed",l),C()}function u(e,t){const o=document.getElementById(`${e}Section`),n=document.getElementById(`${e}Timeline`),a=document.getElementById(`${e}Count`);t.length>0?(o.style.display="block",a.textContent=t.length,n.innerHTML=t.map(s=>E(s,e)).join("")):o.style.display="none"}function E(e,t){const o=`${e.scheduledDate}T${e.scheduledTime}`,n=new Date(o),a=e.status==="COMPLETED",s=a?"status-completed":"status-upcoming",l=w(n,{month:"short"}),i=w(n,{day:"2-digit"}),r=v(n);let c="";a&&e.candidateOutcome&&e.candidateOutcome!=="PENDING"&&(c=`<span class="status-badge" style="margin-left:8px; border:1px solid currentColor; ${e.candidateOutcome==="ACCEPTED"?"background:#dcfce7;color:#166534":"background:#fee2e2;color:#991b1b"}">${e.candidateOutcome}</span>`);let d="";return a&&(!e.candidateOutcome||e.candidateOutcome==="PENDING")&&(d=`
        <button class="btn btn-sm" style="background:#16a34a;color:white;margin-left:6px;" onclick="window.markOutcome(${e.id}, 'ACCEPTED')">✓ Accept</button>
        <button class="btn btn-sm" style="background:#dc2626;color:white;margin-left:6px;" onclick="window.markOutcome(${e.id}, 'REJECTED')">✕ Reject</button>
      `),`
        <div class="timeline-item">
            <div class="timeline-date">
                <div class="date-badge">${t==="today"?"Today":l}</div>
                <div class="date-number">${i}</div>
                <div class="date-time">${r}</div>
            </div>
            <div class="interview-card">
                <div class="interview-header">
                    <h3>${e.title||"Technical Interview"}</h3>
                    <div>
                      <span class="status-badge ${s}">${e.status}</span>
                      ${c}
                    </div>
                </div>
                <div class="interview-details">
                    <p class="company-name">${e.description||"Job Interview"}</p>
                    <div class="interview-info-row">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
                            <path d="M12 6V12L16 14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                        </svg>
                        <span>${e.candidate?e.candidate.fullName:"Candidate"}</span>
                    </div>
                    <div class="interview-info-row">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M23 7L16 12L23 17V7Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            <rect x="1" y="5" width="15" height="14" rx="2" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                        <span>${e.interviewType||"Video Interview"}</span>
                    </div>
                </div>
                <div class="interview-actions">
                    ${a?"":`<button class="btn-primary btn-sm" onclick="joinInterview('${e.meetingLink}')">Join Interview</button>`}
                    ${a?d:""}
                    ${a&&e.recordingUrl?`<button class="btn btn-primary btn-sm force-download-btn" style="margin-left: 6px;" data-url="${`${window.location.port==="5173"?"http://localhost:3000":window.location.origin}/recordings/${e.recordingUrl}`}" data-filename="${e.recordingUrl}">Download Recording</button>`:""}
                </div>
            </div>
        </div>
    `}function C(){const e=document.querySelectorAll(".filter-btn");e.forEach(t=>{t.onclick=()=>{e.forEach(n=>n.classList.remove("active")),t.classList.add("active");const o=t.dataset.filter;document.getElementById("todaySection").style.display=(o==="all"||o==="upcoming")&&document.getElementById("todayCount").textContent!=="0"?"block":"none",document.getElementById("weekSection").style.display=(o==="all"||o==="upcoming")&&document.getElementById("weekCount").textContent!=="0"?"block":"none",document.getElementById("completedSection").style.display=(o==="all"||o==="completed")&&document.getElementById("completedCount").textContent!=="0"?"block":"none"}})}window.joinInterview=async e=>{if(e)try{const t=await m.getUserProfile(),o=t?t.email:"";window.location.href=`../../interview-screen/video-interview.html?room=${encodeURIComponent(e)}&role=interviewer&email=${encodeURIComponent(o)}`}catch(t){console.warn("Could not get profile for email param",t),window.location.href=`../../interview-screen/video-interview.html?room=${encodeURIComponent(e)}&role=interviewer`}else alert("Meeting link not available.")};document.addEventListener("click",async e=>{const t=e.target.closest(".force-download-btn");if(t){e.preventDefault();const o=t.innerHTML;try{t.innerHTML="Downloading...",t.disabled=!0;const n=t.getAttribute("data-url"),a=t.getAttribute("data-filename")||"recording.mp4",s=await fetch(n);if(!s.ok)throw new Error("Network response was not ok");const l=await s.blob(),i=window.URL||window.webkitURL,r=i.createObjectURL(l),c=document.createElement("a");c.href=r,c.download=a,document.body.appendChild(c),c.click(),i.revokeObjectURL(r),document.body.removeChild(c)}catch(n){console.error("Force download failed:",n)}finally{t.innerHTML=o,t.disabled=!1}}});
