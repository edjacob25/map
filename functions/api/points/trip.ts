interface Env {
  APIKEY: string;
  LOC_DB: D1Database;
}

export const onRequestGet: PagesFunction<Env> = async (ctx) => {
  let apikey = ctx.request.headers.get("apikey");
  if (apikey != ctx.env.APIKEY) {
    return new Response("", { status: 401 });
  }
  const { searchParams } = new URL(ctx.request.url);
  let name = searchParams.get("name");
  let cols: D1PreparedStatement;
  if (name === "march") {
    cols = ctx.env.LOC_DB.prepare("SELECT lat, lon, date FROM location WHERE date(date_jp) < date('2023-06-01')");
  } else if (name == "fall") {
    cols = ctx.env.LOC_DB.prepare("SELECT lat, lon, date FROM location WHERE date(date_jp) > date('2023-06-01')");
  } else {
    return new Response("", { status: 400 });
  }

  let data = await cols.all();
  if (data.success) {
    return Response.json(data.results);
  }
  return Response.json("");
};
