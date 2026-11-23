import { ageOn, checkPassword, checkSignUp, isOldEnough, toIsoDate } from '../accountRules';

const today = new Date(2026, 10, 23); // 23 November 2026
const valid = {
  email: 'lou@example.fr',
  username: 'Lou_42',
  password: 'une phrase assez longue',
  birth: { day: '5', month: '3', year: '2000' },
};

describe('birth date', () => {
  it('builds an ISO date only from a real calendar date', () => {
    expect(toIsoDate({ day: '5', month: '3', year: '2000' })).toBe('2000-03-05');
    expect(toIsoDate({ day: '29', month: '2', year: '2024' })).toBe('2024-02-29');
    expect(toIsoDate({ day: '29', month: '2', year: '2023' })).toBeNull();
    expect(toIsoDate({ day: '31', month: '4', year: '2000' })).toBeNull();
    expect(toIsoDate({ day: 'aa', month: '1', year: '2000' })).toBeNull();
    expect(toIsoDate({ day: '1', month: '1', year: '99' })).toBeNull();
  });

  it('counts full years, birthday included', () => {
    expect(ageOn('2011-11-23', today)).toBe(15);
    expect(ageOn('2011-11-24', today)).toBe(14);
    expect(ageOn('2011-12-01', today)).toBe(14);
    expect(isOldEnough('2011-11-23', today)).toBe(true);
    expect(isOldEnough('2011-11-24', today)).toBe(false);
    expect(isOldEnough('1990-01-01')).toBe(true);
  });
});

describe('password', () => {
  it('asks for 12 to 128 characters, nothing else', () => {
    expect(checkPassword('a'.repeat(11))).toBe('Au moins 12 caractères.');
    expect(checkPassword('a'.repeat(12))).toBeNull();
    expect(checkPassword('a'.repeat(129))).toBe('Au plus 128 caractères.');
  });
});

describe('sign-up form', () => {
  it('accepts a valid form', () => {
    expect(checkSignUp(valid, today)).toEqual({});
  });

  it('explains each invalid field in French', () => {
    const errors = checkSignUp(
      {
        email: 'pas-un-email',
        username: 'a b',
        password: 'court',
        birth: { day: '24', month: '11', year: '2011' },
      },
      today,
    );
    expect(errors.email).toMatch(/adresse e-mail/);
    expect(errors.username).toMatch(/3 à 20 caractères/);
    expect(errors.password).toBe('Au moins 12 caractères.');
    expect(errors.birth).toBe('Il faut avoir au moins 15 ans pour créer un compte.');
  });

  it('rejects impossible birth dates', () => {
    expect(
      checkSignUp({ ...valid, birth: { day: '1', month: '1', year: '1800' } }, today).birth,
    ).toMatch(/ne semble pas valide/);
    expect(
      checkSignUp({ ...valid, birth: { day: '1', month: '1', year: '2030' } }, today).birth,
    ).toMatch(/ne semble pas valide/);
    expect(checkSignUp({ ...valid, birth: { day: '', month: '', year: '' } }, today).birth).toMatch(
      /ne semble pas valide/,
    );
  });
});
