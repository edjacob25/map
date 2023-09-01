import './style.css'
import 'leaflet/dist/leaflet.css'
import {DateTime} from "luxon";
import L, {CircleMarker, layerGroup} from 'leaflet';

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <h1>Enter the api key</h1>
  <input id="apiKey" type="password" />
  <input id="apiSend" type="button" value="Submit" /> 
`

async function setMap(apikey: string) {
    document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
      <h1>Loading</h1>
    `
    console.log(apikey);

    let resp = await fetch("/api/points", {
        headers: {
            APIKEY: apikey
        }
    });

    if (resp.status == 401) {
        document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
          <h1>Wrong api key</h1>
        `;
        return;
    }

    document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
      <h1>Where in the world is JB</h1>
      <button id="clear">Clear</button>
      <button id="all">All</button>
      <input id="date" type="date" value="2023-03-08" min="2023-03-09" max="2023-03-21" />
      <div id="map"></div>
    `

    let coords: { lat: number, lon: number, dt: string; }[] = await resp.json();
    let initial: [number, number] = [coords[0].lat, coords[0].lon];
    let my_map = L.map("map", {preferCanvas: true}).setView(initial, 10)


    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap'
    }).addTo(my_map);

    let group = layerGroup();

    let options = {
        color: 'red',
        fillColor: '#f03',
        fillOpacity: 0.5,
        radius: 15
    };
    let colors = [
        "#ff0000",
        "#00ffff",
        "#80ff00",
        "#8000ff",
        "#ff8000",
        "#ffff00",
        "#00ff80",
        "#0080ff",
        "#ff00ff",
        "#00ff00",
        "#ff0080",
        "#0000ff"
    ]

    for (let cord of coords) {
        let dt = DateTime.fromISO(cord.dt).setZone("Asia/Tokyo");
        options.color = colors[dt.day % 12];
        options.fillColor = colors[dt.day % 12]
        L.circle([cord.lat, cord.lon], options).addTo(group);
    }

    group.addTo(my_map);

    document.querySelector<HTMLInputElement>('#clear')?.addEventListener("click", () => group.clearLayers());
    document.querySelector<HTMLInputElement>('#all')?.addEventListener("click", async () => {
        group.clearLayers();
        let resp = await fetch("/api/points", {
            headers: {
                APIKEY: apikey
            }
        });
        let coords: { lat: number, lon: number, dt: string; }[] = await resp.json();

        for (const newCod of coords) {
            let dt = DateTime.fromISO(newCod.dt).setZone("Asia/Tokyo");
            options.color = colors[dt.day % 12];
            options.fillColor = colors[dt.day % 12]
            L.circle([newCod.lat, newCod.lon], options).addTo(group);
        }
    });
    document.querySelector<HTMLInputElement>('#date')?.addEventListener("change", async (e: Event) => {
        group.clearLayers();
        let resp = await fetch(`/api/points/${(e.target as HTMLInputElement).value}`, {
            headers: {
                APIKEY: apikey
            }
        });
        let day = parseInt((e.target as HTMLInputElement).value.split("-")[2]);
        let coords: { lat: number, lon: number, dt: DateTime; }[] = await resp.json();
        options.color = colors[day % 12];
        options.fillColor = colors[day % 12];
        for (const newCod of coords) {
            L.circle([newCod.lat, newCod.lon], options).addTo(group);
        }
        my_map.setView((group.getLayers()[0] as CircleMarker)?.getLatLng(), 13);
    });
}


document.querySelector<HTMLDivElement>('#apiSend')?.addEventListener('click', () => {
    let value = document.querySelector<HTMLInputElement>('#apiKey')?.value || "";
    setMap(value);
});


