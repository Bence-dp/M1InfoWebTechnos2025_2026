let presets = [];
let presetMenu;

window.onload = () => {
  console.log("Page is loaded");
  start();
}

// URI of the endpoint
const URI_endpoint = "http://localhost:3000/api/presets";


async function getData() {
  // fetch is asynchronous, it returns a Promise
  const response = await fetch(URI_endpoint);
  // this line will be executed only when 
  // the previous one finished
  // .json() is also asynchronous and decodes the JSON response to a JS object
  presets = await response.json();

  // now we can build the preset menu
  buildPresetMenu();

  // More advanced version with "optgroup" HTML elements for categories
  // This is optional, but dropdown menu looks better with groups
  //buildPresetMenuWithGroups();
}

function buildPresetMenu() {
  presetMenu.innerHTML = ""; // clear existing content

  // Build first entry with a disabled option to prompt user to select a preset
  let firstOption = document.createElement("option");
  firstOption.value = ""; // no value
  firstOption.text = "Select a preset";
  firstOption.disabled = true;
  firstOption.selected = true; // selected by default, the menu will display this entry at first
  presetMenu.appendChild(firstOption);

  // build the preset menu options
  presets.forEach((preset, index) => {
    let option = document.createElement("option");
    option.value = index; // we use the index as value
    option.text = preset.name; // display the preset name

    // let's add it to the parent ul element
    presetMenu.appendChild(option);
  });
}

function buildPresetMenuWithGroups() {
  // Build an option group for each category
  const categories = {};
  
  // First, group presets by category
  presets.forEach((preset, index) => {
    const category = preset.type || "Uncategorized";
    if (!categories[category]) {
      categories[category] = [];
    }
    categories[category].push({ preset, index });
  });

  // Create first disabled option
  let firstOption = document.createElement("option");
  firstOption.value = ""; // no value
  firstOption.text = "Select a preset";
  firstOption.disabled = true;
  firstOption.selected = true; // selected by default
  presetMenu.appendChild(firstOption);

  // Now, create a group for each category
  for (const [category, items] of Object.entries(categories)) {
    const optgroup = document.createElement("optgroup");
    optgroup.label = category;

    items.forEach(({ preset, index }) => {
      const option = document.createElement("option");
      option.value = index;
      option.text = preset.name;
      optgroup.appendChild(option);
    });

    presetMenu.appendChild(optgroup);
  }
}

function loadPresetSoundFiles(index) {
  // URIS are like http://localhost:3000/presets/808/Kick%20808X.wav
  const BASE_PRESET_URI = "http://localhost:3000/presets";

  // build the URIs of the sound files for this preset
  const soundFileURIs = presets[index].samples.map(sample => {
    return encodeURI(`${BASE_PRESET_URI}/${sample.url}`);
  });

  console.log("Sound file URIs for preset " + presets[index].name + " : ", soundFileURIs);

  // We now have an array of sound file URIs
  // You can use them to load and play the sounds as needed
}

function start() {
  // called only when page is loaded
  // and DOM is ready

  presetMenu = document.querySelector("#presetMenu");
  presetMenu.onchange = () => {
    const selectedIndex = presetMenu.value;
    console.log("Selected preset index/name: " + selectedIndex, presets[selectedIndex].name);

    // load the sound files for this preset
    loadPresetSoundFiles(selectedIndex);
  }

  // get the presets from the server
  getData()
}

