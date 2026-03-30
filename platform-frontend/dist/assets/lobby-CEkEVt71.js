import"./modulepreload-polyfill-B5Qt9EMX.js";/* empty css             */import{s as t,a as n}from"./ui-utils-Djh0Sudd.js";import{g}from"./media-config-DXL3pj2J.js";const y=document.getElementById("joinForm"),s=document.getElementById("roomInput"),b=document.getElementById("createRoomBtn"),c=document.getElementById("downloadRecordingBtn"),h=document.getElementById("recordingSection");c&&h&&(h.style.display="block",c.style.display="block");const p=new URLSearchParams(window.location.search),w=p.get("room"),I=p.get("autocheck")==="1";w&&s&&(s.value=w,s.dispatchEvent(new Event("input")),I&&c&&setTimeout(()=>c.click(),0));y.addEventListener("submit",async o=>{o.preventDefault(),t(!0);const e=s.value.trim();if(!e){t(!1),n("Please enter a room ID","error"),s.focus();return}if(!/^[A-Za-z0-9-_]+$/.test(e)){t(!1),n("Room ID can only contain letters, numbers, hyphens and underscores","error");return}try{if(!await E(e)){t(!1),n("Room does not exist! Create it first.","error");return}console.log(`[Lobby] Joining room: ${e}`),window.location.href=`video-interview.html?room=${e}&role=candidate`}catch(r){t(!1),console.error("[Lobby] Error checking room:",r)}});b.addEventListener("click",async()=>{t(!0);const o=s.value.trim();if(!o){const e=L();s.value=e,console.log(`[Lobby] Instant meeting generated: ${e}`),window.location.href=`video-interview.html?room=${e}&role=interviewer`;return}if(!/^[A-Za-z0-9-_]+$/.test(o)){t(!1),n("Room ID can only contain letters, numbers, hyphens and underscores","error");return}try{if(await E(o)){t(!1),n("Room already exists! Join it or choose a different ID.","error");return}console.log(`[Lobby] Creating room: ${o}`),window.location.href=`video-interview.html?room=${o}&role=interviewer`}catch(e){t(!1),console.error("[Lobby] Error checking room:",e)}});c&&c.addEventListener("click",async()=>{const o=s.value.trim();if(!o){n("Please enter the room ID to check for recordings","error"),s.focus();return}console.log(`[Lobby] Checking recordings for room: ${o}`),t(!0);const e=g();try{const i=await(await fetch(`${e}/api/recordings/${o}`)).json();if(t(!1),i.recordings&&i.recordings.length>0){let d=`
            <div class="recordings-list">
                <div class="recordings-header">
                    <i class="fas fa-history"></i>
                    <h3>Session Archives</h3>
                </div>
                <div class="recordings-content">
        `;i.recordings.forEach(l=>{const u=l.filename.endsWith(".mp4")?"fa-file-video":"fa-file",m=`${e}/recordings/${l.filename}`;d+=`
            <div class="recording-item">
                <div class="recording-info">
                    <span class="recording-name">Session Recording</span>
                    <span class="recording-date">
                        <i class="far fa-clock"></i> ${l.date}
                    </span>
                </div>
                <div class="recording-actions">
                    <button class="action-btn download-action force-download-btn" data-url="${m}" data-filename="${l.filename}" title="Download Recording">
                        Download Recording
                    </button>
                    <button class="action-btn delete-action" onclick="deleteRecording('${l.filename}')" title="Delete (Interviewer Only)">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
            `}),d+="</div></div>";const a=document.querySelector(".recordings-list");a&&a.remove(),c.insertAdjacentHTML("afterend",d),n(`Found ${i.recordings.length} recordings!`,"success")}else{const d=`
            <div class="recordings-list">
                 <div class="empty-state">
                    <i class="fas fa-box-open"></i>
                    <p>No recordings found for this Session ID.</p>
                 </div>
            </div>
        `,a=document.querySelector(".recordings-list");a&&a.remove(),c.insertAdjacentHTML("afterend",d),n("No recordings found","info")}}catch(r){t(!1),console.error("Error fetching recordings:",r),n("Error checking recordings","error")}});async function E(o){try{const e=await fetch(`${g()}/check-room?room=${encodeURIComponent(o)}`);if(!e.ok)throw console.error(`[Lobby] Server returned ${e.status}`),new Error(`Server error: ${e.status}`);const r=await e.json();return console.log(`[Lobby] Room ${o} exists: ${r.exists}`),r.exists}catch(e){throw console.error("[Lobby] Error checking room existence:",e),n("Unable to connect to server. Please try again.","error"),e}}window.addEventListener("pageshow",o=>{(o.persisted||performance.navigation.type===2)&&t(!1)});function L(){const o="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";let e="";for(let r=0;r<8;r++)e+=o.charAt(Math.floor(Math.random()*o.length));return e}const v=document.getElementById("randomRoomBtn");v&&v.addEventListener("click",()=>{const o=L();s.value=o,s.dispatchEvent(new Event("input")),n(`Generated room ID: ${o}`,"success")});s.addEventListener("input",()=>{const o=s.value.trim().length>0,e=b.querySelector("span");e&&(e.textContent=o?"Start Meeting":"Start Instant Meeting")});s.addEventListener("keypress",o=>{o.key==="Enter"&&(o.preventDefault(),y.dispatchEvent(new Event("submit")))});window.addEventListener("load",()=>{s.focus(),console.log("[Lobby] Ready")});window.deleteRecording=async o=>{if(!confirm(`⚠️ SECURITY CHECK ⚠️

Only the INTERVIEWER is allowed to delete recordings.

Are you the Interviewer?`)){n("Action cancelled. You must be the Interviewer.","info");return}if(confirm("Are you sure? This recording will be PERMANENTLY deleted.")){t(!0);try{const r=await fetch(`${g()}/api/recordings/${o}`,{method:"DELETE"}),i=await r.json();t(!1),r.ok?(n("Recording deleted successfully","success"),document.getElementById("downloadRecordingBtn").click()):n(i.error||"Failed to delete","error")}catch(r){t(!1),console.error("Delete error:",r),n("Error connecting to server","error")}}};document.addEventListener("click",async o=>{const e=o.target.closest(".force-download-btn");if(e){o.preventDefault();const r=Array.from(e.childNodes);try{e.innerHTML='<i class="fas fa-spinner fa-spin"></i>',e.disabled=!0;const i=e.getAttribute("data-url"),d=e.getAttribute("data-filename")||"recording.mp4",a=await fetch(i);if(!a.ok)throw new Error("Network response was not ok");const l=await a.blob(),u=window.URL||window.webkitURL,m=u.createObjectURL(l),f=document.createElement("a");f.href=m,f.download=d,document.body.appendChild(f),f.click(),u.revokeObjectURL(m),document.body.removeChild(f)}catch(i){console.error("Force download failed:",i),n("Download failed. Please try again later.","error")}finally{e.innerHTML="",r.forEach(i=>e.appendChild(i)),e.disabled=!1}}});
