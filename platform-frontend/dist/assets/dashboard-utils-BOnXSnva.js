function c(t,e){try{if(!t)return"TBD";const r=new Date(t);if(isNaN(r.getTime()))return"TBD";const n=r.toLocaleDateString("en-US",{weekday:"short",month:"short",day:"numeric",year:"numeric"});if(e){const[i,o]=e.split(":"),a=new Date;a.setHours(parseInt(i),parseInt(o));const s=a.toLocaleTimeString("en-US",{hour:"2-digit",minute:"2-digit"});return`${n} @ ${s}`}return n}catch(r){return console.warn("Date formatting error",r),"Invalid Date"}}function u(t,e){if(!t)return"TBD";const r=new Date(t);return isNaN(r.getTime())?"TBD":r.toLocaleDateString("en-US",e||{weekday:"short",month:"short",day:"numeric",year:"numeric"})}function d(t){if(!t)return"TBD";const e=new Date(t);return isNaN(e.getTime())?"TBD":e.toLocaleTimeString("en-US",{hour:"2-digit",minute:"2-digit"})}function m(){return`
    <div class="loading-state">
      <div class="spinner"></div>
      <p>Loading your dashboard...</p>
    </div>
  `}function f(t){return`
    <div class="error-state">
      <p class="error-message">⚠️ ${t}</p>
      <button class="btn btn-secondary" onclick="location.reload()">Try Again</button>
    </div>
  `}function g(t){return`
    <div class="empty-state">
      <p>${t}</p>
    </div>
  `}export{f as a,g as b,m as c,u as d,d as e,c as f};
