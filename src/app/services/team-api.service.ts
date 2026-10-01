import { Injectable } from '@angular/core';
import { Team } from '../models/pokemon.model';

@Injectable({ providedIn: 'root' })
export class TeamApiService {
  private readonly endpoint = 'http://localhost:4000';

  async fetchTeams(): Promise<Team[]> {
    const query = `
      query {
        allTeams {
          id
          name
          trainer_id
          pokemon_ids
          created_at
        }
      }
    `;

    const response = await this.fetchGraphql<{ allTeams: Team[] }>({ query });
    return response.allTeams;
  }

  async createTeam(team: Omit<Team, 'id' | 'created_at'> & { created_at?: string }): Promise<Team> {
    const createdAt = team.created_at ?? new Date().toISOString();
    const query = `
      mutation {
        createTeam(
          name: "${team.name}",
          trainer_id: ${team.trainer_id},
          pokemon_ids: [${team.pokemon_ids.join(', ')}],
          created_at: "${createdAt}"
        ) {
          id
          name
          trainer_id
          pokemon_ids
          created_at
        }
      }
    `;

    const response = await this.fetchGraphql<{ createTeam: Team }>({ query });
    return response.createTeam;
  }

  async deleteTeam(id: number): Promise<number> {
    const query = `
      mutation {
        deleteTeam(id: ${id}) {
          id
        }
      }
    `;

    const response = await this.fetchGraphql<{ deleteTeam: { id: number } }>({ query });
    return response.deleteTeam.id;
  }

  private async fetchGraphql<T>(payload: Record<string, unknown>): Promise<T> {
    let lastError: unknown;

    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        const response = await fetch(this.endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`);
        }

        const json = (await response.json()) as { data?: T; errors?: Array<{ message: string }> };

        if (json.errors?.length) {
          throw new Error(json.errors.map((error) => error.message).join(', '));
        }

        if (!json.data) {
          throw new Error('Missing response data');
        }

        return json.data;
      } catch (error) {
        lastError = error;
        if (attempt < 2) {
          await this.delay(400 * (attempt + 1));
        }
      }
    }

    throw lastError instanceof Error ? lastError : new Error('Team request failed');
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
