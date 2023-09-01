import {DateTime} from "luxon";

interface Env {
    APIKEY: string;
    LOC_DB: D1Database;
}

export const onRequest: PagesFunction<Env> = async (ctx) => {

    let apikey = ctx.request.headers.get("apikey");
    if (apikey != ctx.env.APIKEY) {
        return new Response("", {status: 401});
    }
    let day = DateTime.fromFormat(ctx.params.day as string, "yyyy-MM-dd").setZone("Asia/Tokyo");
    let cols = ctx.env.LOC_DB.prepare("SELECT lat, lon, date FROM location WHERE date_jp LIKE ?").bind(`${ctx.params.day}%`);
    let data: D1Result<Record<string,string>> = await cols.all();
    if (data.success) {
        return Response.json(data.results);
    }
    return Response.json("");
}