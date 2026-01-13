interface Env {
  APIKEY: string;
  LOC_DB: D1Database;
}

export const onRequestGet: PagesFunction<Env> = async (ctx) => {
  let apikey = ctx.request.headers.get("apikey");
  if (apikey != ctx.env.APIKEY) {
    return new Response("", { status: 401 });
  }
  const trips = await ctx.env.LOC_DB.prepare("SELECT * FROM trip").all();
  return Response.json(trips.results);
};
