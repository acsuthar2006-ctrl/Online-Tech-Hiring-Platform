export const getMediaBase = () => {
    // Check if we are running in localhost/development
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    
    // In local development, the UI operates on the local media server
    if (isLocal) {
        return "http://localhost:3000";
    }
    
    // In production (Vercel), we also use a Cloudflare tunnel URL, but this could be a static domain later
    return "https://viii-olympus-exists-simulation.trycloudflare.com";
};
