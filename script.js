let vibrations = [];
const video = document.getElementById("video");
const vibrationList = document.getElementById("vibrationList");
const timet = document.querySelector('.ctimeup');


document.getElementById("videoInput").addEventListener("change", function () {
  const file = this.files[0];
  if (file) {
    video.src = URL.createObjectURL(file);
  }
});

async function loadVideoUrl() {
  const { value: url } = await Swal.fire({
    title: 'Enter Video URL',
    input: 'url',
    inputLabel: 'Video URL',
    inputPlaceholder: 'https://example.com/video.mp4',
    showCancelButton: true,
    confirmButtonText: 'Load Video',
    inputValidator: (value) => {
      if (!value) return 'Please enter a valid URL!';
    }
  });

  if (url) {
    const video = document.querySelector("video");
    video.src = url;
    video.load();
    Swal.fire('Loaded!', 'Your video has been loaded.', 'success');
  }
}

async function askVideoTime() {
  const currentTimeMs = Math.floor(video.currentTime * 1000); // Convert to milliseconds

  const { value: newTimeMs } = await Swal.fire({
    title: 'Set Video Time',
    input: 'number',
    inputLabel: 'Enter new time in milliseconds',
    inputValue: currentTimeMs,
    inputAttributes: {
      min: 0,
      step: 1
    },
    showCancelButton: true,
    confirmButtonText: 'Set Time',
    inputValidator: (value) => {
      if (value === "" || isNaN(value) || Number(value) < 0) {
        return 'Please enter a valid time in milliseconds!';
      }
    }
  });

  if (newTimeMs !== undefined) {
    video.currentTime = parseInt(newTimeMs) / 1000;
    Swal.fire('Updated!', `Video time set to ${parseInt(newTimeMs)}ms`, 'success');
  }
}

function forwardVideo() {
  video.currentTime = Math.min(
    video.duration,
    video.currentTime + 0.001
  );
}

function backwardVideo() {
  video.currentTime = Math.max(
    0,
    video.currentTime - 0.001
  );
}

let lastCheckTime = 0;
video.addEventListener('timeupdate', () => {
  const now = video.currentTime * 1000;
  timet.textContent=Math.floor(now);
  vibrations.forEach(v => {
    if (lastCheckTime < v.start && now >= v.start) {
      if ("vibrate" in navigator) {
        navigator.vibrate(v.duration);
      }
    }
  });
  lastCheckTime = now;
});

function addVibration() {
  const start = Math.floor(video.currentTime * 1000);
  video.pause();
  Swal.fire({
    title: 'New Vibration',
    html: `
      <label>Start: ${start} ms</label><br>
      <input type="number" id="duration" class="swal2-input" placeholder="Duration (ms)">
      <input type="number" id="amplitude" class="swal2-input" placeholder="Amplitude (1-255)">
    `,
    confirmButtonText: 'Add',
    focusConfirm: false,
    preConfirm: () => {
      const duration = +document.getElementById("duration").value;
      const amplitude = +document.getElementById("amplitude").value;
      if (!duration) return Swal.showValidationMessage("Duration required");
      return { start, duration, amplitude };
    }
  }).then(result => {
    if (result.isConfirmed) {
      vibrations.push(result.value);
      updateList();
    }
  });
}

function add50V() {
    j={
        start:Math.floor(video.currentTime * 1000),
        duration: 50, 
        amplitude: 255
    };
    vibrations.push(j);
    updateList();
}

function upppdateList() {
  vibrationList.innerHTML = "";
  vibrations.forEach((v, i) => {
    const div = document.createElement("div");
    div.className = "vibration-item";
    div.innerText = `⏱ ${v.start}ms | 🕒 ${v.duration}ms | ⚡ ${v.amplitude}`;
    div.onclick = () => editVibration(i);
    vibrationList.appendChild(div);
  });
}

function updateList() {
  vibrationList.innerHTML = "";

  // Sort the original vibrations array by start time
  vibrations.sort((a, b) => a.start - b.start);

  vibrations.forEach((v, i) => {
    const div = document.createElement("div");
    div.className = "vibration-item";
    div.innerText = `⏱ ${v.start}ms | 🕒 ${v.duration}ms | ⚡ ${v.amplitude}`;
    div.onclick = () => editVibration(i);
    vibrationList.appendChild(div);
  });
}

function editVibration(index) {
  const v = vibrations[index];
  video.currentTime = v.start / 1000;
  video.pause();
  Swal.fire({
    title: 'Edit Vibration',
    html: `
      <input type="number" id="start" class="swal2-input" value="${v.start}" placeholder="Start (ms)">
      <input type="number" id="duration" class="swal2-input" value="${v.duration}" placeholder="Duration (ms)">
      <input type="number" id="amplitude" class="swal2-input" value="${v.amplitude}" placeholder="Amplitude (1-255)">
    `,
    showDenyButton: true,
    confirmButtonText: 'Save',
    denyButtonText: 'Delete',
    preConfirm: () => {
      return {
        start: +document.getElementById("start").value,
        duration: +document.getElementById("duration").value,
        amplitude: +document.getElementById("amplitude").value
      };
    }
  }).then(result => {
    if (result.isConfirmed) {
      vibrations[index] = result.value;
    } else if (result.isDenied) {
      vibrations.splice(index, 1);
    }
    updateList();
  });
}

function loadJson() {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = ".json";
  input.onchange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        vibrations = JSON.parse(reader.result);
        updateList();
        Swal.fire("Loaded!", "", "success");
      } catch {
        Swal.fire("Invalid JSON!", "", "error");
      }
    };
    reader.readAsText(file);
  };
  input.click();
}

function downloadJson() {
  Swal.fire({
    title: 'Download As',
    input: 'text',
    inputLabel: 'File name',
    inputValue: 'vibrations.json',
    showCancelButton: true,
    confirmButtonText: 'Download'
  }).then(result => {
    if (result.isConfirmed) {
      const blob = new Blob([JSON.stringify(vibrations, null, 2)], { type: 'application/json' });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = result.value;
      a.click();
    }
  });
}