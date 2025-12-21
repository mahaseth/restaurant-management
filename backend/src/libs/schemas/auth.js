import z from "zod";
import { userSchema } from "./user.js";
import { addressSchema } from "./address.js";

const loginSchema = z.object({
  email: z.email({error: "email is required"}),
  password: z.string({error: "password is required"}),
});

const registerSchema = z.object({
    restaurant: z.object({
        name: z.string({error: "Restaurant name is required"}),
        address: addressSchema
    }),
    owner: userSchema
});

export { loginSchema, registerSchema };