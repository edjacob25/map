interface Env {
  APIKEY: string;
}

export const onRequest: PagesFunction<Env> = async (ctx) => {
  let apikey = ctx.request.headers.get("apikey");
  if (apikey != ctx.env.APIKEY) {
    return new Response("", { status: 401 });
  }
  return new Response("", { status: 200 });
};
