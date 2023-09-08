class OscillatorWidget {
  constructor(waveform = 'sine', volume = 0.5, frequency = 440) {
    // create audio context if it doesn't exist
    if (!window.AudioContext && !window.webkitAudioContext) {
      throw new Error('Web Audio API is not supported in this browser.');
    }
    this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();

    // oscillator variables
    this.oscillator = null;
    this.waveform = waveform;
    this.volume = volume;
    this.frequency = frequency;
  }

  // function to start the oscillator
  play() {
    if (this.oscillator === null) {
      this.oscillator = this.audioCtx.createOscillator();
      this.oscillator.type = this.waveform;
      this.oscillator.frequency.value = this.frequency;

      // create gain node for volume control
      this.oscillator.gainNode = this.audioCtx.createGain();
      this.oscillator.gainNode.gain.value = this.volume;

      this.oscillator.connect(this.oscillator.gainNode);
      this.oscillator.gainNode.connect(this.audioCtx.destination);

      this.oscillator.start();
    }
  }

  // function to stop the oscillator
  stop() {
    if (this.oscillator !== null) {
      this.oscillator.stop();
      this.oscillator.disconnect();
      this.oscillator.gainNode.disconnect();
      this.oscillator = null;
    }
  }

  // function to set the waveform type
  setWaveform(waveform) {
    this.waveform = waveform;
    if (this.oscillator !== null) {
      this.oscillator.type = this.waveform;
    }
  }

  // function to set the volume
  setVolume(volume) {
    this.volume = volume;
    if (this.oscillator !== null) {
      this.oscillator.gainNode.gain.value = this.volume;
    }
  }

  // function to set the frequency
  setFrequency(frequency) {
    this.frequency = frequency;
    if (this.oscillator !== null) {
      this.oscillator.frequency.value = this.frequency;
    }
  }
}
class Track {
  trackElement = null;
  constructor(waveform = 'sine', volume = 0.5, frequency = 440) {
    this.trackElement = null;
    this.create(waveform, volume, frequency);
  }
  
  create(waveform, volume, frequency) {
    this.trackElement = document.importNode(document.getElementById('trackTemplate').content, true).querySelector('.track');
    document.getElementById('tracks').appendChild(this.trackElement);
    this.trackElement.querySelector('.freqdisplay').textContent = frequency;
    this.trackElement.querySelector('.volumedisplay').textContent = volume;
    this.trackElement.querySelector('.trackTitle').textContent = 'Track ' + document.querySelectorAll('.track').length;
    //add this to the trackElement as data so that we can access it later
    const oscillator = new OscillatorWidget(waveform, volume, frequency);

    this.trackElement.querySelector('.waveform').addEventListener('change', (e) => {
      const selectedWaveform = e.target.value;
      oscillator.setWaveform(selectedWaveform);
    });

    this.trackElement.querySelector('.frequency').addEventListener('input', (e) => {
      const selectedFrequency = parseFloat(e.target.value);
      oscillator.setFrequency(selectedFrequency);
      // update the .freqdisplay span
      this.trackElement.querySelector('.freqdisplay').textContent = selectedFrequency;
    });

    this.trackElement.querySelector('.volume').addEventListener('input', (e) => {
      const selectedVolume = parseFloat(e.target.value);
      oscillator.setVolume(selectedVolume);
      // update the .volumedisplay span
      this.trackElement.querySelector('.volumedisplay').textContent = selectedVolume;
    });

    this.trackElement.querySelector('.playBtn').addEventListener('click', () => {
      oscillator.play();
    });

    this.trackElement.querySelector('.stopBtn').addEventListener('click', () => {
      oscillator.stop();
    });

    this.trackElement.querySelector('.deleteBtn').addEventListener('click', () => {
      oscillator.stop();
      this.trackElement.remove();
    });

    // on change of .freqdisplay span, due to contenteditable update the frequency
    this.trackElement.querySelector('.freqdisplay').addEventListener('input', (e) => {
      const selectedFrequency = parseFloat(e.target.textContent);
      oscillator.setFrequency(selectedFrequency);
      // update the .frequency input
      this.trackElement.querySelector('.frequency').value = selectedFrequency;
    });

    // on change of .volumedisplay span, due to contenteditable update the volume
    this.trackElement.querySelector('.volumedisplay').addEventListener('input', (e) => {
      const selectedVolume = parseFloat(e.target.textContent);
      oscillator.setVolume(selectedVolume);
      // update the .volume input
      this.trackElement.querySelector('.volume').value = selectedVolume;
    });

    this.trackElement.querySelectorAll('[contenteditable="true"][type="number"]').forEach(function (element) {
      element.addEventListener('keypress', function (e) {
        var x = e.charCode || e.keyCode;
        if (isNaN(String.fromCharCode(e.which)) && x != 46 || x === 32 || x === 13 || (x === 46 && e.currentTarget.innerText.includes('.'))) e.preventDefault();
      });
    });
  }
}

document.getElementById('addTrack').addEventListener('click', () => {
  const track = new Track();
});

document.getElementById('playAll').addEventListener('click', () => {
  const play_buttons = document.getElementsByClassName('playBtn');
  for (let i = 0; i < play_buttons.length; i++) {
    play_buttons[i].click();
  }
});

document.getElementById('stopAll').addEventListener('click', () => {
  const stop_buttons = document.getElementsByClassName('stopBtn');
  for (let i = 0; i < stop_buttons.length; i++) {
    stop_buttons[i].click();
  }
});

function save_track(element) {
  return {
    title: element.querySelector('.trackTitle').textContent,
    waveform: element.querySelector('.waveform').value,
    volume: element.querySelector('.volume').value,
    frequency: element.querySelector('.frequency').value
  }
}

// save button as JSON
document.getElementById('save').addEventListener('click', () => {
  const tracks = document.querySelectorAll('.track');
  const projectTitle = document.getElementById('projectTitle').textContent;
  let data = {projectTitle:projectTitle, tracks: [] };
  for (let i = 0; i < tracks.length; i++) {
    data.tracks.push(save_track(tracks[i]));
  }
  const json = JSON.stringify(data);
  // download the json file programatically
  const a = document.createElement('a');
  const file = new Blob([json], { type: 'application/json' });
  a.href = URL.createObjectURL(file);
  //current date and time as iso string
  const datetime = new Date().toISOString().replace(/:/g, '-').replace(/\./g, '-');
  a.download = `${projectTitle}.freq.json`;
  a.click();
});
// load from JSON button
document.getElementById('load').addEventListener('click', () => {
  const input = document.createElement('input');
  input.type = 'file';
  //accept [filename].freq.json files
  input.accept = '.freq.json';
  input.click();
  input.addEventListener('change',  () => {
    const file = this.files[0];
    const reader = new FileReader();
    reader.onload = function (progressEvent) {
      const data = JSON.parse(this.result);
      const tracks = document.querySelectorAll('.track');
      for (let i = 0; i < tracks.length; i++) {
        tracks[i].remove();
      }
      for (let i = 0; i < data.tracks.length; i++) {
        const track = new Track(data.tracks[i].waveform, data.tracks[i].volume, data.tracks[i].frequency);
        track.trackElement.querySelector('.trackTitle').textContent = data.tracks[i].title;
      }
    };
    reader.readAsText(file);
  });
});
// auto save every 2 seconds
function ls_save() {
  // get the project title
  const projectTitle = document.getElementById('projectTitle').textContent;
  // get the tracks
  let data = {projectTitle:projectTitle, tracks: [] };
  const tracks = document.querySelectorAll('.track');
  for (let i = 0; i < tracks.length; i++) {
    data.tracks.push(save_track(tracks[i]));
  }
  // save the data to local storage
  localStorage.setItem('freq', JSON.stringify(data));
}
// load from local storage
function ls_load() {
  const data = JSON.parse(localStorage.getItem('freq'));
  if (data !== null) {
    const tracks = document.querySelectorAll('.track');
    for (let i = 0; i < tracks.length; i++) {
      tracks[i].remove();
    }
    for (let i = 0; i < data.tracks.length; i++) {
      const track = new Track(data.tracks[i].waveform, data.tracks[i].volume, data.tracks[i].frequency);
      track.trackElement.querySelector('.trackTitle').textContent = data.tracks[i].title;
    }
  }
}
// autosave every 1 second
setInterval(ls_save, 1000);
// load from local storage on page load
ls_load();