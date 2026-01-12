import ffmpeg from 'ffmpeg-static';
import fs from 'fs';

console.log('FFmpeg Path:', ffmpeg);

if (fs.existsSync(ffmpeg)) {
    console.log('✅ FFmpeg binary exists!');
    // Try executing it
    const { execSync } = await import('child_process');
    try {
        const out = execSync(`${ffmpeg} -version`).toString();
        console.log('✅ FFmpeg Execution Success:', out.split('\n')[0]);
    } catch (e) {
        console.error('❌ FFmpeg Execution Failed:', e.message);
    }
} else {
    console.error('❌ FFmpeg binary NOT found at path!');
}
