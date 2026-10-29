import { describe, expect, it } from 'vitest';
import {
  allowedCertifications,
  fillMissingVotes,
  filterPool,
  isImposed,
  resolveVotes,
  spin,
  youngestAge,
  type DrawFilm,
  type DrawOptions,
} from './draw';
import { sessionSettingsSchema } from './schemas';

const film = (tmdbId: number, over: Partial<DrawFilm> = {}): DrawFilm => ({
  tmdbId,
  certification: 'TP',
  runtime: 100,
  genres: [16],
  seenBy: [],
  ...over,
});
const adults = [
  { userId: 'oce', age: 27 },
  { userId: 'sam', age: 31 },
];
const withLou = [...adults, { userId: 'lou', age: 15 }];
const all: DrawOptions = {
  certifications: ['TP', '10', '12', '16', '18'],
  maxRuntime: null,
  genres: [],
  includeSeenBy: [],
  excluded: [],
};
const ids = (films: DrawFilm[]) => films.map((f) => f.tmdbId);

describe('age limit', () => {
  it('uses the youngest present member', () => {
    expect(youngestAge(withLou)).toBe(15);
  });
  it('refuses an empty group', () => {
    expect(() => youngestAge([])).toThrow();
  });
  it('lists the certifications allowed at a given age', () => {
    expect(allowedCertifications(15)).toEqual(['TP', '10', '12']);
    expect(allowedCertifications(8)).toEqual(['TP']);
    expect(allowedCertifications(18)).toEqual(['TP', '10', '12', '16', '18']);
  });
});

describe('filterPool', () => {
  const films = [
    film(1),
    film(2, { certification: '16' }),
    film(3, { certification: null }),
    film(4, { runtime: 150 }),
    film(5, { genres: [27] }),
    film(6, { seenBy: ['sam'] }),
    film(7, { seenBy: ['alex'] }),
  ];

  it('keeps everything an adult group allows', () => {
    expect(ids(filterPool(films, adults, all))).toEqual([1, 2, 3, 4, 5, 7]);
  });
  it('drops films above the youngest age and unrated films when a minor is present', () => {
    expect(ids(filterPool(films, withLou, all))).toEqual([1, 4, 5, 7]);
  });
  it('respects the certifications ticked on the remote', () => {
    expect(ids(filterPool(films, adults, { ...all, certifications: ['16'] }))).toEqual([2, 3]);
  });
  it('applies runtime, genre and session exclusions', () => {
    expect(
      ids(filterPool(films, adults, { ...all, maxRuntime: 120, genres: [16], excluded: [1] })),
    ).toEqual([2, 3, 7]);
  });
  it('keeps films seen by members whose seen films are included', () => {
    expect(ids(filterPool(films, adults, { ...all, includeSeenBy: ['sam'] }))).toContain(6);
  });
});

describe('spin', () => {
  const pool = [film(1), film(2), film(3)];
  let n = 0;
  const cycle = (max: number) => n++ % max;

  it('puts the winner at the end of the reel', () => {
    n = 1;
    const result = spin(pool, cycle, 10);
    expect(result.winner.tmdbId).toBe(2);
    expect(result.winnerIndex).toBe(6);
    expect(result.reel).toHaveLength(10);
    expect(result.reel[6]).toBe(result.winner);
  });
  it('handles a reel shorter than the lead-out', () => {
    expect(spin(pool, () => 0, 2).winnerIndex).toBe(0);
  });
  it('needs at least two films', () => {
    expect(() => spin([film(1)], () => 0)).toThrow();
  });
});

describe('votes', () => {
  const present = ['oce', 'lou', 'sam'];
  const vetosLeft = { oce: 2, lou: 1, sam: 2 };

  it('waits for every present member', () => {
    expect(resolveVotes({ present, votes: { oce: 'ok' }, vetosLeft })).toEqual({
      status: 'pending',
    });
  });
  it('accepts when everyone says OK', () => {
    expect(
      resolveVotes({ present, votes: { oce: 'ok', lou: 'ok', sam: 'ok' }, vetosLeft }),
    ).toEqual({
      status: 'accepted',
      vetosLeft,
    });
  });
  it('discards the film on a single veto and spends it', () => {
    expect(
      resolveVotes({ present, votes: { oce: 'ok', lou: 'veto', sam: 'ok' }, vetosLeft }),
    ).toEqual({
      status: 'vetoed',
      refunded: false,
      vetosLeft: { oce: 2, lou: 0, sam: 2 },
    });
  });
  it('refunds everyone on a unanimous veto, from two people', () => {
    const duo = ['oce', 'sam'];
    expect(
      resolveVotes({ present: duo, votes: { oce: 'veto', sam: 'veto' }, vetosLeft }),
    ).toMatchObject({
      status: 'vetoed',
      refunded: true,
      vetosLeft,
    });
  });
  it('spends the veto of someone voting alone', () => {
    expect(resolveVotes({ present: ['oce'], votes: { oce: 'veto' }, vetosLeft: {} })).toEqual({
      status: 'vetoed',
      refunded: false,
      vetosLeft: { oce: 0 },
    });
  });
  it('detects when the machine has spoken', () => {
    expect(isImposed(present, { oce: 0, lou: 0, sam: 0 })).toBe(true);
    expect(isImposed(present, { oce: 0, lou: 1 })).toBe(false);
    expect(isImposed(['x'], {})).toBe(true);
  });
  it('counts missing votes as OK when time runs out', () => {
    expect(fillMissingVotes(present, { lou: 'veto' })).toEqual({
      oce: 'ok',
      lou: 'veto',
      sam: 'ok',
    });
  });
});

describe('session settings', () => {
  it('validates what the remote sends', () => {
    const ok = sessionSettingsSchema.safeParse({ vetosPerMember: 2, voteTimeout: 20, draw: all });
    const bad = sessionSettingsSchema.safeParse({ vetosPerMember: 5, voteTimeout: 15, draw: all });
    expect(ok.success).toBe(true);
    expect(bad.success).toBe(false);
  });
});
