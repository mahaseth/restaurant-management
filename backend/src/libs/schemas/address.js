import z from "zod";

const addressSchema = z.object({
  city: z.string({ error: "Address city is required." }),
  province: z.string({ error: "Address province is required." }),
  street: z.string().optional(),
  country: z.string().optional(),
});

export  {addressSchema};