const fs = require('fs');
const { execSync } = require('child_process');
const wav = require('wav-decoder');
const readline = require('readline-sync');

// Get user input
const INPUT_VIDEO = readline.question('Enter input video filename (e.g. input.mp4): ').trim();
const OUTPUT_JSON = readline.question('Enter output JSON filename (e.g. vibrations.json): ').trim();
const TEMP_AUDIO = 'temp_audio.wav';

function extractAudio() {
  console.log(`\n🎵 Extracting audio from "${INPUT_VIDEO}"...`);
  execSync(`ffmpeg -y -i "${INPUT_VIDEO}" -vn -ac 1 -ar 44100 -f wav "${TEMP_AUDIO}"`);
}

async function analyzeAudio() {
  console.log('🔍 Analyzing audio...');
  const buffer = fs.readFileSync(TEMP_AUDIO);
  const audioData = await wav.decode(buffer);

  const sampleRate = audioData.sampleRate;
  const channelData = audioData.channelData[0]; // mono

  const windowSize = Math.floor(sampleRate * 0.2);  // 200ms
  const stepSize = Math.floor(sampleRate * 0.1);    // 100ms

  const absSamples = channelData.map(Math.abs);
  const sortedSamples = [...absSamples].sort((a, b) => a - b);
  const threshold = sortedSamples[Math.floor(sortedSamples.length * 0.9)];

  const vibrations = [];

  for (let i = 0; i < channelData.length - windowSize; i += stepSize) {
    const window = absSamples.slice(i, i + windowSize);
    const avgAmplitude = window.reduce((a, b) => a + b, 0) / window.length;

    if (avgAmplitude > threshold) {
      const startMs = Math.floor((i / sampleRate) * 1000);
      const amplitude = Math.min(255, Math.floor(avgAmplitude * 1024)); // Scale

      vibrations.push({
        start: startMs,
        duration: 1000,
        amplitude
      });
    }
  }

  fs.writeFileSync(OUTPUT_JSON, JSON.stringify(vibrations, null, 2));
  console.log(`✅ Done! Saved ${vibrations.length} vibration events to "${OUTPUT_JSON}"`);
}

(async () => {
  try {
    extractAudio();
    await analyzeAudio();
    fs.unlinkSync(TEMP_AUDIO);
  } catch (err) {
    console.error('❌ Error:', err.message);
  }
})();
