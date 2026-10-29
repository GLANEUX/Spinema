/**
 * Pure logic of the slot machine: pool filtering, age limit, sampling and vote resolution.
 * Used by the API (salon sessions) and by the app (local draw in the personal space).
 */

export const CERTIFICATIONS = ['TP', '10', '12', '16', '18'] as const;
export type Certification = (typeof CERTIFICATIONS)[number];

/** Minimum age for each French certification. `null` = not rated. */
const MIN_AGE: Record<Certification, number> = { TP: 0, '10': 10, '12': 12, '16': 16, '18': 18 };

export interface DrawFilm {
  tmdbId: number;
  certification: Certification | null;
  runtime: number;
  genres: number[];
  /** User ids who have already watched this film. */
  seenBy: string[];
}

export interface DrawMember {
  userId: string;
  age: number;
}

export interface DrawOptions {
  /** Certifications ticked on the remote. */
  certifications: readonly Certification[];
  /** Maximum runtime in minutes, `null` for no limit. */
  maxRuntime: number | null;
  /** Genre ids to keep, empty for all. */
  genres: readonly number[];
  /** Members whose already-seen films stay in the pool. */
  includeSeenBy: readonly string[];
  /** Films vetoed earlier in the session. */
  excluded: readonly number[];
}

/** Age of the youngest present member: the certification limit for everyone. */
export function youngestAge(members: readonly DrawMember[]): number {
  if (members.length === 0) throw new Error('A draw needs at least one member');
  return Math.min(...members.map((m) => m.age));
}

/** Certifications a group may pick, given the youngest present member. */
export function allowedCertifications(age: number): Certification[] {
  return CERTIFICATIONS.filter((c) => age >= MIN_AGE[c]);
}

export function filterPool(
  films: readonly DrawFilm[],
  members: readonly DrawMember[],
  options: DrawOptions,
): DrawFilm[] {
  const age = youngestAge(members);
  const allowed = new Set(
    allowedCertifications(age).filter((c) => options.certifications.includes(c)),
  );
  const hasMinor = age < 18;
  const presentIds = members.map((m) => m.userId);
  return films.filter((film) => {
    if (film.certification === null ? hasMinor : !allowed.has(film.certification)) return false;
    if (options.maxRuntime !== null && film.runtime > options.maxRuntime) return false;
    if (options.genres.length > 0 && !film.genres.some((g) => options.genres.includes(g)))
      return false;
    if (options.excluded.includes(film.tmdbId)) return false;
    return !film.seenBy.some(
      (id) => presentIds.includes(id) && !options.includeSeenBy.includes(id),
    );
  });
}

/** Random integer in [0, max). The API passes `crypto.randomInt`, tests pass a seeded generator. */
export type RandomInt = (max: number) => number;

export const MIN_POOL_SIZE = 2;

export interface Spin {
  winner: DrawFilm;
  /** Films shown on the reel, in order; the winner sits at `winnerIndex`. */
  reel: DrawFilm[];
  winnerIndex: number;
}

/**
 * Picks the winner, then a shuffled reel of `reelSize` films that ends a few
 * slots after the winner so the animation can slow down onto it.
 */
export function spin(pool: readonly DrawFilm[], random: RandomInt, reelSize = 32): Spin {
  if (pool.length < MIN_POOL_SIZE) throw new Error(`A draw needs at least ${MIN_POOL_SIZE} films`);
  const winner = pool[random(pool.length)]!;
  const winnerIndex = Math.max(0, reelSize - 4);
  const reel = Array.from({ length: reelSize }, (_, i) =>
    i === winnerIndex ? winner : pool[random(pool.length)]!,
  );
  return { winner, reel, winnerIndex };
}

export type Vote = 'ok' | 'veto';

export interface VoteRound {
  /** Members present when the film was drawn. */
  present: readonly string[];
  votes: Readonly<Record<string, Vote>>;
  vetosLeft: Readonly<Record<string, number>>;
}

export type VoteResult =
  | { status: 'pending' }
  | { status: 'accepted'; vetosLeft: Record<string, number> }
  | { status: 'vetoed'; refunded: boolean; vetosLeft: Record<string, number> };

/** Nobody has a veto left: the next film goes straight to the VCR. */
export function isImposed(
  present: readonly string[],
  vetosLeft: Readonly<Record<string, number>>,
): boolean {
  return present.every((id) => (vetosLeft[id] ?? 0) === 0);
}

/**
 * One veto is enough to discard the film. When every present member vetoes
 * (two or more people), the film is discarded and everyone gets their veto back.
 */
export function resolveVotes(round: VoteRound): VoteResult {
  const { present, votes } = round;
  if (!present.every((id) => votes[id])) return { status: 'pending' };
  const vetosLeft = { ...round.vetosLeft };
  const vetoers = present.filter((id) => votes[id] === 'veto');
  if (vetoers.length === 0) return { status: 'accepted', vetosLeft };
  const refunded = present.length >= 2 && vetoers.length === present.length;
  if (!refunded) for (const id of vetoers) vetosLeft[id] = Math.max(0, (vetosLeft[id] ?? 0) - 1);
  return { status: 'vetoed', refunded, vetosLeft };
}

/** Votes missing when the voting time runs out count as OK. */
export function fillMissingVotes(
  present: readonly string[],
  votes: Readonly<Record<string, Vote>>,
): Record<string, Vote> {
  return Object.fromEntries(present.map((id) => [id, votes[id] ?? 'ok']));
}
