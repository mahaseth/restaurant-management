import api from "@/api";

export async function login({ email, password }) {
  const response = await api.post(`/api/auth/login`, {
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
  // Backend route is `/api/auth/register-restaurant`
  const response = await api.post(`/api/auth/register-restaurant`, {
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
