import { z } from 'zod';
import { CERTIFICATIONS } from './draw';

export const healthSchema = z.object({
  status: z.enum(['ok', 'degraded']),
  version: z.string(),
  database: z.enum(['up', 'down']),
});
export type Health = z.infer<typeof healthSchema>;

export const drawOptionsSchema = z.object({
  certifications: z.array(z.enum(CERTIFICATIONS)),
  maxRuntime: z.number().int().positive().nullable(),
  genres: z.array(z.number().int()),
  includeSeenBy: z.array(z.string()),
  excluded: z.array(z.number().int()),
});

export const sessionSettingsSchema = z.object({
  vetosPerMember: z.number().int().min(1).max(3),
  /** Seconds to vote, `null` = wait for everyone. */
  voteTimeout: z.union([z.literal(10), z.literal(20), z.literal(60)]).nullable(),
  draw: drawOptionsSchema,
});
export type SessionSettings = z.infer<typeof sessionSettingsSchema>;
