// Turns a free-form description (text and/or a photo of a recipe) into a structured recipe.
// Env vars (Netlify → Project configuration → Environment variables):
//   ANTHROPIC_API_KEY  – Claude API key
//   APP_ACCESS_CODE    – shared code the app must send, so strangers can't spend the API budget
import Anthropic from "@anthropic-ai/sdk";

export const config = { path: "/api/parse-recipe" };

const CATEGORY_IDS = ["chicken", "pork", "beef", "pasta", "fish", "rice", "bread", "pizza", "dessert",
  "sauce", "salad", "meze", "veggie", "eggs", "drinks", "other"];

const SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    title: { type: "string" },
    ingredients: { type: "array", items: { type: "string" } },
    steps: { type: "array", items: { type: "string" } },
    notes: { type: "string" },
    categories: { type: "array", items: { type: "string", enum: CATEGORY_IDS } },
    time: { type: "string" },
    servings: { type: "string" },
  },
  required: ["title", "ingredients", "steps", "notes", "categories", "time", "servings"],
};

const SYSTEM = `You turn a cook's informal description of a dish into a clean, well-structured recipe for a personal recipe app.

Write the recipe in the language the user writes in (usually Bulgarian). Keep the cook's own method, quantities and tips; do not invent a different dish. Where the description is vague, fill gaps with sensible, typical amounts and times, and keep them modest rather than precise-sounding.

- title: short, appetising dish name.
- ingredients: one item per string, quantity first ("500 г пилешко филе"). For groups, add a heading item starting with "## " (e.g. "## За соса").
- steps: each string is one clear step in imperative mood, in cooking order. Mention appliance settings (Instant Pot mode, minutes, pressure release, oven °C) when given.
- notes: the cook's tips, variations or serving ideas; empty string if none.
- categories: 1–3 ids that fit the dish best.
- time: total time like "45 мин" or "1 ч 20 мин"; servings: like "4". Empty string if truly unknown.

If an image is attached, it is a photo or screenshot of a recipe or a dish: read the recipe from it (translate into the user's language if needed).`;

const json = (status, body) => new Response(JSON.stringify(body), {
  status, headers: { "content-type": "application/json; charset=utf-8" },
});

export default async (req) => {
  if (req.method !== "POST") return json(405, { error: "method_not_allowed" });
  const code = process.env.APP_ACCESS_CODE;
  if (!process.env.ANTHROPIC_API_KEY || !code) return json(503, { error: "not_configured" });
  if (req.headers.get("x-access-code") !== code) return json(401, { error: "bad_access_code" });

  let body;
  try { body = await req.json(); } catch { return json(400, { error: "bad_json" }); }
  const text = String(body.text || "").slice(0, 8000);
  const image = body.image; // { media_type, data(base64) } – optional
  if (!text.trim() && !image) return json(400, { error: "empty" });

  const content = [];
  if (image && image.data && /^image\/(jpeg|png|webp|gif)$/.test(image.media_type)) {
    content.push({ type: "image", source: { type: "base64", media_type: image.media_type, data: image.data } });
  }
  content.push({ type: "text", text: text.trim() || "Извади рецептата от снимката." });

  // Stream the response to stay within Netlify's 60 s limit for streaming functions;
  // spaces keep the connection alive and are ignored by JSON.parse on the client.
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const keepAlive = setInterval(() => controller.enqueue(encoder.encode(" ")), 2000);
      const finish = (obj) => {
        clearInterval(keepAlive);
        controller.enqueue(encoder.encode(JSON.stringify(obj)));
        controller.close();
      };
      try {
        const client = new Anthropic();
        const message = await client.beta.messages.stream({
          model: "claude-opus-5-5",
          max_tokens: 16000,
          betas: ["server-side-fallback-2026-07-01"],
          fallbacks: "default",
          system: SYSTEM,
          output_config: { effort: "low", format: { type: "json_schema", schema: SCHEMA } },
          messages: [{ role: "user", content }],
        }).finalMessage();

        if (message.stop_reason === "refusal") return finish({ error: "refusal" });
        if (message.stop_reason === "max_tokens") return finish({ error: "too_long" });
        const out = message.content.find((b) => b.type === "text");
        finish({ recipe: JSON.parse(out.text) });
      } catch (err) {
        if (err instanceof Anthropic.AuthenticationError) finish({ error: "bad_api_key" });
        else if (err instanceof Anthropic.RateLimitError) finish({ error: "rate_limited" });
        else if (err instanceof Anthropic.APIError) finish({ error: "api_error", status: err.status });
        else if (err instanceof SyntaxError) finish({ error: "bad_model_output" });
        else finish({ error: "server_error" });
      }
    },
  });
  return new Response(stream, { headers: { "content-type": "application/json; charset=utf-8" } });
};
