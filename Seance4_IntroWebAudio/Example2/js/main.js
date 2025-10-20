// About imports and exports in JavaScript modules
// see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules
// and https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/import
// and https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/export

// default imports of classes from waveformdrawer.js and trimbarsdrawer.js
import WaveformDrawer from './waveformdrawer.js';
import TrimbarsDrawer from './trimbarsdrawer.js';
// "named" imports from utils.js and soundutils.js
import { loadAndDecodeSound, playSound } from './soundutils.js';
import { pixelToSeconds } from './utils.js';

// The AudioContext object is the main "entry point" into the Web Audio API
let ctx;

// multiple sounds (from README)
const soundURLs = [
    'https://upload.wikimedia.org/wikipedia/commons/a/a3/Hardstyle_kick.wav',
    'https://upload.wikimedia.org/wikipedia/commons/transcoded/c/c7/Redoblante_de_marcha.ogg/Redoblante_de_marcha.ogg.mp3',
    'https://upload.wikimedia.org/wikipedia/commons/transcoded/c/c9/Hi-Hat_Cerrado.ogg/Hi-Hat_Cerrado.ogg.mp3',
    'https://upload.wikimedia.org/wikipedia/commons/transcoded/0/07/Hi-Hat_Abierto.ogg/Hi-Hat_Abierto.ogg.mp3',
    'https://upload.wikimedia.org/wikipedia/commons/transcoded/3/3c/Tom_Agudo.ogg/Tom_Agudo.ogg.mp3',
    'https://upload.wikimedia.org/wikipedia/commons/transcoded/a/a4/Tom_Medio.ogg/Tom_Medio.ogg.mp3',
    'https://upload.wikimedia.org/wikipedia/commons/transcoded/8/8d/Tom_Grave.ogg/Tom_Grave.ogg.mp3',
    'https://upload.wikimedia.org/wikipedia/commons/transcoded/6/68/Crash.ogg/Crash.ogg.mp3',
    'https://upload.wikimedia.org/wikipedia/commons/transcoded/2/24/Ride.ogg/Ride.ogg.mp3'
];

let decodedSounds = [];

let canvas, canvasOverlay;
let waveformDrawer, trimbarsDrawer;
let mousePos = { x: 0, y: 0 };

// store per-sound trim positions in pixels (left, right)
let trimPositions = [];

let currentIndex = -1; // index of sound currently shown

window.onload = async function init() {
    ctx = new AudioContext();

    canvas = document.querySelector("#myCanvas");
    canvasOverlay = document.querySelector("#myCanvasOverlay");

    waveformDrawer = new WaveformDrawer();
    // default trim bars positions (use full width)
    trimbarsDrawer = new TrimbarsDrawer(canvasOverlay, 0, canvas.width);

    // initialize default trimPositions
    for (let i = 0; i < soundURLs.length; i++) {
        trimPositions[i] = { left: 0, right: canvas.width };
    }

    // load and decode all sounds in parallel
    let promises = soundURLs.map(url => loadAndDecodeSound(url, ctx));
    decodedSounds = await Promise.all(promises);

    // create a play button for each decoded sound
    let buttonsContainer = document.querySelector('#buttonsContainer');
    const buttons = [];
    decodedSounds.forEach((decodedSound, index) => {
        let btn = document.createElement('button');
        btn.textContent = `Play sound ${index + 1}`;
        btn.onclick = () => onSelectSound(index, buttons);
        buttonsContainer.appendChild(btn);
        buttons.push(btn);
    });

    // mouse events for trimbars control
    canvasOverlay.onmousemove = (evt) => {
        let rect = canvas.getBoundingClientRect();
        mousePos.x = (evt.clientX - rect.left);
        mousePos.y = (evt.clientY - rect.top);
        trimbarsDrawer.moveTrimBars(mousePos);
    };

    canvasOverlay.onmousedown = (evt) => {
        trimbarsDrawer.startDrag();
    };

    canvasOverlay.onmouseup = (evt) => {
        trimbarsDrawer.stopDrag();
        // if a sound is selected, store the current trim positions
        if (currentIndex >= 0) {
            trimPositions[currentIndex].left = trimbarsDrawer.leftTrimBar.x;
            trimPositions[currentIndex].right = trimbarsDrawer.rightTrimBar.x;
        }
    };

    requestAnimationFrame(animate);
};

async function onSelectSound(index, buttons) {
    currentIndex = index;
    let decodedSound = decodedSounds[index];

    // Clear canvas before drawing new waveform so only the selected one is visible
    let ctx2d = canvas.getContext('2d');
    ctx2d.clearRect(0, 0, canvas.width, canvas.height);

    // initialize waveform and trimbars for this sound
    waveformDrawer.init(decodedSound, canvas, '#83E83E');
    waveformDrawer.drawWave(0, canvas.height);

    // restore saved trim positions
    let pos = trimPositions[index] || { left: 0, right: canvas.width };
    trimbarsDrawer.leftTrimBar.x = pos.left;
    trimbarsDrawer.rightTrimBar.x = pos.right;

    // highlight selected button and remove highlight on others
    if (Array.isArray(buttons)) {
        buttons.forEach((b, i) => {
            if (i === index) b.classList.add('selected'); else b.classList.remove('selected');
        });
    }

    // ensure AudioContext is running (some browsers start it suspended)
    if (ctx && ctx.state === 'suspended') {
        await ctx.resume();
    }

    // play using current trim positions
    let start = pixelToSeconds(trimbarsDrawer.leftTrimBar.x, decodedSound.duration, canvas.width);
    let end = pixelToSeconds(trimbarsDrawer.rightTrimBar.x, decodedSound.duration, canvas.width);
    playSound(ctx, decodedSound, start, end);
}

function animate() {
    trimbarsDrawer.clear();
    trimbarsDrawer.draw();
    requestAnimationFrame(animate);
}



