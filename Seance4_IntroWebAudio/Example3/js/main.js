// About imports and exports in JavaScript modules
// see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules
// and https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/import
// and https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/export

// "named" imports from utils.js and soundutils.js
import { loadAndDecodeSound, playSound } from './soundutils.js';
import WaveformDrawer from '../../Example2/js/waveformdrawer.js';
import TrimbarsDrawer from '../../Example2/js/trimbarsdrawer.js';
import { pixelToSeconds } from '../../Example2/js/utils.js';

// The AudioContext object is the main "entry point" into the Web Audio API
let ctx;

// fallback list if server not available
const fallbackSoundURLs = [
    'https://upload.wikimedia.org/wikipedia/commons/a/a3/Hardstyle_kick.wav',
    'https://upload.wikimedia.org/wikipedia/commons/transcoded/c/c7/Redoblante_de_marcha.ogg/Redoblante_de_marcha.ogg.mp3',
    'https://upload.wikimedia.org/wikipedia/commons/transcoded/c/c9/Hi-Hat_Cerrado.ogg/Hi-Hat_Cerrado.ogg.mp3'
];

let decodedSounds = [];
let waveformDrawer, trimbarsDrawer;
let canvas, canvasOverlay;
let mousePos = { x: 0, y: 0 };
let trimPositions = {}; // map sampleIndex -> {left, right}
let currentSelected = { index: -1, buf: null, name: null };

function animate() {
    if (trimbarsDrawer) {
        trimbarsDrawer.clear();
        trimbarsDrawer.draw();
    }
    requestAnimationFrame(animate);
}

window.onload = async function init() {
    ctx = new AudioContext();

    // base URL for the API server (change if your server runs elsewhere)
    const apiBase = 'http://localhost:3000';

    // try to fetch presets from server
    let presets = null;
    try {
        const resp = await fetch(`${apiBase}/api/presets`);
        if (resp.ok) presets = await resp.json();
    } catch (err) {
        console.warn(`Could not fetch ${apiBase}/api/presets, using fallback`, err);
    }

    // samples is array of { url, name }
    let samples = fallbackSoundURLs.map(u => ({ url: u, name: u.split('/').pop() }));

    const presetSelect = document.querySelector('#presetSelect');

    if (presets && presets.length > 0) {
        // populate dropdown
        presets.forEach((p, i) => {
            const opt = document.createElement('option');
            opt.value = i;
            opt.textContent = p.name || `Preset ${i+1}`;
            presetSelect.appendChild(opt);
        });

        // build URLs from first preset (use apiBase so origin + port is correct)
        const first = presets[0];
        if (first.samples && first.samples.length > 0) {
            samples = first.samples.map(s => ({ url: `${apiBase}/presets/${s.url}`, name: s.name || s.url }));
        }

        // change handler to load chosen preset
        presetSelect.onchange = async (evt) => {
            const index = parseInt(evt.target.value);
            const p = presets[index];
            let urls = fallbackSoundURLs;
            if (p && p.samples && p.samples.length > 0) urls = p.samples.map(s => ({ url: `${apiBase}/presets/${s.url}`, name: s.name || s.url }));
            await loadAndShow(urls);
        };
    }

    // setup canvas and drawers
    canvas = document.querySelector('#myCanvas');
    canvasOverlay = document.querySelector('#myCanvasOverlay');
    waveformDrawer = new WaveformDrawer();
    trimbarsDrawer = new TrimbarsDrawer(canvasOverlay, 0, canvas.width);

    // mouse events for trimbars
    canvasOverlay.onmousemove = (evt) => {
        let rect = canvas.getBoundingClientRect();
        mousePos.x = (evt.clientX - rect.left);
        mousePos.y = (evt.clientY - rect.top);
        trimbarsDrawer.moveTrimBars(mousePos);
    };
    canvasOverlay.onmousedown = () => trimbarsDrawer.startDrag();
    canvasOverlay.onmouseup = () => {
        trimbarsDrawer.stopDrag();
        if (currentSelected.index >= 0) {
            trimPositions[currentSelected.index] = {
                left: trimbarsDrawer.leftTrimBar.x,
                right: trimbarsDrawer.rightTrimBar.x
            };
        }
    };

    // no separate play button: pads will play immediately on click

    requestAnimationFrame(animate);

    // initial load
    await loadAndShow(samples);
};

async function loadAndShow(samples) {
    // clear previous pads
    const padGrid = document.querySelector('#padGrid');
    padGrid.innerHTML = '';
    // samples is array of {url, name}
    // load & decode each sample and keep metadata
    const decodePromises = samples.map(s => loadAndDecodeSound(s.url, ctx)
        .then(buf => ({ buf, name: s.name }))
        .catch(e => { console.error('load failed', s.url, e); return null; }));

    const results = await Promise.all(decodePromises);
    const good = results.map((r, i) => ({ buf: r ? r.buf : null, name: r ? r.name : samples[i].name })).filter(x => x.buf !== null);

    // create 4x4 pads (16) and assign samples row-wise from bottom
    const cols = 4, rows = 4;
    const padBuffers = new Array(cols * rows).fill(null);

    for (let i = 0; i < Math.min(good.length, cols * rows); i++) {
        const col = i % cols;
        const rowFromBottom = Math.floor(i / cols);
        const row = rows - 1 - rowFromBottom;
        const padIndex = row * cols + col;
        padBuffers[padIndex] = { buf: good[i].buf, sampleIndex: i, name: good[i].name };
    }

    // create pad elements (row-major order)
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            const idx = r * cols + c;
            const info = padBuffers[idx];
            const pad = document.createElement('div');
            pad.className = 'pad';
            if (!info) {
                pad.classList.add('disabled');
                pad.textContent = '';
            } else {
                const label = info.name || `#${info.sampleIndex+1}`;
                pad.textContent = label.length > 12 ? label.slice(0, 11) + '…' : label;

                pad.onclick = async () => {
                    // show waveform and trimbars for this pad
                    currentSelected.index = info.sampleIndex;
                    currentSelected.buf = info.buf;
                    currentSelected.name = info.name;

                    // draw waveform
                    waveformDrawer.init(info.buf, canvas, '#83E83E');
                    const ctx2d = canvas.getContext('2d');
                    ctx2d.clearRect(0, 0, canvas.width, canvas.height);
                    waveformDrawer.drawWave(0, canvas.height);

                    // restore trim positions if any
                    const pos = trimPositions[info.sampleIndex] || { left: 0, right: canvas.width };
                    trimbarsDrawer.leftTrimBar.x = pos.left;
                    trimbarsDrawer.rightTrimBar.x = pos.right;

                    // play the selection immediately
                    if (ctx.state === 'suspended') await ctx.resume();
                    const start = pixelToSeconds(trimbarsDrawer.leftTrimBar.x, info.buf.duration, canvas.width);
                    const end = pixelToSeconds(trimbarsDrawer.rightTrimBar.x, info.buf.duration, canvas.width);
                    playSound(ctx, info.buf, start, end);
                };
            }
            padGrid.appendChild(pad);
        }
    }
}
