import z from "zod";
import { ROLE_ADMIN, ROLE_CASHIER, ROLE_WAITER, ROLE_KITCHEN, ROLE_CUSTOMER, ROLE_OWNER, ROLE_MANAGER } from "../../constants/roles.js";


const userSchema = z.object({
  name: z.string({ error: "Name is required." }).trim(),
  email: z.string({ error: "Email is required." }).email(),
  password: z.string({ error: "Password is required." }).min(6),
  phone: z.string({ error: "Phone number is required." }).min(6).max(13),
  roles: z.array(z.enum([ROLE_ADMIN, ROLE_CASHIER, ROLE_WAITER, ROLE_KITCHEN, ROLE_CUSTOMER, ROLE_OWNER, ROLE_MANAGER])).optional(),
  profileImageUrl: z.string().optional(),
  isActive: z.boolean().optional(),
});

export { userSchema };