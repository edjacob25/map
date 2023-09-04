import {DateTime} from "luxon";

interface Env {
    APIKEY: string;
    SAVE_APIKEY: string;
    LOC_DB: D1Database;
}

export const onRequestGet: PagesFunction<Env> = async (ctx) => {

    let apikey = ctx.request.headers.get("apikey");
    if (apikey != ctx.env.APIKEY) {
        return new Response("", {status: 401});
    }

    let cols = ctx.env.LOC_DB.prepare("SELECT lat, lon, date FROM location");
    let data = await cols.all();
    if (data.success) {
        return Response.json(data.results);
    }
    return Response.json("");
}

export const onRequestPost: PagesFunction<Env> = async (ctx) => {

    let apikey = ctx.request.headers.get("apikey");
    if (apikey != ctx.env.SAVE_APIKEY) {
        return new Response("", {status: 401});
    }

    let data: {lat: number, lon: number} = await ctx.request.json();
    let dt = DateTime.utc();
    let stmt = ctx.env.LOC_DB.prepare("INSERT INTO location VALUES (?, ?, ?, ?)").bind(data.lat, data.lon, dt.toString(), dt.setZone("Asia/Tokyo").toString());
    let res = await stmt.run();
    if (res.success) {
        return new Response();
    }
    return new Response("", {status: 400});
}
