import config from "@/config/config";
import axios from "axios";

export async function login({ email, password }) {
  const response = await axios.post(`${config.apiUrl}/api/auth/login`, {
    email,
    password,
  });

  return response.data;
}

export async function signUp({
  city,
  province,
  street,
  country,
  restaurantName,
  ownerName,
  email,
  phone,
  password,
}) {
  const response = await axios.post(`${config.apiUrl}/api/auth/register`, {
    restaurant: {
      name: restaurantName,
      address: {
        city,
        province,
        street,
        country,
      },
    },
    owner: {
      name: ownerName,
      email,
      password,
      phone,
    },
  });

  return response.data;
}
