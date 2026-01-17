// backend/src/libs/schemas/user.js
import z from "zod";
import { ROLE_ADMIN, ROLE_CASHER, ROLE_WAITER, ROLE_KITCHEN, ROLE_CUSTOMER, ROLE_OWNER } from "../../constants/roles.js";



const userSchema = z.object({
  name: z.string({ error: "Name is required." }).trim(),
  email: z.email({ error: "Email is required." }),
  password: z.string({ error: "Password is required." }).min(6),
  phone: z.string({ error: "Phone number is required." }).min(6).max(13),
  roles: z.array(z.enum([ROLE_ADMIN, ROLE_CASHER, ROLE_WAITER, ROLE_KITCHEN, ROLE_CUSTOMER, ROLE_OWNER])).optional(),
  profileImageUrl: z.string().optional(),
  isActive: z.boolean().optional(),
});

export { userSchema };