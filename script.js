// A function that takes a number as input and returns the offset in hertz from C4
function offsetFromC4(number) {
  // The frequency of C4 in hertz
  let c4 = 261.63;
  // The ratio between each note in twelve-tone equal temperament
  let ratio = Math.pow(2, 1/12);
  // The number of semitones between the input number and C4
  let semitones = number - 0;
  // The frequency of the input number in hertz
  let frequency = c4 * Math.pow(ratio, semitones);
  // The offset in hertz from C4
  let offset = frequency - c4;
  // Return the offset rounded to two decimal places
  return Math.round(offset * 100) / 100;
}




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
    this.frequencyOffset = 0;
  }

  // function to start the oscillator
  play() {
    if (this.oscillator === null) {
      this.oscillator = this.audioCtx.createOscillator();
      this.oscillator.type = this.waveform;
      this.oscillator.frequency.value = this.frequency + this.frequencyOffset;

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
    this.frequency = parseFloat(frequency);
    if (this.oscillator !== null) {
      this.oscillator.frequency.value = this.frequency + this.frequencyOffset;
    }
  }
  setFrequencyOffset(offset) {
    this.frequencyOffset = offset;
    //make sure the frequency is a float
    this.frequency = parseFloat(this.frequency);
    if (this.oscillator !== null) {
      offset = parseFloat(offset);
      offset = isNaN(offset) ? 0 : offset;
      offset = offsetFromC4(offset);
      this.oscillator.frequency.value = this.frequency + offset;
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
    //update displays
    this.trackElement.querySelector('.freqdisplay').textContent = frequency;
    this.trackElement.querySelector('.volumedisplay').textContent = volume;
    //update inputs
    this.trackElement.querySelector('.frequency').value = frequency;
    this.trackElement.querySelector('.volume').value = volume;
    //update waveform
    this.trackElement.querySelector('.waveform').value = waveform;
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

    document.getElementById('globalFrequencyOffset').addEventListener('input', (e) => {
      const selectedFrequencyOffset = parseFloat(e.target.value);
      oscillator.setFrequencyOffset(selectedFrequencyOffset);
    });
    document.getElementById('globalFrequencyOffsetDisplay').addEventListener('input', (e) => {
      const selectedFrequencyOffset = parseFloat(e.target.textContent);
      oscillator.setFrequencyOffset(selectedFrequencyOffset);
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

this.document.querySelectorAll('[contenteditable="true"][type="number"]:not(.track)').forEach(function (element) {
  element.addEventListener('keypress', function (e) {
    var x = e.charCode || e.keyCode;
    if (isNaN(String.fromCharCode(e.which)) && x != 46 || x === 32 || 
    x === 13 || (x === 46 && e.currentTarget.innerText.includes('.')) ||
    (x === 45 && e.currentTarget.innerText.includes('-'))
    ) e.preventDefault();
  });
});

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
// set events for global frequency offset and it's editable display
document.getElementById('globalFrequencyOffset').addEventListener('input', (e) => {
  const selectedFrequencyOffset = parseFloat(e.target.value);
  document.getElementById('globalFrequencyOffsetDisplay').textContent = selectedFrequencyOffset;
});
document.getElementById('globalFrequencyOffsetDisplay').addEventListener('input', (e) => {
  const selectedFrequencyOffset = parseFloat(e.target.textContent);
  document.getElementById('globalFrequencyOffset').value = selectedFrequencyOffset;
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
  input.addEventListener('change', () => {
    const file = input.files[0];
    const reader = new FileReader();
    reader.addEventListener('load', () => {
      const data = JSON.parse(reader.result);
      const tracks = document.querySelectorAll('.track');
      for (let i = 0; i < tracks.length; i++) {
        tracks[i].remove();
      }
      for (let i = 0; i < data.tracks.length; i++) {
        const track = new Track(data.tracks[i].waveform, data.tracks[i].volume, data.tracks[i].frequency);
        track.trackElement.querySelector('.trackTitle').textContent = data.tracks[i].title;
      }
      document.getElementById('projectTitle').textContent = data.projectTitle;
    });
    reader.readAsText(file);
  });
});

// load project given a json object
function load_project(data) {
  const tracks = document.querySelectorAll('.track');
  for (let i = 0; i < tracks.length; i++) {
    tracks[i].querySelector('.stopBtn').click();
    tracks[i].remove();
  }
  for (let i = 0; i < data.tracks.length; i++) {
    const track = new Track(data.tracks[i].waveform, data.tracks[i].volume, data.tracks[i].frequency);
    track.trackElement.querySelector('.trackTitle').textContent = data.tracks[i].title;
  }
  document.getElementById('projectTitle').textContent = data.projectTitle;
}
// parse the project dom into a json object
function get_project() {
  const projectTitle = document.getElementById('projectTitle').textContent;
  let data = {projectTitle:projectTitle, tracks: [] };
  const tracks = document.querySelectorAll('.track');
  for (let i = 0; i < tracks.length; i++) {
    data.tracks.push(save_track(tracks[i]));
  }
  return data;
}

// auto save every 2 seconds
function ls_save() {
  // get the project title
  const data = get_project();
  // save the data to local storage
  localStorage.setItem('freq', JSON.stringify(data));
}
// load from local storage
function ls_load() {
  // get the data from local storage
  const data = JSON.parse(localStorage.getItem('freq'));
  // if there is data
  if (data !== null) {
    // load the data
    load_project(data);
  }
}


//use qwerty middle row for piano keys under C4, middle row L=-1, K=-2, J=-3, H=-4, G=-5, F=-6, D=-7, S=-8, A=-9
//use qwerty top row for piano keys form C4, top row Q=0, W=1, E=2, R=3, T=4, Y=5, U=6, I=7, O=8, P=9
NoteMappings = {
  KeyL: -1,
  KeyK: -2,
  KeyJ: -3,
  KeyH: -4,
  KeyG: -5,
  KeyF: -6,
  KeyD: -7,
  KeyS: -8,
  KeyA: -9,
  KeyQ: 0,
  KeyW: 1,
  KeyE: 2,
  KeyR: 3,
  KeyT: 4,
  KeyY: 5,
  KeyU: 6,
  KeyI: 7,
  KeyO: 8,
  KeyP: 9
};
//global key down event listener
document.addEventListener('keydown', (e) => {
  // use key codes as piano keys
  const key = e.code;//es. KeyA, KeyS, KeyD, KeyF, KeyG, KeyH, KeyJ, KeyK, KeyL etc.
  // check if the key is in the note mappings
  if (key in NoteMappings) {
    // get the note offset from C4
    const offset = NoteMappings[key];
    // get the frequency offset input
    const frequencyOffsetInput = document.getElementById('globalFrequencyOffset');
    //set the frequency offset input to the offset and trigger the input event
    frequencyOffsetInput.value = offset;
    frequencyOffsetInput.dispatchEvent(new Event('input'));
    //click the play all button just in case
    document.getElementById('playAll').click();
  }
});
//global key up event listener to stop all tracks if doPianoKeys checkbox is checked
document.addEventListener('keyup', (e) => {
  // use key codes as piano keys
  const key = e.code;//es. KeyA, KeyS, KeyD, KeyF, KeyG, KeyH, KeyJ, KeyK, KeyL etc.
  // check if the key is in the note mappings
  if (key in NoteMappings) {
    // stop all tracks via the stop all button
    document.getElementById('stopAll').click();
  }
});
// autosave every 1 second
setInterval(ls_save, 1000);
// load from local storage on page load
ls_load();
//set global frequency offset to 0 on page load
document.getElementById('globalFrequencyOffset').value = 0;
document.getElementById('globalFrequencyOffsetDisplay').textContent = 0;