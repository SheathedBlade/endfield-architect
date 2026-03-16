import * as z from "zod";

export const ItemStackSchema = z.object({
  item: z.string(),
  quantity: z.number().positive(),
});

export const RecipeSchema = z.object({
  id: z.string(),
});
