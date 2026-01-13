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
  const trip: {
    name: string;
    start_date: string;
    end_date: string;
  } = await ctx.env.LOC_DB.prepare("SELECT * FROM trip WHERE name = ?").bind(name).first();

  if (trip == null) {
    return new Response("", { status: 404 });
  }

  let cols = ctx.env.LOC_DB.prepare(
    "SELECT lat, lon, date FROM location WHERE date(date_jp) > date(?) AND date(date_jp) < date(?)",
  ).bind(trip.start_date, trip.end_date);

  let data = await cols.all();
  if (data.success) {
    return Response.json(data.results);
  }
  return Response.json("");
};
