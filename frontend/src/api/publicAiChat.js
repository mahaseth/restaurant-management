"use client";

import axios from "axios";
import config from "@/config/config";

const client = axios.create({
  baseURL: config.apiUrl,
});

export async function getPublicAgent(slug) {
  const { data } = await client.get("/api/public/ai-chat/agent", { params: { slug } });
  return data;
}

export async function getPublicConversation(slug, sessionId) {
  const { data } = await client.get("/api/public/ai-chat/conversation", {
    params: { slug, sessionId },
  });
  return data;
}

export async function sendPublicMessage(slug, sessionId, message) {
  const { data } = await client.post("/api/public/ai-chat/message", {
    slug,
    sessionId,
    message,
  });
  return data;
}
