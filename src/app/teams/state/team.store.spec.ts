import { describe, expect, it, vi } from 'vitest';
import { Team } from '../../models/pokemon.model';
import { TeamApiService } from '../../services/team-api.service';
import { TeamStore } from './team.store';

describe('TeamStore', () => {
  it('rolls back optimistic updates when the create mutation fails', async () => {
    const api = {
      fetchTeams: vi.fn().mockResolvedValue([]),
      createTeam: vi.fn().mockRejectedValue(new Error('Request failed')),
      deleteTeam: vi.fn().mockResolvedValue(1),
    } as unknown as TeamApiService;

    const store = new TeamStore(api);
    store['teamsSubject'].next([{ id: 7, name: 'Existing', trainer_id: 1, pokemon_ids: [1], created_at: '2024-01-01' }]);

    await expect(store.createTeam({ name: 'New Team', trainer_id: 1, pokemon_ids: [2, 3] })).rejects.toThrow('Request failed');
    expect(store['teamsSubject'].value).toEqual([{ id: 7, name: 'Existing', trainer_id: 1, pokemon_ids: [1], created_at: '2024-01-01' }]);
  });

  it('detects duplicate team names using the current team list', () => {
    const api = {
      fetchTeams: vi.fn().mockResolvedValue([]),
      createTeam: vi.fn().mockResolvedValue({} as Team),
      deleteTeam: vi.fn().mockResolvedValue(1),
    } as unknown as TeamApiService;

    const store = new TeamStore(api);
    store['teamsSubject'].next([{ id: 7, name: 'Alpha Squad', trainer_id: 1, pokemon_ids: [1], created_at: '2024-01-01' }]);

    expect(store.hasTeamName('alpha squad')).toBe(true);
    expect(store.hasTeamName('beta squad')).toBe(false);
  });
});
