import { Injectable } from '@angular/core';
import { BehaviorSubject, distinctUntilChanged, shareReplay } from 'rxjs';
import { Team } from '../../models/pokemon.model';
import { TeamApiService } from '../../services/team-api.service';

@Injectable({ providedIn: 'root' })
export class TeamStore {
  private readonly teamsSubject = new BehaviorSubject<Team[]>([]);
  private readonly loadingSubject = new BehaviorSubject(false);
  private readonly errorSubject = new BehaviorSubject<string | null>(null);

  readonly teams$ = this.teamsSubject.asObservable().pipe(shareReplay(1));
  readonly loading$ = this.loadingSubject.asObservable().pipe(distinctUntilChanged(), shareReplay(1));
  readonly error$ = this.errorSubject.asObservable().pipe(distinctUntilChanged(), shareReplay(1));

  constructor(private readonly teamApiService: TeamApiService) {}

  async loadTeams(): Promise<void> {
    this.loadingSubject.next(true);
    this.errorSubject.next(null);

    try {
      const teams = await this.teamApiService.fetchTeams();
      this.teamsSubject.next(teams);
    } catch (error) {
      this.errorSubject.next(error instanceof Error ? error.message : 'Unable to load teams.');
    } finally {
      this.loadingSubject.next(false);
    }
  }

  hasTeamName(name: string): boolean {
    const normalized = name.trim().toLowerCase();
    return this.teamsSubject.value.some((team) => team.name.trim().toLowerCase() === normalized);
  }

  async createTeam(team: Omit<Team, 'id' | 'created_at'> & { created_at?: string }): Promise<Team> {
    const previousTeams = [...this.teamsSubject.value];
    const optimisticTeam: Team = {
      id: Date.now(),
      name: team.name,
      trainer_id: team.trainer_id,
      pokemon_ids: [...team.pokemon_ids],
      created_at: team.created_at ?? new Date().toISOString(),
    };

    this.teamsSubject.next([optimisticTeam, ...previousTeams]);
    this.errorSubject.next(null);

    try {
      const created = await this.teamApiService.createTeam(team);
      this.teamsSubject.next([created, ...previousTeams]);
      return created;
    } catch (error) {
      this.teamsSubject.next(previousTeams);
      const message = error instanceof Error ? error.message : 'Unable to create team.';
      this.errorSubject.next(message);
      throw new Error(message);
    }
  }

  async deleteTeam(teamId: number): Promise<void> {
    const previousTeams = [...this.teamsSubject.value];
    this.teamsSubject.next(previousTeams.filter((team) => team.id !== teamId));
    this.errorSubject.next(null);

    try {
      await this.teamApiService.deleteTeam(teamId);
    } catch (error) {
      this.teamsSubject.next(previousTeams);
      const message = error instanceof Error ? error.message : 'Unable to delete team.';
      this.errorSubject.next(message);
      throw new Error(message);
    }
  }
}
