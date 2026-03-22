import"./modulepreload-polyfill-B5Qt9EMX.js";/* empty css               */import"./admin-sidebar-ChFlPb6K.js";import"./notifications-k8PWt7_S.js";import{a as s}from"./api-BDkOtMsK.js";import"./notifications-init-DH89eo6N.js";const p=sessionStorage.getItem("companyId");let m=[],l=null;function g(){const e=s.getUserInfo();if(e){const o=document.getElementById("adminName");o&&(o.textContent=e.fullName||"Admin")}}function b(e){const o=document.getElementById("jobsContainer"),i=document.getElementById("emptyState");if(o){if(o.innerHTML="",!e||e.length===0){i&&(i.style.display="flex");return}i&&(i.style.display="none"),e.forEach(t=>{const a={OPEN:{bg:"#dcfce7",color:"#166534"},CLOSED:{bg:"#fee2e2",color:"#991b1b"},FILLED:{bg:"var(--blue-100)",color:"var(--blue-800)"}},n=a[t.status]||a.OPEN,d=(t.requiredExpertise?t.requiredExpertise.split(",").map(r=>r.trim()):[]).map(r=>`<span class="skill-tag">${r}</span>`).join(""),y=t.createdAt?new Date(t.createdAt).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"}):"";o.insertAdjacentHTML("beforeend",`
      <div class="job-card card">
        <div class="job-card-header">
          <div>
            <h3 class="job-title">${t.positionTitle}</h3>
            <p class="text-muted" style="font-size:13px; margin-top:4px;">Posted ${y}</p>
          </div>
          <span class="badge" style="background:${n.bg}; color:${n.color};">${t.status}</span>
        </div>
        <p class="job-desc" style="color:var(--gray-600); margin:12px 0; font-size:14px; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden;">
          ${t.jobDescription||"No description provided."}
        </p>
        <div class="skill-tags" style="display:flex; flex-wrap:wrap; gap:6px; margin-bottom:12px;">${d}</div>
        <div style="display:flex; gap:8px; flex-wrap:wrap; align-items:center;">
          <span style="font-size:13px; color:var(--gray-500);">💰 ${t.salaryRange||"Salary not specified"}</span>
          <span style="font-size:13px; color:var(--gray-500);">📍 ${t.location||"Location not specified"}</span>
        </div>
        <div class="card-actions" style="margin-top:16px; display:flex; gap:8px; flex-wrap:wrap;">
          <button class="btn-primary btn-sm" onclick="openJobDetails(${t.id})">View Details</button>
          <button class="btn-outline btn-sm" onclick="togglePositionStatus(${t.id}, '${t.status}')">
            ${t.status==="OPEN"?"Close Position":"Reopen Position"}
          </button>
          <button class="btn-outline btn-sm" style="color:#dc2626; border-color:#dc2626;" onclick="confirmDeletePosition(${t.id})">Delete</button>
        </div>
      </div>
    `)})}}async function c(){if(!p){console.warn("No companyId in session. Cannot load positions.");const e=document.getElementById("emptyState");e&&(e.style.display="flex");return}try{m=await s.getCompanyPositions(p),b(m)}catch(e){console.error("Error loading positions:",e)}}window.openPostJobModal=function(){document.getElementById("postJobModal").style.display="flex",["positionTitle","jobDescription","salaryMin","salaryMax","requiredSkills","jobLocation"].forEach(e=>{const o=document.getElementById(e);o&&(o.value="")})};window.closePostJobModal=function(){document.getElementById("postJobModal").style.display="none"};window.postJob=async function(){const e=document.getElementById("positionTitle").value.trim(),o=document.getElementById("jobDescription").value.trim(),i=document.getElementById("salaryMin").value,t=document.getElementById("salaryMax").value,a=document.getElementById("requiredSkills").value.trim(),n=document.getElementById("jobLocation").value.trim();if(!e){alert("Please enter a position title.");return}const u=i&&t?`${i} - ${t}`:i?`From ${i}`:t?`Up to ${t}`:null;try{await s.createPosition({companyId:Number(p),positionTitle:e,jobDescription:o,salaryRange:u,requiredExpertise:a,location:n||null}),closePostJobModal(),await c()}catch(d){alert("Failed to create position: "+d.message)}};window.togglePositionStatus=async function(e,o){const i=o==="OPEN"?"CLOSED":"OPEN";try{await s.updatePositionStatus(e,i),await c()}catch(t){alert("Failed to update position status: "+t.message)}};window.confirmDeletePosition=function(e){confirm("Are you sure you want to delete this position? This action cannot be undone.")&&s.deleteCompanyPosition(e).then(()=>c()).catch(o=>alert("Delete failed: "+o.message))};window.openJobDetails=async function(e){l=e;const o=m.find(t=>t.id===e);if(!o)return;document.getElementById("jobTitle").textContent=o.positionTitle,document.getElementById("detailTitle").textContent=o.positionTitle,document.getElementById("detailStatus").textContent=o.status,document.getElementById("detailSalary").textContent=o.salaryRange||"Not specified",document.getElementById("detailSkills").textContent=o.requiredExpertise||"None specified",document.getElementById("detailDescription").textContent=o.jobDescription||"No description.";const i=document.getElementById("detailLocation");i&&(i.textContent=o.location||"Not specified"),document.getElementById("jobDetailsModal").style.display="flex",switchJobTab("overview")};window.closeJobDetailsModal=function(){document.getElementById("jobDetailsModal").style.display="none"};window.switchJobTab=async function(e){document.querySelectorAll(".tab-btn").forEach(t=>t.classList.remove("active")),document.querySelectorAll(".tab-content").forEach(t=>t.classList.remove("active"));const o=[...document.querySelectorAll(".tab-btn")].find(t=>t.textContent.toLowerCase().includes(e));o&&o.classList.add("active");const i=document.getElementById(e+"Tab")||document.getElementById(e==="overview"?"overviewTab":e==="candidates"?"candidatesTab":"interviewersTab");if(i&&i.classList.add("active"),e==="candidates"&&l){const t=document.getElementById("candidatesList");if(t){t.innerHTML='<p class="text-muted">Loading...</p>';try{const a=await s.getPositionCandidates(l);a.length===0?t.innerHTML='<p class="text-muted">No candidates have applied yet.</p>':t.innerHTML=a.map(n=>`
            <div class="applicant-item" style="padding:12px; border-bottom:1px solid var(--gray-200); display:flex; justify-content:space-between; align-items:center;">
              <div>
                <strong>${n.fullName}</strong>
                <p style="font-size:13px; color:var(--gray-500);">${n.email}</p>
                <p style="font-size:12px; color:var(--gray-400);">Applied: ${n.applicationDate||"N/A"} &bull; Skills: ${(n.skills||[]).join(", ")||"None"}</p>
              </div>
              <span class="badge" style="background:var(--blue-100); color:var(--blue-800);">${n.status}</span>
            </div>
          `).join("")}catch{t.innerHTML='<p class="text-muted">Failed to load candidates.</p>'}}}if(e==="interviewers"&&l){const t=document.getElementById("interviewersList");if(t){t.innerHTML='<p class="text-muted">Loading...</p>';try{const a=await s.getPositionInterviewers(l);a.length===0?t.innerHTML='<p class="text-muted">No interviewers associated yet.</p>':t.innerHTML=a.map(n=>`
            <div class="applicant-item" style="padding:12px; border-bottom:1px solid var(--gray-200); display:flex; justify-content:space-between; align-items:center;">
              <div>
                <strong>${n.fullName}</strong>
                <p style="font-size:13px; color:var(--gray-500);">${n.email}</p>
                <p style="font-size:12px; color:var(--gray-400);">Expertise: ${(n.expertises||[]).join(", ")||"None"} &bull; Rating: ${n.averageRating||0}</p>
              </div>
              <span class="badge" style="background:${n.applicationStatus==="APPROVED"?"#dcfce7":n.applicationStatus==="REJECTED"?"#fee2e2":"var(--blue-100)"}; color:${n.applicationStatus==="APPROVED"?"#166534":n.applicationStatus==="REJECTED"?"#991b1b":"var(--blue-800)"};">${n.applicationStatus||"N/A"}</span>
            </div>
          `).join("")}catch{t.innerHTML='<p class="text-muted">Failed to load interviewers.</p>'}}}};window.addEventListener("click",e=>{e.target.id==="postJobModal"&&closePostJobModal(),e.target.id==="jobDetailsModal"&&closeJobDetailsModal()});document.addEventListener("DOMContentLoaded",()=>{g(),c()});
