window.onload = init;
const ENDPOINT_URI = "/api/presets";
let presets_ul;

async function init() {
    console.log("Page loaded, DOM defined");

    presets_ul = document.querySelector("#presetList");


    // let's send a fetch HTTP GET request to the server
    let response = await fetch(ENDPOINT_URI);
    //console.log(response);
    // converts the response received from JSON to a real JS object
    let presets = await response.json();
    console.log(presets);

    displayAsList(presets);
}

function displayAsList(presets) {
    presets_ul.innerHTML = "";

    presets.forEach(p => {
        const li = document.createElement("li");
        li.innerHTML = p.name;

        // we add the li element to the ul list
        presets_ul.appendChild(li);

        displayAudioFilesForPreset(p);
    });
}

function displayAudioFilesForPreset(p) {
    const ulSamples = document.createElement("ul");

    p.samples.forEach(sample => {
        console.log(sample.name + " file: " + sample.url);
        const li = document.createElement("li");

        li.innerHTML = sample.name;
        // Let's create an <audio src=""></audio> HTML element
        let audio = document.createElement("audio");
        audio.src = "presets/" + sample.url;
        audio.controls = true;

       

        li.appendChild(audio)
;
        ulSamples.appendChild(li);
    });

    // we add the ulSamples to the parent ul
    presets_ul.appendChild(ulSamples);
}