import"./modulepreload-polyfill-B5Qt9EMX.js";/* empty css               */import{i as b}from"./notifications-k8PWt7_S.js";import"./dashboard-Ddi9wLvF.js";import{a as u}from"./api-BDkOtMsK.js";import"./sidebar-ckr4qzLM.js";let g=[];function y(e){try{if(!e)return null;const[t,n]=e.split(":");if(t==null||n==null)return null;const o=new Date;return o.setHours(parseInt(t,10),parseInt(n,10),0,0),o.toLocaleTimeString("en-US",{hour:"2-digit",minute:"2-digit"})}catch{return null}}function p(e){try{if(!e)return null;const t=new Date(e);return isNaN(t.getTime())?null:t.toLocaleTimeString("en-US",{hour:"2-digit",minute:"2-digit"})}catch{return null}}function v(e,t){try{const n=new Date(e),o=new Date(t);if(isNaN(n.getTime())||isNaN(o.getTime()))return null;const c=Math.max(0,Math.round((o.getTime()-n.getTime())/6e4)),l=Math.floor(c/60),a=c%60;return l<=0?`${a}m`:a<=0?`${l}h`:`${l}h ${a}m`}catch{return null}}document.addEventListener("DOMContentLoaded",async()=>{const e=u.getUserInfo();if(!e){window.location.href="../../login/login.html";return}document.querySelectorAll("#userName, #profileName").forEach(n=>{n.textContent=e.fullName}),await E(),L(),await b()});async function E(){try{const e=u.getUserInfo();g=await u.getUpcomingInterviews(e.email),w("all")}catch(e){console.error("Failed to load schedule",e)}}function L(){const e=document.querySelectorAll(".filter-btn");e.forEach(t=>{t.addEventListener("click",()=>{e.forEach(o=>o.classList.remove("active")),t.classList.add("active");const n=t.getAttribute("data-filter");w(n)})})}function w(e){const t=document.getElementById("upcomingInterviewList"),n=document.getElementById("completedInterviewList"),o=document.getElementById("upcomingCount"),c=document.getElementById("completedCount"),l=g.filter(i=>["COMPLETED","CANCELLED"].includes(i.status)),a=g.filter(i=>["SCHEDULED","IN_PROGRESS"].includes(i.status));t&&(t.innerHTML=h(a)),n&&(n.innerHTML=h(l)),o&&(o.innerText=a.length),c&&(c.innerText=l.length);const s=document.getElementById("upcomingSection"),r=document.getElementById("completedSection");e==="all"?(s&&(s.style.display="block"),r&&(r.style.display="block")):e==="upcoming"?(s&&(s.style.display="block"),r&&(r.style.display="none")):e==="completed"&&(s&&(s.style.display="none"),r&&(r.style.display="block"))}function h(e){return!e||e.length===0?`
        <div class="empty-state">
            <svg class="empty-state-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <h3>No interviews scheduled</h3>
            <p>You don't have any interviews in this category yet. Check your dashboard for new invitations.</p>
        </div>
        `:e.map(t=>{const n=new Date(t.scheduledDate+"T"+t.scheduledTime),o=n.toLocaleString("default",{month:"short"}),c=n.getDate().toString().padStart(2,"0");let a=y(t.scheduledTime)||n.toLocaleTimeString("en-US",{hour:"2-digit",minute:"2-digit"});if(t.status==="COMPLETED"){const d=p(t.actualStartTime),m=p(t.actualEndTime),f=t.actualStartTime&&t.actualEndTime?v(t.actualStartTime,t.actualEndTime):null;d&&m&&(a=`${d} - ${m}${f?` (${f})`:""}`)}const s=["SCHEDULED","IN_PROGRESS"].includes(t.status),r=t.status==="COMPLETED"?"status-completed":"status-upcoming";let i="";return t.status==="COMPLETED"&&t.candidateOutcome&&t.candidateOutcome!=="PENDING"&&(t.candidateOutcome,i=`<span class="status-badge" style="margin-left: 8px; border:1px solid currentColor; ${t.candidateOutcome==="ACCEPTED"?"background:#dcfce7;color:#166534":"background:#fee2e2;color:#991b1b"}">${t.candidateOutcome}</span>`),`
          <div class="timeline-item">
            <div class="timeline-date">
              <div class="date-badge">${o}</div>
              <div class="date-number">${c}</div>
            </div>
            <div class="interview-card">
              <div class="interview-header">
                <h3>${t.title||"Technical Interview"}</h3>
                <div>
                  <span class="status-badge ${r}">${t.status}</span>
                  ${i}
                </div>
              </div>
              <div class="interview-details">
                <p class="company-name">${t.description||"Tech Company"}</p>
                <div class="interview-info-row">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" />
                    <path d="M12 6V12L16 14" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
                  </svg>
                  <span>${a}</span>
                </div>
                <div class="interview-info-row">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M23 7L16 12L23 17V7Z" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                      stroke-linejoin="round" />
                    <rect x="1" y="5" width="15" height="14" rx="2" stroke="currentColor" stroke-width="2"
                      stroke-linecap="round" stroke-linejoin="round" />
                  </svg>
                  <span>${t.interviewType||"Video Interview"}</span>
                </div>
              </div>
              <div class="interview-actions">
                ${s?`<button class="btn-primary btn-sm" onclick="joinInterview(${t.id}, '${t.meetingLink}')">Join Interview</button>`:""}
                ${t.status==="COMPLETED"&&t.recordingUrl?`<button class="btn btn-primary btn-sm force-download-btn" style="margin-left: 5px;" data-url="${`${window.location.port==="5173"?"http://localhost:3000":window.location.origin}/recordings/${t.recordingUrl}`}" data-filename="${t.recordingUrl}">Download Recording</button>`:""}
              </div>
            </div>
          </div>
        `}).join("")}async function T(e,t){try{console.log(`Joining interview ${e}`);const n=u.getUserInfo(),o=n?n.email:"";window.location.href=`../../interview-screen/video-interview.html?room=${encodeURIComponent(t)}&role=candidate&email=${encodeURIComponent(o)}`}catch(n){alert(`Failed to join interview: ${n.message}`)}}window.joinInterview=T;document.addEventListener("click",async e=>{if(e.target.classList.contains("force-download-btn")){e.preventDefault();const t=e.target,n=t.innerText;try{t.innerText="Downloading...";const o=t.getAttribute("data-url"),c=t.getAttribute("data-filename")||"recording.mp4",l=await fetch(o);if(!l.ok)throw new Error("Network response was not ok");const a=await l.blob(),s=window.URL||window.webkitURL,r=s.createObjectURL(a),i=document.createElement("a");i.href=r,i.download=c,document.body.appendChild(i),i.click(),s.revokeObjectURL(r),document.body.removeChild(i)}catch(o){console.error("Force download failed:",o),alert("Download failed. Please try again later.")}finally{t.innerText=n}}});
