import {DateTime} from "luxon";
import cords from "./points/minimun.json";

interface Env {
    APIKEY: string;
}

export const onRequest: PagesFunction<Env> = async (ctx) => {

    let apikey = ctx.request.headers.get("apikey");
    if (apikey != ctx.env.APIKEY) {
        return new Response("", {status: 401});
    }
    const SCALAR_E7 = 0.0000001;
    let new_cods: { lat: number, lon: number, dt: DateTime; }[] = [];
    let len = 0;
    let trimmed = 0;
    let res = "";
    for (let cord of cords) {
        let dt = DateTime.fromISO(cord.timestamp).setZone("Asia/Tokyo");
        len += 1;
        if (dt.hour < 8 || dt.hour >= 22 ){
            continue;
        }
        trimmed += 1;
        let lat = (cord.latitudeE7 ?? 0) * SCALAR_E7;
        let lon = (cord.longitudeE7 ?? 0) * SCALAR_E7;

        if (lat > 180) lat = lat - (2 ** 32) * SCALAR_E7;
        if (lon > 180) lon = lon - (2 ** 32) * SCALAR_E7;

        if (!isNaN(lat) && !isNaN(lon)) {
            new_cods.push({lat, lon, dt});
        }
        dt.toUTC().toString()
        res = res.concat(`INSERT INTO location VALUES (${lat},${lon},"${dt.toUTC().toString()}");\n`)
    }
    return Response.json(new_cods);
}
