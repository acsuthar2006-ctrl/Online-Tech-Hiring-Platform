import"./modulepreload-polyfill-B5Qt9EMX.js";/* empty css             */import{s as r,a as n}from"./ui-utils-Djh0Sudd.js";const v=document.getElementById("joinForm"),i=document.getElementById("roomInput"),y=document.getElementById("createRoomBtn"),a=document.getElementById("downloadRecordingBtn"),g=document.getElementById("recordingSection");a&&g&&(g.style.display="block",a.style.display="block");const b=new URLSearchParams(window.location.search),h=b.get("room"),L=b.get("autocheck")==="1";h&&i&&(i.value=h,i.dispatchEvent(new Event("input")),L&&a&&setTimeout(()=>a.click(),0));v.addEventListener("submit",async o=>{o.preventDefault(),r(!0);const e=i.value.trim();if(!e){r(!1),n("Please enter a room ID","error"),i.focus();return}if(!/^[A-Za-z0-9-_]+$/.test(e)){r(!1),n("Room ID can only contain letters, numbers, hyphens and underscores","error");return}try{if(!await p(e)){r(!1),n("Room does not exist! Create it first.","error");return}console.log(`[Lobby] Joining room: ${e}`),window.location.href=`video-interview.html?room=${e}&role=candidate`}catch(t){r(!1),console.error("[Lobby] Error checking room:",t)}});y.addEventListener("click",async()=>{r(!0);const o=i.value.trim();if(!o){const e=E();i.value=e,console.log(`[Lobby] Instant meeting generated: ${e}`),window.location.href=`video-interview.html?room=${e}&role=interviewer`;return}if(!/^[A-Za-z0-9-_]+$/.test(o)){r(!1),n("Room ID can only contain letters, numbers, hyphens and underscores","error");return}try{if(await p(o)){r(!1),n("Room already exists! Join it or choose a different ID.","error");return}console.log(`[Lobby] Creating room: ${o}`),window.location.href=`video-interview.html?room=${o}&role=interviewer`}catch(e){r(!1),console.error("[Lobby] Error checking room:",e)}});a&&a.addEventListener("click",async()=>{const o=i.value.trim();if(!o){n("Please enter the room ID to check for recordings","error"),i.focus();return}console.log(`[Lobby] Checking recordings for room: ${o}`),r(!0);const e=window.location.port==="5173"?"http://localhost:3000":window.location.origin;try{const s=await(await fetch(`${e}/api/recordings/${o}`)).json();if(r(!1),s.recordings&&s.recordings.length>0){let d=`
            <div class="recordings-list">
                <div class="recordings-header">
                    <i class="fas fa-history"></i>
                    <h3>Session Archives</h3>
                </div>
                <div class="recordings-content">
        `;s.recordings.forEach(l=>{const u=l.filename.endsWith(".mp4")?"fa-file-video":"fa-file",m=`${e}/recordings/${l.filename}`;d+=`
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
            `}),d+="</div></div>";const c=document.querySelector(".recordings-list");c&&c.remove(),a.insertAdjacentHTML("afterend",d),n(`Found ${s.recordings.length} recordings!`,"success")}else{const d=`
            <div class="recordings-list">
                 <div class="empty-state">
                    <i class="fas fa-box-open"></i>
                    <p>No recordings found for this Session ID.</p>
                 </div>
            </div>
        `,c=document.querySelector(".recordings-list");c&&c.remove(),a.insertAdjacentHTML("afterend",d),n("No recordings found","info")}}catch(t){r(!1),console.error("Error fetching recordings:",t),n("Error checking recordings","error")}});async function p(o){try{const e=await fetch(`/check-room?room=${encodeURIComponent(o)}`);if(!e.ok)throw console.error(`[Lobby] Server returned ${e.status}`),new Error(`Server error: ${e.status}`);const t=await e.json();return console.log(`[Lobby] Room ${o} exists: ${t.exists}`),t.exists}catch(e){throw console.error("[Lobby] Error checking room existence:",e),n("Unable to connect to server. Please try again.","error"),e}}window.addEventListener("pageshow",o=>{(o.persisted||performance.navigation.type===2)&&r(!1)});function E(){const o="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";let e="";for(let t=0;t<8;t++)e+=o.charAt(Math.floor(Math.random()*o.length));return e}const w=document.getElementById("randomRoomBtn");w&&w.addEventListener("click",()=>{const o=E();i.value=o,i.dispatchEvent(new Event("input")),n(`Generated room ID: ${o}`,"success")});i.addEventListener("input",()=>{const o=i.value.trim().length>0,e=y.querySelector("span");e&&(e.textContent=o?"Start Meeting":"Start Instant Meeting")});i.addEventListener("keypress",o=>{o.key==="Enter"&&(o.preventDefault(),v.dispatchEvent(new Event("submit")))});window.addEventListener("load",()=>{i.focus(),console.log("[Lobby] Ready")});window.deleteRecording=async o=>{if(!confirm(`⚠️ SECURITY CHECK ⚠️

Only the INTERVIEWER is allowed to delete recordings.

Are you the Interviewer?`)){n("Action cancelled. You must be the Interviewer.","info");return}if(confirm("Are you sure? This recording will be PERMANENTLY deleted.")){r(!0);try{const t=await fetch(`/api/recordings/${o}`,{method:"DELETE"}),s=await t.json();r(!1),t.ok?(n("Recording deleted successfully","success"),document.getElementById("downloadRecordingBtn").click()):n(s.error||"Failed to delete","error")}catch(t){r(!1),console.error("Delete error:",t),n("Error connecting to server","error")}}};document.addEventListener("click",async o=>{const e=o.target.closest(".force-download-btn");if(e){o.preventDefault();const t=Array.from(e.childNodes);try{e.innerHTML='<i class="fas fa-spinner fa-spin"></i>',e.disabled=!0;const s=e.getAttribute("data-url"),d=e.getAttribute("data-filename")||"recording.mp4",c=await fetch(s);if(!c.ok)throw new Error("Network response was not ok");const l=await c.blob(),u=window.URL||window.webkitURL,m=u.createObjectURL(l),f=document.createElement("a");f.href=m,f.download=d,document.body.appendChild(f),f.click(),u.revokeObjectURL(m),document.body.removeChild(f)}catch(s){console.error("Force download failed:",s),n("Download failed. Please try again later.","error")}finally{e.innerHTML="",t.forEach(s=>e.appendChild(s)),e.disabled=!1}}});
