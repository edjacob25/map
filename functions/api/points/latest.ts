interface Env {
  APIKEY: string;
  LOC_DB: D1Database;
}

export const onRequest: PagesFunction<Env> = async (ctx) => {
  let apikey = ctx.request.headers.get("apikey");
  if (apikey != ctx.env.APIKEY) {
    return new Response("", { status: 401 });
  }
  let stmt = ctx.env.LOC_DB.prepare("SELECT lat, lon, date FROM location ORDER BY date_jp DESC LIMIT 1");
  let data = await stmt.first();
  if (data !== null) {
    return Response.json(data);
  }
  return Response.json("");
};
