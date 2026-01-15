import puppeteer from 'puppeteer';
import { argv } from 'process';

// Configuration
const TARGET_URL = 'http://localhost:3000'; // Adjust if port differs
const RAMP_UP_INTERVAL_MS = 2000; // Time between starting new sessions
const SESSION_DURATION_MS = 30000; // How long to keep sessions active
const HEADLESS = true;

// Metrics
let successfulSessions = 0;
let failedSessions = 0;
const sessions = [];

// Parse CLI args for max sessions
const args = argv.slice(2);
const maxSessionsArg = args.find(arg => arg.startsWith('--sessions='));
const MAX_SESSIONS = maxSessionsArg ? parseInt(maxSessionsArg.split('=')[1]) : 5; // Default 5

(async () => {
    console.log(`🚀 Starting Stress Test`);
    console.log(`🎯 Target: ${TARGET_URL}`);
    console.log(`👥 Max Sessions: ${MAX_SESSIONS} (${MAX_SESSIONS * 2} users)`);
    console.log(`----------------------------------------`);

    // Launch browser with fake media args
    const browser = await puppeteer.launch({
        headless: HEADLESS ? "new" : false,
        args: [
            '--use-fake-ui-for-media-stream',
            '--use-fake-device-for-media-stream',
            '--no-sandbox',
            '--disable-setuid-sandbox'
        ]
    });

    console.log("✅ Browser launched");

    try {
        for (let i = 1; i <= MAX_SESSIONS; i++) {
            const roomId = `stress-test-${Date.now()}-${i}`;
            console.log(`\n[Session ${i}] Initiating Room: ${roomId}`);

            try {
                await startSession(browser, roomId, i);
                successfulSessions++;
            } catch (err) {
                console.error(`[Session ${i}] ❌ Failed:`, err.message);
                failedSessions++;
            }

            // Ramp up delay
            if (i < MAX_SESSIONS) {
                await new Promise(r => setTimeout(r, RAMP_UP_INTERVAL_MS));
            }
        }

        console.log(`\n----------------------------------------`);
        console.log(`🎉 All sessions initiated.`);
        console.log(`✅ Successful: ${successfulSessions}`);
        console.log(`❌ Failed: ${failedSessions}`);
        console.log(`waiting ${SESSION_DURATION_MS / 1000}s to maintain load...`);

        await new Promise(r => setTimeout(r, SESSION_DURATION_MS));

    } catch (err) {
        console.error("Critical Failure:", err);
    } finally {
        console.log("🛑 Closing browser...");
        await browser.close();
        console.log("Stress test complete.");
        process.exit(0);
    }
})();

async function startSession(browser, roomId, index) {
    const context = await browser.createBrowserContext();

    // 1. Interviewer
    const p1 = await context.newPage();
    const url1 = `${TARGET_URL}/?room=${roomId}&role=interviewer`;

    // 2. Candidate
    const p2 = await context.newPage();
    const url2 = `${TARGET_URL}/?room=${roomId}&role=candidate`;

    // Promise.all to join nearly simultaneously
    await Promise.all([
        setupParticipant(p1, url1, 'Interviewer', index),
        setupParticipant(p2, url2, 'Candidate', index)
    ]);

    sessions.push({ roomId, p1, p2 });
}

async function setupParticipant(page, url, role, index) {
    // Navigate
    await page.goto(url);

    // Wait for "Connected" or video element
    // Based on index.html, connection status creates a toast or updates text
    // The "Connected" status is usually set in the UI via setStatus

    try {
        // Wait for the local video to be ready (preview)
        await page.waitForSelector('video#local-user', { timeout: 10000 });


        // 🚨 IMPORTANT: Click 'Connect to Session' to start SFU/WebRTC
        // Use evaluate to force click which is more reliable than waitForSelector + click in headless stress tests
        await page.waitForSelector('#join-call-btn', { timeout: 5000 });
        await page.evaluate(() => {
            const btn = document.getElementById('join-call-btn');
            if (btn) btn.click();
        });

        // Wait for status to change to "Connected" AND verify connection by checking UI state
        // The 'Exit Session' button only appears when fully connected.
        await page.waitForSelector('#exit-call-btn', { visible: true, timeout: 20000 });

        console.log(`   [Session ${index}] ${role} joined & media flow active.`);

    } catch (e) {
        throw new Error(`${role} failed to join/stream: ${e.message}`);
    }
}
