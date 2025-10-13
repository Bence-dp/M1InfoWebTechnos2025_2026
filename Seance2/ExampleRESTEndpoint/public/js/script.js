window.onload = init;
const ENDPOINT_URI = "api/presets";
const presset_ul = document.querySelector("#sample_list");

async function init() {
    let response = await fetch(ENDPOINT_URI);
    let pressets = await response.json();

    displayArrayList(pressets);

}
 


function displayArrayList(pressets) {

    presset_ul.innerHTML = "";
    pressets.forEach( p => {
        const li = document.createElement("li");
        li.innerHTML = p.name;
        li.id ="list"
        presset_ul.appendChild(li);
        displayAudioFIlesForPreset(p);
        
    });
}
function displayAudioFIlesForPreset(params) {
    const ul_samples = document.createElement("ul");
    params.samples.forEach (samples =>{
        const li = document.createElement("li");
        li.innerHTML = samples.name;
        let audio = document.createElement("audio")  ;
        audio.src = "presets/" + samples.url;
        audio.controls = true;


        ul_samples.appendChild(li);
        li.appendChild(audio);

    })

    presset_ul.appendChild(ul_samples);
    
}