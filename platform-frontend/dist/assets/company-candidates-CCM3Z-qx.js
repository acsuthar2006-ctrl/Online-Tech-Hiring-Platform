import"./modulepreload-polyfill-B5Qt9EMX.js";/* empty css               */import"./admin-sidebar-ChFlPb6K.js";/* empty css                           */import"./notifications-CyUZvoHu.js";import{a as p}from"./api-BDkOtMsK.js";import"./notifications-init-qGyMXC9B.js";const u=sessionStorage.getItem("companyId");let g=[],C=new Set,L="all",f="",I="all";function D(){const t=p.getUserInfo();if(t){const i=document.getElementById("adminName");i&&(i.textContent=t.fullName||"Admin")}}function x(t){const n={APPLIED:{bg:"#dbeafe",color:"#1e40af",label:"Applied"},SHORTLISTED:{bg:"#fef3c7",color:"#92400e",label:"Shortlisted"},INTERVIEW_SCHEDULED:{bg:"#e0f2fe",color:"#0369a1",label:"Interview Scheduled"},REJECTED:{bg:"#fee2e2",color:"#991b1b",label:"Rejected"},OFFERED:{bg:"#dcfce7",color:"#166534",label:"Offered"},MATCHED:{bg:"#ede9fe",color:"#5b21b6",label:"Skill Matched"},NOT_APPLIED:{bg:"#f3f4f6",color:"#6b7280",label:"Not Applied"}}[t]||{bg:"#f3f4f6",color:"#6b7280",label:t};return`<span class="badge" style="background:${n.bg}; color:${n.color};">${n.label}</span>`}function m(t){const i=document.getElementById("candidatesTableBody");if(document.querySelector(".candidates-table thead"),!i){const a=document.querySelector(".candidates-table tbody");a&&(a.id="candidatesTableBody"),m(t);return}const n=new Set(t.map(a=>a.id)),e=document.querySelector(".header-left .text-muted");if(e&&(e.textContent=`${n.size} total candidates`),t.length===0){i.innerHTML='<tr><td colspan="7" style="text-align:center; padding:32px; color:var(--gray-500);">No candidates found.</td></tr>';return}const o={};t.forEach(a=>{o[a.id]||(o[a.id]={info:a,apps:[]}),a.status!=="NOT_APPLIED"&&a.positionId&&(o[a.id].apps.find(d=>d.applicationId===a.applicationId)||o[a.id].apps.push(a))}),i.innerHTML=Object.values(o).map(a=>{const d=a.info,s=a.apps;if(s.length===0)return`
        <tr class="group-end">
          <td style="vertical-align: top; padding: 12px;"><strong>${d.fullName}</strong></td>
          <td style="vertical-align: top; padding: 12px;">${d.email}</td>
          <td style="color:var(--gray-400); padding: 12px;">Not Assigned</td>
          <td style="padding: 12px;">N/A</td>
          <td style="padding: 12px;">${x("NOT_APPLIED")}</td>
          <td style="padding: 12px;">N/A</td>
          <td style="padding: 12px;">
            <div class="table-actions">
               <button class="btn-text" onclick="viewCandidateDetails(${d.id}, ${JSON.stringify(d.fullName||"Candidate").replace(/\"/g,"&quot;")})">View Profile</button>
            </div>
          </td>
        </tr>
      `;const c=s.length;let y="";return s.forEach((l,E)=>{let r=l.applicationDate||"N/A";r!=="N/A"&&r.includes("T")&&(r=r.split("T")[0]);let b="";if(l.appliedDirectly&&l.status==="SHORTLISTED"){const S=f||"the company",B=`Selected for ${l.positionTitle||"the position"} at ${S} - Offer Letter`;b=`<a class="btn-text" href="${`mailto:${encodeURIComponent(l.email)}?subject=${encodeURIComponent(B)}`}">Send Offer</a>`}let v=b;E===0&&(v=`
           <button class="btn-text" onclick="viewCandidateDetails(${d.id}, ${JSON.stringify(d.fullName||"Candidate").replace(/\"/g,"&quot;")})">View Profile</button>
           ${b}
         `);const h=E===s.length-1?' class="group-end"':"";E===0?y+=`
          <tr${h}>
            <td rowspan="${c}" style="vertical-align: top; padding-top: 16px;"><strong>${d.fullName}</strong></td>
            <td rowspan="${c}" style="vertical-align: top; padding-top: 16px;">${d.email}</td>
            <td style="vertical-align: top; padding-top: 16px;"><strong>${l.positionTitle||"Not Assigned"}</strong></td>
            <td style="vertical-align: top; padding-top: 16px;">${r}</td>
            <td style="vertical-align: top; padding-top: 16px;">${x(l.status)}</td>
            <td style="vertical-align: top; padding-top: 16px;">${l.assignedInterviewerName||"N/A"}</td>
            <td style="vertical-align: top; padding-top: 16px;">
              <div class="table-actions" style="display:flex; gap:8px;">${v}</div>
            </td>
          </tr>
        `:y+=`
          <tr${h}>
            <td style="vertical-align: top; padding-top: 16px;"><strong>${l.positionTitle||"Not Assigned"}</strong></td>
            <td style="vertical-align: top; padding-top: 16px;">${r}</td>
            <td style="vertical-align: top; padding-top: 16px;">${x(l.status)}</td>
            <td style="vertical-align: top; padding-top: 16px;">${l.assignedInterviewerName||"N/A"}</td>
            <td style="vertical-align: top; padding-top: 16px;">
              <div class="table-actions" style="display:flex; gap:8px;">${v}</div>
            </td>
          </tr>
        `}),y}).join("")}function w(){const t=document.getElementById("candidateBio"),i=document.getElementById("candidateSkills"),n=document.getElementById("candidateExperience"),e=document.getElementById("candidateEducation");t&&(t.textContent="Loading..."),i&&(i.textContent="Loading..."),n&&(n.textContent="Loading..."),e&&(e.textContent="Loading...")}function A(){const t=document.getElementById("candidateModal");t&&(t.classList.add("show"),t.setAttribute("aria-hidden","false"))}function N(){const t=document.getElementById("candidateModal");t&&(t.classList.remove("show"),t.setAttribute("aria-hidden","true"))}function $(t){if(!t)return"Present";const i=new Date(t);return Number.isNaN(i.getTime())?t:i.toLocaleDateString("en-US",{month:"short",year:"numeric"})}function P(t){const i=document.getElementById("candidateSkills");if(i){if(!t||t.length===0){i.textContent="No skills added.";return}i.innerHTML=t.map(n=>`<span class="badge" style="margin-right:6px;">${n}</span>`).join("")}}function M(t){const i=document.getElementById("candidateExperience");if(i){if(!t||t.length===0){i.textContent="No work experience added.";return}i.innerHTML=`<div class="modal-list">${t.map(n=>{const e=n.durationMonths?`${n.durationMonths} months`:null,a=[`${$(n.startDate)} - ${$(n.endDate)}`,e].filter(Boolean).join(" | "),d=n.description?`<div>${n.description}</div>`:"";return`
        <div class="modal-item">
          <div class="item-title">${n.jobTitle} at ${n.companyName}</div>
          <div class="item-meta">${a}</div>
          ${d}
        </div>
      `}).join("")}</div>`}}function F(t){const i=document.getElementById("candidateEducation");if(i){if(!t||t.length===0){i.textContent="No education added.";return}i.innerHTML=`<div class="modal-list">${t.map(n=>{const e=n.fieldOfStudy?`, ${n.fieldOfStudy}`:"",o=n.graduationDate?` | Graduated ${$(n.graduationDate)}`:"";return`
        <div class="modal-item">
          <div class="item-title">${n.degree}${e}</div>
          <div class="item-meta">${n.schoolName}${o}</div>
        </div>
      `}).join("")}</div>`}}window.viewCandidateDetails=async function(t,i){const n=document.getElementById("candidateModalTitle");n&&(n.textContent=i?`${i} - Profile`:"Candidate Profile"),w(),A();try{const e=await p.getCompanyCandidateProfile(t),o=document.getElementById("candidateBio");o&&(o.textContent=e.bio&&e.bio.trim()?e.bio:"No bio added."),P(e.skills||[]),M(e.experience||[]),F(e.education||[])}catch(e){console.error("Failed to load candidate profile:",e);const o=document.getElementById("candidateBio"),a=document.getElementById("candidateSkills"),d=document.getElementById("candidateExperience"),s=document.getElementById("candidateEducation");o&&(o.textContent="Failed to load candidate details."),a&&(a.textContent="â€”"),d&&(d.textContent="â€”"),s&&(s.textContent="â€”")}};window.filterCandidates=function(t){L=t,document.querySelectorAll(".filter-btn").forEach(i=>{var n;i.classList.remove("active"),(n=i.getAttribute("onclick"))!=null&&n.includes(`'${t}'`)&&i.classList.add("active")}),T()};function T(){const t=L,i=I;let n=g.filter(e=>{const o=t==="all"||e.status===t||t==="ACCEPTED"&&(e.status==="OFFERED"||e.status==="SHORTLISTED"),a=i==="all"||String(e.positionId)===String(i);return o&&a});m(n)}function O(){const t=document.getElementById("postFilter");t&&t.addEventListener("change",()=>{I=t.value||"all",T()})}async function k(){const t=document.getElementById("postFilter");if(t){try{const n=(await p.getCompanyPositions(u)||[]).filter(e=>e.status==="OPEN");t.innerHTML='<option value="all">All Posts</option>'+n.map(e=>`<option value="${e.id}">${e.positionTitle}</option>`).join("")}catch{}t.value=I}}async function H(){if(!u){console.warn("No companyId in session"),m([]);return}const t=document.querySelector(".candidates-table tbody");t&&(t.id="candidatesTableBody",t.innerHTML='<tr><td colspan="7" style="text-align:center;padding:32px;color:var(--gray-500);">Loading...</td></tr>');try{if(!f)try{const e=await p.getCompanyProfile(u);f=(e==null?void 0:e.companyName)||""}catch{f=""}g=(await p.getCompanyCandidates(u)||[]).flatMap(e=>Array.isArray(e.applications)&&e.applications.length?e.applications.map(o=>{var a,d,s,c;return{...e,...o,positionId:o.positionId||((a=o.position)==null?void 0:a.id)||((d=o.position)==null?void 0:d.positionId)||e.positionId,positionTitle:o.positionTitle||((s=o.position)==null?void 0:s.positionTitle)||((c=o.position)==null?void 0:c.title)||e.positionTitle,status:o.status||e.status,applicationDate:o.applicationDate||e.applicationDate,assignedInterviewerName:o.assignedInterviewerName||e.assignedInterviewerName,appliedDirectly:o.appliedDirectly??e.appliedDirectly??!0}}):e?[e]:[]);const n=document.getElementById("positionFilter");n&&(g.forEach(e=>{e.positionTitle&&C.add(e.positionTitle)}),n.innerHTML='<option value="all">All Positions</option>'+[...C].map(e=>`<option value="${e}">${e}</option>`).join("")),m(g),T()}catch(i){console.error("Error loading candidates:",i);const n=document.getElementById("candidatesTableBody");n&&(n.innerHTML='<tr><td colspan="7" style="text-align:center;color:#dc2626;">Failed to load candidates.</td></tr>')}}document.addEventListener("DOMContentLoaded",()=>{const t=document.querySelector(".candidates-table tbody");t&&(t.id="candidatesTableBody"),O(),k(),H(),D();const i=document.getElementById("candidateModal"),n=document.getElementById("candidateModalClose");n&&n.addEventListener("click",N),i&&i.addEventListener("click",e=>{e.target===i&&N()})});
