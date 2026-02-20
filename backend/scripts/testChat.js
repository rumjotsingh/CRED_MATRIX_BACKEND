#!/usr/bin/env node
import aiService from "../services/aiService.js";

const payload = {
  messages: [
    {
      role: "user",
      content: "What skills are required for a full stack developer?",
    },
  ],
  message: "Can you suggest learning resources for MERN stack?",
  options: {
    temperature: 0.7,
    max_length: 300,
    top_p: 0.9,
    do_sample: true,
    repetition_penalty: 1.1,
  },
};

async function run() {
  try {
    console.log("Sending payload:", JSON.stringify(payload, null, 2));

    // Call chat() with the messages array (you can also pass payload.message instead)
    const reply = await aiService.chat(payload.messages, payload.options);

    console.log("\nReply from chat():");
    console.log(reply);

    if (!reply || (typeof reply === "string" && reply.trim() === "")) {
      console.warn("\nEmpty reply received from chat().");
    }
  } catch (err) {
    console.error("Error calling chat():", err);
  }
}

run();
