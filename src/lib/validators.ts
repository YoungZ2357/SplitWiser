import { z } from "zod";

export const createBillSchema = z.object({
  title: z.string().min(1).max(200),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  tax: z.number().min(0),
  tip: z.number().min(0),
  items: z.array(z.object({
    name: z.string().min(1).max(500),
    price: z.number().min(0),
    is_ai_parsed: z.boolean().optional(),
  })).min(1),
  participants: z.array(z.object({
    name: z.string().min(1).max(100),
  })).min(1),
  assignments: z.array(z.object({
    item_index: z.number().int().min(0),
    participant_index: z.number().int().min(0),
  })),
});

export const billQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sort: z.enum(["date_desc", "date_asc", "created_desc"]).default("date_desc"),
});
