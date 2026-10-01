import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import {
  AbstractControl,
  AsyncValidatorFn,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { map, of, switchMap, timer } from 'rxjs';
import { Pokemon } from '../models/pokemon.model';
import { PokemonApiService } from '../services/pokemon-api.service';
import { PokemonStore } from '../pokedex/state/pokemon.store';
import { TeamStore } from './state/team.store';

@Component({
  selector: 'app-team-builder',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './team-builder.component.html',
  styleUrl: './team-builder.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TeamBuilderComponent {
  private readonly pokemonStore = inject(PokemonStore);
  private readonly teamStore = inject(TeamStore);
  private readonly pokemonApiService = inject(PokemonApiService);
  private readonly destroyRef = inject(DestroyRef);

  readonly searchTerm = signal('');
  readonly suggestionError = signal<string | null>(null);
  readonly suggestionLoading = signal(false);
  readonly selectedIds = signal<number[]>([]);

  readonly cachedPokemon = toSignal(this.pokemonStore.pokemons$, { initialValue: [] as Pokemon[] });

  readonly teamForm = new FormGroup({
    name: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(3), Validators.maxLength(30)],
      asyncValidators: [this.uniqueTeamNameValidator()],
      updateOn: 'blur',
    }),
    pokemonIds: new FormControl<number[]>([], {
      nonNullable: true,
      validators: [this.validatePokemonSelection],
    }),
  });

  readonly pokemonList = this.pokemonStore.pokemons$;

  readonly availableSuggestions = computed(() => {
    const query = this.searchTerm().trim().toLowerCase();

    if (!query) {
      return [];
    }

    const allPokemon = this.cachedPokemon();
    return allPokemon
      .filter((pokemon) => pokemon.name.toLowerCase().includes(query) || pokemon.types.some((type) => type.toLowerCase().includes(query)))
      .slice(0, 8);
  });

  readonly selectedPokemon = computed(() => {
    const selectedIds = this.selectedIds();
    const available = this.cachedPokemon();
    return available.filter((pokemon) => selectedIds.includes(pokemon.id));
  });

  readonly teamError = toSignal(this.teamStore.error$, { initialValue: null as string | null });

  constructor() {
    effect(() => {
      const ids = this.selectedIds();
      this.teamForm.controls.pokemonIds.setValue(ids, { emitEvent: false });
    });

    effect(() => {
      this.teamStore.loadTeams().catch(() => undefined);
    });
  }

  async onSubmit(): Promise<void> {
    if (this.teamForm.invalid) {
      this.teamForm.markAllAsTouched();
      return;
    }

    const name = this.teamForm.controls.name.value.trim();
    const pokemonIds = this.selectedIds();

    try {
      await this.teamStore.createTeam({
        name,
        trainer_id: 1,
        pokemon_ids: pokemonIds,
      });
      this.teamForm.reset({ name: '', pokemonIds: [] });
      this.selectedIds.set([]);
      this.searchTerm.set('');
      this.suggestionError.set(null);
    } catch {
      this.teamForm.setErrors({ submitFailed: true });
    }
  }

  async onSuggestionQueryChange(value: string): Promise<void> {
    const normalized = value.trim();
    this.searchTerm.set(value);

    if (!normalized) {
      this.suggestionError.set(null);
      this.suggestionLoading.set(false);
      return;
    }

    this.suggestionLoading.set(true);
    this.suggestionError.set(null);

    try {
      const matches = await this.pokemonApiService.fetchPokemonList(250, 0).then((list) =>
        list.filter((pokemon) =>
          pokemon.name.toLowerCase().includes(normalized.toLowerCase()) ||
          pokemon.types.some((type) => type.toLowerCase().includes(normalized.toLowerCase())),
        ),
      );
      const validMatches = matches.slice(0, 8);
      this.suggestionError.set(validMatches.length ? null : 'No Pokémon matched your search.');
      this.suggestionLoading.set(false);
    } catch {
      this.suggestionError.set('Unable to load Pokémon suggestions.');
      this.suggestionLoading.set(false);
    }
  }

  addPokemon(pokemon: Pokemon): void {
    const ids = this.selectedIds();
    if (ids.length >= 6 || ids.includes(pokemon.id)) {
      return;
    }

    this.selectedIds.set([...ids, pokemon.id]);
    this.searchTerm.set('');
    this.suggestionError.set(null);
  }

  removePokemon(pokemonId: number): void {
    this.selectedIds.set(this.selectedIds().filter((id) => id !== pokemonId));
  }

  private validatePokemonSelection(control: AbstractControl<number[] | null>): { [key: string]: boolean } | null {
    const ids = control.value ?? [];
    if (ids.length < 1 || ids.length > 6) {
      return { teamSize: true };
    }

    return null;
  }

  private uniqueTeamNameValidator(): AsyncValidatorFn {
    return (control) => {
      const value = (control.value ?? '').trim();

      if (!value) {
        return of(null);
      }

      return timer(300).pipe(
        switchMap(() => of(this.teamStore.hasTeamName(value))),
        map((exists) => (exists ? { duplicateTeamName: true } : null)),
        takeUntilDestroyed(this.destroyRef),
      );
    };
  }
}
