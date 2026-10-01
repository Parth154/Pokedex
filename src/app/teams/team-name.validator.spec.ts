import { describe, expect, it } from 'vitest';
import { uniqueTeamNameValidator } from './team-name.validator';

describe('uniqueTeamNameValidator', () => {
  it('returns an error when the team name already exists', () => {
    const validator = uniqueTeamNameValidator(['Alpha Squad', 'Team Rocket']);
    const control = { value: 'alpha squad' } as any;

    const result = validator(control);

    expect(result).toEqual({ duplicateTeamName: true });
  });

  it('accepts a unique team name', () => {
    const validator = uniqueTeamNameValidator(['Alpha Squad']);
    const control = { value: 'Sky Riders' } as any;

    const result = validator(control);

    expect(result).toBeNull();
  });
});
