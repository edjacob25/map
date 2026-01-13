import "./style.css";
import "leaflet/dist/leaflet.css";
import { DateTime, Interval } from "luxon";
import L, { layerGroup } from "leaflet";
import { getColor, getColorWithTime } from "./colors.ts";

document.querySelector<HTMLDivElement>("#app")!.innerHTML = `
  <h1>Enter the password</h1>
  <form id="api">
    <input id="apiKey" type="password" />
    <input id="apiSend" type="submit" value="Submit" />
  </form>
`;

async function setMap(apikey: string) {
  let app = document.querySelector<HTMLDivElement>("#app")!;
  app.innerHTML = `<h1>Loading</h1>`;

  let resp = await fetch("/api/health", {
    headers: {
      APIKEY: apikey,
    },
  });

  if (resp.status == 401) {
    app.innerHTML = `<h1>Wrong api key</h1>`;
    return;
  }

  let trips: [{ name: string; start_date: string; end_date: string }] = await (
    await fetch("/api/trip", {
      headers: {
        APIKEY: apikey,
      },
    })
  ).json();

  let defaultTab = null;
  let now = DateTime.now().setZone("Asia/Tokyo");

  let tabs = document.createElement("div");
  tabs.classList.add("cont");
  let controlsList = document.createElement("div");

  for (let [idx, trip] of trips.entries()) {
    let title = document.createElement("h2");
    title.classList.add("tab");
    title.innerText = trip.name;
    title.addEventListener("click", async () => {
      Array.from(title.parentElement!.children).forEach((e) => {
        e.classList.remove("selected");
      });
      title.classList.add("selected");
      Array.from(controlsList.children).forEach((e) => {
        e.classList.add("invisible");
      });
      controlsList.children[idx].classList.remove("invisible");

      await drawTripData(trip.name, apikey, options, group, my_map);
    });
    tabs.append(title);

    let controls = document.createElement("div");
    controls.classList.add("invisible");

    let all = document.createElement("button");
    all.innerText = "Full trip";
    all.addEventListener("click", async () => {
      await drawTripData(trip.name, apikey, options, group, my_map);
    });
    controls.append(all);

    let dateInput = document.createElement("input");
    dateInput.type = "date";
    let realStartDate = DateTime.fromISO(trip.start_date).plus({ days: 1 });
    let realEndDate = DateTime.fromISO(trip.end_date).minus({ days: 1 });
    dateInput.value = realStartDate.toISODate()!;
    dateInput.min = realStartDate.toISODate()!;
    dateInput.max = realEndDate.toISODate()!;
    dateInput.addEventListener("change", async (e: Event) => {
      let date = (e.target as HTMLInputElement).value;
      await drawDailyData(apikey, date, options, group, my_map);
    });
    controls.append(dateInput);

    controlsList.append(controls);

    if (Interval.fromDateTimes(realStartDate, realEndDate).contains(now)) {
      defaultTab = idx;
      let reload = document.createElement("button");
      reload.innerText = "Reload today";
      reload.addEventListener("click", async () => {
        let dt = DateTime.now().setZone("Asia/Tokyo").toISODate()!;
        await drawDailyData(apikey, dt, options, group, my_map);
      });
      controls.append(reload);

      let latest = document.createElement("button");
      latest.innerText = "Latest seen at:";
      latest.addEventListener("click", async () => {
        let resp = await fetch("/api/points/latest", {
          headers: {
            APIKEY: apikey,
          },
        });
        let coords: { lat: number; lon: number; date: string } = await resp.json();
        let dt = DateTime.fromISO(coords.date).setZone("Asia/Tokyo");
        L.marker([coords.lat, coords.lon])
          .addTo(group)
          .bindPopup(`Seen at ${dt.toLocaleString(DateTime.DATETIME_SHORT)}`)
          .openPopup();
      });
      controls.append(latest);
    }
  }

  app.innerHTML = `
    <h1>Where in the world is Jacob?</h1>
    <h2>Time in Tokio: <span id="hour">${now.toLocaleString(DateTime.DATETIME_MED_WITH_SECONDS)}</span></h2>
  `;

  app.append(tabs);

  let gray_btn = document.createElement("button");
  gray_btn.innerText = "Toggle Grayscale";
  gray_btn.addEventListener("click", () => {
    toggleGrayscale();
  });

  app.append(gray_btn);

  app.append(controlsList);

  let map = document.createElement("div");
  map.id = "map";
  app.append(map);

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

  if (defaultTab != null) {
    controlsList.children[defaultTab].querySelector("input")!.value = now.toFormat("yyyy-MM-dd");
    await drawDailyData(apikey, now.toFormat("yyyy-MM-dd"), options, group, my_map);
  } else {
    defaultTab = 0;
    await drawTripData(trips[0].name, apikey, options, group, my_map);
  }
  tabs.children[defaultTab].classList.add("selected");
  controlsList.children[defaultTab].classList.remove("invisible");

  group.addTo(my_map);

  setInterval(() => {
    let now = DateTime.now().setZone("Asia/Tokyo");
    document.querySelector<HTMLSpanElement>("#hour")!.textContent = `${now.toLocaleString(
      DateTime.DATETIME_MED_WITH_SECONDS,
    )}`;
  }, 1000);
}

async function drawTripData(tripName: string, apikey: string, options: any, group: L.LayerGroup, map: L.Map) {
  group.clearLayers();
  map.flyTo([35.68000498064944, 139.7563632293441], 10);
  let resp = await fetch(`/api/points/trip?name=${tripName}`, {
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

async function drawDailyData(apikey: string, date: string, options: any, group: L.LayerGroup, map: L.Map) {
  group.clearLayers();
  let resp = await fetch(`/api/points/${date}`, {
    headers: {
      APIKEY: apikey,
    },
  });
  let day = parseInt(date.split("-")[2]);
  const coords: { lat: number; lon: number; date: string }[] = await resp.json();
  let box = {
    bX: Number.NEGATIVE_INFINITY,
    sX: Number.POSITIVE_INFINITY,
    bY: Number.NEGATIVE_INFINITY,
    sY: Number.POSITIVE_INFINITY,
  };

  for (const newCod of coords) {
    box.bY = newCod.lat > box.bY ? newCod.lat : box.bY;
    box.sY = newCod.lat < box.sY ? newCod.lat : box.sY;
    box.bX = newCod.lon > box.bX ? newCod.lon : box.bX;
    box.sX = newCod.lon < box.sX ? newCod.lon : box.sX;
    let dt = DateTime.fromISO(newCod.date).setZone("Asia/Tokyo");

    let tm = dt.hour * 60 + dt.minute;
    options.color = getColorWithTime(day, tm);
    options.fillColor = getColorWithTime(day, tm);
    L.circle([newCod.lat, newCod.lon], options).addTo(group);
  }
  if (coords.length < 1) {
    let defaultLoc: [number, number] = [35.68000498064944, 139.7563632293441];
    map.flyTo(defaultLoc, 10);
    L.marker(defaultLoc).addTo(group).bindPopup(`No data today yet`).openPopup();
    return;
  }
  map.fitBounds([
    [box.sY, box.sX],
    [box.bY, box.bX],
  ]);
}

function toggleGrayscale() {
  let tiles = document.getElementsByClassName("leaflet-tile-pane");
  for (const tile of tiles) {
    tile.classList.toggle("greyscale");
  }
}

document.querySelector<HTMLDivElement>("#api")?.addEventListener("submit", async () => {
  let value = document.querySelector<HTMLInputElement>("#apiKey")?.value || "";
  await setMap(value);
});
