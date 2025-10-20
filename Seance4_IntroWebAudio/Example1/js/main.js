// About imports and exports in JavaScript modules
// see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules
// and https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/import
// and https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/export

// "named" imports from utils.js and soundutils.js
import { loadAndDecodeSound, playSound } from './soundutils.js';

// The AudioContext object is the main "entry point" into the Web Audio API
let ctx;


const soundURL =
    'https://mainline.i3s.unice.fr/mooc/shoot2.mp3';

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


// store all decoded buffers here when loaded in parallel
let decodedSounds = [];

// The button for playing the sound
let playButton = document.querySelector("#playButton");
// disable the button until the sound is loaded and decoded
playButton.disabled = true;

window.onload = async function init() {

    ctx = new AudioContext();
    // Load and decode all sounds in parallel using Promise.all
    // build an array of promises then await them together
    const loadPromises = soundURLs.map(url => loadAndDecodeSound(url, ctx));
    try {
        decodedSounds = await Promise.all(loadPromises);
        console.log(`Loaded ${decodedSounds.length} sounds`);
    } catch (err) {
        console.error('Error loading one of the sounds:', err);
        // keep the button disabled if something failed
        return;
    }
 
    // we enable the play sound button, now that the sounds are loaded
    playButton.disabled = false;

    // Event listener for the main button. When pressed we play the first loaded buffer.
    playButton.onclick = async function (evt) {
        if (ctx.state === 'suspended') await ctx.resume();
        const buffer = decodedSounds[0];
        if (!buffer) return;
        playSound(ctx, buffer, 0, buffer.duration);
    }

    // Create one button per loaded sound inside the #soundbuttons div
    const container = document.querySelector('#soundbuttons');
    if (container) {
        container.innerHTML = '';
        decodedSounds.forEach((buffer, i) => {
            const btn = document.createElement('button');
            // try to extract a friendly name from the URL, fallback to index
            let label;
            try { label = new URL(soundURLs[i]).pathname.split('/').pop(); } catch (e) { label = `Sound ${i+1}`; }
            btn.textContent = label || `Sound ${i+1}`;
            btn.onclick = async () => {
                if (ctx.state === 'suspended') await ctx.resume();
                playSound(ctx, buffer, 0, buffer.duration);
            };
            container.appendChild(btn);
        });
    }
}
