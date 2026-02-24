// All API calls for the Staff / Users feature.
// Uses the shared axios instance from @/api which handles:
// - base URL
// - Authorization header (Bearer token)

import api from "@/api";

const USERS_ENDPOINT = "/api/users";

// =====================
// Staff CRUD
// =====================

export async function getUsers() {
  const response = await api.get(USERS_ENDPOINT);
  return response.data;
}

export async function createUser(data) {
  const response = await api.post(USERS_ENDPOINT, data);
  return response.data;
}

export async function updateUser(id, data) {
  const response = await api.patch(`${USERS_ENDPOINT}/${id}`, data);
  return response.data;
}

export async function deleteUser(id) {
  const response = await api.delete(`${USERS_ENDPOINT}/${id}`);
  return response.data;
}

// =====================
// Logged-in user actions
// =====================

export async function changePassword({ oldPassword, newPassword }) {
  const response = await api.post(`${USERS_ENDPOINT}/change-password`, { oldPassword, newPassword });
  return response.data;
}

export async function getMe() {
  const response = await api.get(`${USERS_ENDPOINT}/me`);
  return response.data;
}

export async function updateMyActiveStatus(isActive) {
  const response = await api.patch(`${USERS_ENDPOINT}/me/active`, { isActive });
  return response.data;
}

export async function updateProfileImage(file) {
  const formData = new FormData();
  formData.append("image", file);

  const response = await api.patch(`${USERS_ENDPOINT}/profile-image`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
}

export async function deleteProfileImage() {
  const response = await api.delete(`${USERS_ENDPOINT}/profile-image`);
  return response.data;
}

