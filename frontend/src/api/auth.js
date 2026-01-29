import config from "@/config/config";
import axios from "axios";

export async function login({ email, password }) {
  const response = await axios.post(`${config.apiUrl}/api/auth/login`, {
    email,
    password,
  });

  return response.data;
}

export async function signUp({ city, province, name, email, phone, password }) {
  const response = await axios.post(`${config.apiUrl}/api/auth/register`, {
    name,
    email,
    phone,
    password,
    address: {
      city,
      province,
    },
  });

  return response.data;
}
