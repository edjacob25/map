import {DateTime} from "luxon";
import cords from "./minimun.json";

interface Env {
    APIKEY: string;
}

export const onRequest: PagesFunction<Env> = async (ctx) => {

    let apikey = ctx.request.headers.get("apikey");
    if (apikey != ctx.env.APIKEY) {
        return Response.json("");
    }
    const SCALAR_E7 = 0.0000001;
    let new_cods: { lat: number, lon: number, dt: DateTime; }[] = [];
    let day = DateTime.fromFormat(ctx.params.day as string, "yyyy-MM-dd").setZone("Asia/Tokyo");

    for (let cord of cords) {
        //console.log(cords[cord]);
        let dt = DateTime.fromISO(cord.timestamp).setZone("Asia/Tokyo");

        if (!dt.hasSame(day, "day")) {
            continue;
        }

        let lat = (cord.latitudeE7 ?? 0) * SCALAR_E7;
        let lon = (cord.longitudeE7 ?? 0) * SCALAR_E7;

        if (lat > 180) lat = lat - (2 ** 32) * SCALAR_E7;
        if (lon > 180) lon = lon - (2 ** 32) * SCALAR_E7;

        if (!isNaN(lat) && !isNaN(lon)) {
            new_cods.push({lat, lon, dt});
        }
    }
    return Response.json(new_cods);
}