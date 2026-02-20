#!/usr/bin/env node
import axios from "axios";
import dotenv from "dotenv";

// Load .env from backend folder if present (script may be run from repo root)
dotenv.config({ path: "backend/.env" });

const HUGGING_FACE_API_KEY = process.env.HUGGING_FACE_API_KEY;
const HF_API_URL = "https://router.huggingface.co/models";

if (!HUGGING_FACE_API_KEY) {
  console.error("HUGGING_FACE_API_KEY not set in environment.");
  process.exit(1);
}

const candidateModels = [
  "gpt2",
  "distilgpt2",
  "facebook/opt-125m",
  "google/flan-t5-small",
  "google/flan-t5-large",
  "EleutherAI/gpt-neo-125M",
  "bigscience/bloom",
  "bigscience/bloom-560m",
  "tiiuae/falcon-7b-instruct",
  "mistral/mixture",
];

const probe = async (model) => {
  try {
    const res = await axios.post(
      `${HF_API_URL}/${model}`,
      { inputs: "Hello" },
      {
        headers: { Authorization: `Bearer ${HUGGING_FACE_API_KEY}` },
        timeout: 20000,
      },
    );

    console.log(`MODEL OK: ${model} -> status ${res.status}`);
    if (res.data) {
      if (res.data.generated_text)
        console.log("  sample:", res.data.generated_text.slice(0, 200));
      else if (typeof res.data === "string")
        console.log("  sample:", res.data.slice(0, 200));
      else console.log("  data:", JSON.stringify(res.data).slice(0, 200));
    }
    return true;
  } catch (err) {
    const status = err.response?.status;
    const data = err.response?.data;
    console.warn(`MODEL FAIL: ${model} -> ${err.message} status:${status}`);
    if (data) console.warn("  response:", JSON.stringify(data).slice(0, 500));
    return false;
  }
};

(async () => {
  console.log("Probing Hugging Face models with your API key...");
  for (const model of candidateModels) {
    // eslint-disable-next-line no-await-in-loop
    await probe(model);
    console.log("---");
  }
  console.log(
    "Done. Pick a model that returned OK and set HF_CHAT_MODEL or HF_CHAT_FALLBACK to it.",
  );
})();
