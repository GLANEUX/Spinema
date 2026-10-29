import { healthSchema, type Health } from '@spinema/shared';

/** API base URL, set at build time (see .env.example). */
export const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://10.0.2.2:3000';

export async function fetchHealth(signal?: AbortSignal): Promise<Health> {
  const res = await fetch(`${API_URL}/health`, { signal });
  return healthSchema.parse(await res.json());
}
