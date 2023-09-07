import "./style.css";
import "leaflet/dist/leaflet.css";
import { DateTime } from "luxon";
import L, { layerGroup } from "leaflet";

document.querySelector<HTMLDivElement>("#app")!.innerHTML = `
  <h1>Enter the api key</h1>
  <form id="api">
    <input id="apiKey" type="password" />
    <input id="apiSend" type="submit" value="Submit" />
  </form>
`;

async function setMap(apikey: string) {
  document.querySelector<HTMLDivElement>("#app")!.innerHTML = `
    <h1>Loading</h1>
  `;

  let resp = await fetch("/api/health", {
    headers: {
      APIKEY: apikey,
    },
  });

  if (resp.status == 401) {
    document.querySelector<HTMLDivElement>("#app")!.innerHTML = `
      <h1>Wrong api key</h1>
    `;
    return;
  }

  let now = DateTime.now().setZone("Asia/Tokyo");
  document.querySelector<HTMLDivElement>("#app")!.innerHTML = `
    <h1>Where in the world is JB</h1>
    <button id="clear">Clear</button>
    <button id="all">All</button>
    <input id="date" type="date" value="2023-03-08" min="2023-03-09" max="2023-03-21" />
    <h2>Time in Tokio: <span id="hour">${now.toLocaleString(DateTime.DATETIME_MED_WITH_SECONDS)}</span></h2>
    <div id="map"></div>
  `;
  let initial: [number, number] = [35.68000498064944, 139.7563632293441];
  let my_map = L.map("map", { preferCanvas: true }).setView(initial, 10);
  L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: "© OpenStreetMap",
  }).addTo(my_map);

  let group = layerGroup();

  let options = {
    color: "red",
    fillColor: "#f03",
    fillOpacity: 0.5,
    radius: 15,
  };

  await setFullMap(apikey, options, group);

  group.addTo(my_map);

  document.querySelector<HTMLInputElement>("#clear")?.addEventListener("click", () => group.clearLayers());
  document.querySelector<HTMLInputElement>("#all")?.addEventListener("click", async () => {
    group.clearLayers();
    await setFullMap(apikey, options, group);
  });
  document.querySelector<HTMLInputElement>("#date")?.addEventListener("change", async (e: Event) => {
    group.clearLayers();
    let resp = await fetch(`/api/points/${(e.target as HTMLInputElement).value}`, {
      headers: {
        APIKEY: apikey,
      },
    });
    let day = parseInt((e.target as HTMLInputElement).value.split("-")[2]);
    let coords: { lat: number; lon: number; date: string }[] = await resp.json();
    options.color = getColor(day);
    options.fillColor = getColor(day);
    let box = {bX: Number.NEGATIVE_INFINITY , sX: Number.POSITIVE_INFINITY, bY: Number.NEGATIVE_INFINITY , sY: Number.POSITIVE_INFINITY};
    for (const newCod of coords) {
      box.bY = newCod.lat > box.bY ? newCod.lat: box.bY;
      box.sY = newCod.lat < box.sY ? newCod.lat: box.sY;
      box.bX = newCod.lon > box.bX ? newCod.lon: box.bX;
      box.sX = newCod.lon < box.sX ? newCod.lon: box.sX;
      L.circle([newCod.lat, newCod.lon], options).addTo(group);
    }
    my_map.fitBounds([[box.sY, box.sX],[box.bY, box.bX]]);
  });


  setInterval(() => {
    let now = DateTime.now().setZone("Asia/Tokyo");
    document.querySelector<HTMLSpanElement>("#hour")!.textContent = `${now.toLocaleString(
      DateTime.DATETIME_MED_WITH_SECONDS,
    )}`;
  }, 1000);
}

function getColor(day: number): string {
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
    "#0000ff",
  ];
  return colors[day % 12];
}

async function setFullMap(apikey: string, options: any, group: L.LayerGroup) {
  let resp = await fetch("/api/points", {
    headers: {
      APIKEY: apikey,
    },
  });
  let coords: { lat: number; lon: number; date: string }[] = await resp.json();

  for (const newCod of coords) {
    let dt = DateTime.fromISO(newCod.date).setZone("Asia/Tokyo");
    options.color = getColor(dt.day);
    options.fillColor = getColor(dt.day);
    L.circle([newCod.lat, newCod.lon], options).addTo(group);
  }
}

document.querySelector<HTMLDivElement>("#api")?.addEventListener("submit", async () => {
  let value = document.querySelector<HTMLInputElement>("#apiKey")?.value || "";
  await setMap(value);
});
