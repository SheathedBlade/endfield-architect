import { z } from "zod";

export const GoalSchema = z.object({
  item: z.string(),
  ratePerMin: z.number().positive(),
});

export type Goal = z.infer<typeof GoalSchema>;
