import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, effect, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { PokemonStore } from './state/pokemon.store';
import { Pokemon } from '../models/pokemon.model';

@Component({
  selector: 'app-pokedex-page',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './pokedex-page.component.html',
  styleUrl: './pokedex-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PokedexPageComponent {
  private readonly pokemonStore = inject(PokemonStore);

  readonly loading = toSignal(this.pokemonStore.loading$, { initialValue: true });
  readonly error = toSignal(this.pokemonStore.error$, { initialValue: null as string | null });
  readonly rows = toSignal(this.pokemonStore.pagedPokemons$, { initialValue: [] as Pokemon[] });
  readonly typeOptions = toSignal(this.pokemonStore.typeOptions$, { initialValue: [] as string[] });
  readonly totalCount = toSignal(this.pokemonStore.totalFilteredCount$, { initialValue: 0 });
  readonly page = toSignal(this.pokemonStore.page$, { initialValue: 1 });
  readonly pageSize = toSignal(this.pokemonStore.pageSize$, { initialValue: 10 });
  readonly search = toSignal(this.pokemonStore.searchTerm$, { initialValue: '' });
  readonly typeFilter = toSignal(this.pokemonStore.typeFilter$, { initialValue: 'all' });
  readonly sortKey = toSignal(this.pokemonStore.sortKey$, { initialValue: 'total' as const });
  readonly selectedPokemon = toSignal(this.pokemonStore.selectedPokemon$, { initialValue: null as Pokemon | null });
  readonly detailLoading = toSignal(this.pokemonStore.detailLoading$, { initialValue: false });
  readonly detailError = toSignal(this.pokemonStore.detailError$, { initialValue: null as string | null });

  readonly totalPages = computed(() => Math.max(1, Math.ceil(this.totalCount() / this.pageSize())));

  readonly radarPoints = computed(() => {
    const pokemon = this.selectedPokemon();
    if (!pokemon) {
      return '';
    }

    const values = [
      pokemon.stats.hp,
      pokemon.stats.attack,
      pokemon.stats.defense,
      pokemon.stats.specialAttack,
      pokemon.stats.specialDefense,
      pokemon.stats.speed,
    ];

    const angleStep = (Math.PI * 2) / values.length;
    const centerX = 100;
    const centerY = 100;
    const radius = 72;

    return values
      .map((value, index) => {
        const currentAngle = -Math.PI / 2 + index * angleStep;
        const normalized = Math.max(0, value / 255);
        const x = centerX + Math.cos(currentAngle) * radius * normalized;
        const y = centerY + Math.sin(currentAngle) * radius * normalized;
        return `${x.toFixed(2)},${y.toFixed(2)}`;
      })
      .join(' ');
  });

  constructor() {
    this.pokemonStore.loadPokemons().catch(() => undefined);
  }

  onSearchChange(value: string): void {
    this.pokemonStore.setSearchTerm(value);
  }

  onTypeChange(type: string): void {
    this.pokemonStore.setTypeFilter(type);
  }

  onPageSizeChange(size: number): void {
    this.pokemonStore.setPageSize(size);
  }

  onSortChange(sortKey: string): void {
    this.pokemonStore.setSortKey(sortKey as 'name' | 'total' | 'hp' | 'attack' | 'defense' | 'specialAttack' | 'specialDefense' | 'speed');
  }

  selectPokemon(pokemon: Pokemon): void {
    this.pokemonStore.selectPokemon(pokemon.id);
  }

  retryLoad(): void {
    this.pokemonStore.loadPokemons().catch(() => undefined);
  }
}
