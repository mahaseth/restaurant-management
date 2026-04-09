"use client";

import axios from "axios";
import config from "@/config/config";

const client = axios.create({
  baseURL: config.apiUrl,
});

const enc = (t) => encodeURIComponent(t);

export async function resolveQrSession(qrToken) {
  const { data } = await client.get(`/api/public/qr/${enc(qrToken)}/session`);
  return data;
}

export async function getTableSessionState(sessionToken) {
  const { data } = await client.get(`/api/public/table-session/${enc(sessionToken)}`);
  return data;
}

export async function getTableSessionAgent(sessionToken) {
  const { data } = await client.get(`/api/public/table-session/${enc(sessionToken)}/agent`);
  return data;
}

export async function getTableSessionConversation(sessionToken) {
  const { data } = await client.get(`/api/public/table-session/${enc(sessionToken)}/conversation`);
  return data;
}

export async function sendTableSessionChatMessage(sessionToken, message) {
  const { data } = await client.post(`/api/public/table-session/${enc(sessionToken)}/chat/message`, {
    message,
  });
  return data;
}

export async function getTableSessionCart(sessionToken) {
  const { data } = await client.get(`/api/public/table-session/${enc(sessionToken)}/cart`);
  return data;
}

export async function postTableSessionCartItem(sessionToken, payload) {
  const { data } = await client.post(`/api/public/table-session/${enc(sessionToken)}/cart/items`, payload);
  return data;
}

export async function patchTableSessionCartItem(sessionToken, menuItemId, payload) {
  const { data } = await client.patch(
    `/api/public/table-session/${enc(sessionToken)}/cart/items/${enc(menuItemId)}`,
    payload
  );
  return data;
}

export async function deleteTableSessionCartItem(sessionToken, menuItemId) {
  const { data } = await client.delete(
    `/api/public/table-session/${enc(sessionToken)}/cart/items/${enc(menuItemId)}`
  );
  return data;
}

export async function clearTableSessionCart(sessionToken) {
  const { data } = await client.delete(`/api/public/table-session/${enc(sessionToken)}/cart`);
  return data;
}

export async function getTableSessionOrderStatus(sessionToken) {
  const { data } = await client.get(`/api/public/table-session/${enc(sessionToken)}/order-status`);
  return data;
}

export async function placeTableSessionOrder(sessionToken, payload) {
  const { data } = await client.post(`/api/public/table-session/${enc(sessionToken)}/order`, payload || {});
  return data;
}
