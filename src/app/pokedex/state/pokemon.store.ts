import { Injectable, signal } from '@angular/core';
import { BehaviorSubject, Observable, combineLatest, distinctUntilChanged, map, shareReplay, switchMap, tap } from 'rxjs';
import { Pokemon, SortKey, StatKey } from '../../models/pokemon.model';
import { PokemonApiService } from '../../services/pokemon-api.service';
import { selectFilteredPokemons, selectSortedPokemons, selectTypeOptions } from './pokemon.selectors';

@Injectable({ providedIn: 'root' })
export class PokemonStore {
  private readonly pokemonsSubject = new BehaviorSubject<Pokemon[]>([]);
  private readonly loadingSubject = new BehaviorSubject(false);
  private readonly errorSubject = new BehaviorSubject<string | null>(null);
  private readonly searchTermSubject = new BehaviorSubject('');
  private readonly typeFilterSubject = new BehaviorSubject('all');
  private readonly pageSubject = new BehaviorSubject(1);
  private readonly pageSizeSubject = new BehaviorSubject(10);
  private readonly sortKeySubject = new BehaviorSubject<SortKey>('total');
  private readonly selectedIdSubject = new BehaviorSubject<number | null>(null);
  private readonly detailLoadingSubject = new BehaviorSubject(false);
  private readonly detailErrorSubject = new BehaviorSubject<string | null>(null);
  private readonly detailSubject = new BehaviorSubject<Pokemon | null>(null);

  readonly pokemons$ = this.pokemonsSubject.asObservable().pipe(shareReplay(1));
  readonly loading$ = this.loadingSubject.asObservable().pipe(distinctUntilChanged(), shareReplay(1));
  readonly error$ = this.errorSubject.asObservable().pipe(distinctUntilChanged(), shareReplay(1));
  readonly searchTerm$ = this.searchTermSubject.asObservable().pipe(distinctUntilChanged(), shareReplay(1));
  readonly typeFilter$ = this.typeFilterSubject.asObservable().pipe(distinctUntilChanged(), shareReplay(1));
  readonly page$ = this.pageSubject.asObservable().pipe(distinctUntilChanged(), shareReplay(1));
  readonly pageSize$ = this.pageSizeSubject.asObservable().pipe(distinctUntilChanged(), shareReplay(1));
  readonly sortKey$ = this.sortKeySubject.asObservable().pipe(distinctUntilChanged(), shareReplay(1));
  readonly selectedId$ = this.selectedIdSubject.asObservable().pipe(distinctUntilChanged(), shareReplay(1));
  readonly detailLoading$ = this.detailLoadingSubject.asObservable().pipe(distinctUntilChanged(), shareReplay(1));
  readonly detailError$ = this.detailErrorSubject.asObservable().pipe(distinctUntilChanged(), shareReplay(1));
  readonly detailPokemon$ = this.detailSubject.asObservable().pipe(shareReplay(1));

  readonly filteredPokemons$: Observable<Pokemon[]> = selectFilteredPokemons(
    this.pokemons$, this.searchTerm$, this.typeFilter$,
  );

  readonly sortedPokemons$: Observable<Pokemon[]> = selectSortedPokemons(
    this.filteredPokemons$, this.sortKey$,
  );

  readonly pagedPokemons$: Observable<Pokemon[]> = combineLatest([
    this.sortedPokemons$,
    this.page$,
    this.pageSize$,
  ]).pipe(
    map(([items, page, pageSize]) => {
      const start = (page - 1) * pageSize;
      return items.slice(start, start + pageSize);
    }),
    distinctUntilChanged((prev, next) => JSON.stringify(prev) === JSON.stringify(next)),
    shareReplay(1),
  );

  readonly totalFilteredCount$ = this.filteredPokemons$.pipe(
    map((items) => items.length),
    distinctUntilChanged(),
    shareReplay(1),
  );

  readonly typeOptions$ = selectTypeOptions(this.pokemons$);

  readonly selectedPokemon$ = combineLatest([this.pokemons$, this.selectedId$]).pipe(
    map(([items, selectedId]) => items.find((pokemon) => pokemon.id === selectedId) ?? null),
    distinctUntilChanged((prev, curr) => prev?.id === curr?.id),
    shareReplay(1),
  );

  constructor(private readonly pokemonApiService: PokemonApiService) {}

  setSearchTerm(searchTerm: string): void {
    this.searchTermSubject.next(searchTerm);
    this.pageSubject.next(1);
  }

  setTypeFilter(type: string): void {
    this.typeFilterSubject.next(type);
    this.pageSubject.next(1);
  }

  setPage(page: number): void {
    this.pageSubject.next(page);
  }

  setPageSize(pageSize: number): void {
    this.pageSizeSubject.next(pageSize);
    this.pageSubject.next(1);
  }

  setSortKey(sortKey: SortKey): void {
    this.sortKeySubject.next(sortKey);
  }

  selectPokemon(pokemonId: number): void {
    this.selectedIdSubject.next(pokemonId);
    void this.loadDetail(pokemonId);
  }

  async loadPokemons(): Promise<void> {
    this.loadingSubject.next(true);
    this.errorSubject.next(null);

    try {
      const pokemonList = await this.pokemonApiService.fetchPokemonList(250, 0);
      this.pokemonsSubject.next(pokemonList);
      if (this.selectedIdSubject.value) {
        const chosen = pokemonList.find((item) => item.id === this.selectedIdSubject.value);
        if (chosen) {
          this.detailSubject.next(chosen);
        }
      }
    } catch (error) {
      this.errorSubject.next(error instanceof Error ? error.message : 'Failed to load Pokémon.');
    } finally {
      this.loadingSubject.next(false);
    }
  }

  async loadDetail(pokemonId: number): Promise<void> {
    this.detailLoadingSubject.next(true);
    this.detailErrorSubject.next(null);

    try {
      const pokemon = await this.pokemonApiService.fetchPokemonById(pokemonId);
      this.detailSubject.next(pokemon);
    } catch (error) {
      this.detailErrorSubject.next(error instanceof Error ? error.message : 'Unable to show details.');
    } finally {
      this.detailLoadingSubject.next(false);
    }
  }

  getStatMeta(statKey: StatKey): { label: string; max: number } {
    const mapping: Record<StatKey, { label: string; max: number }> = {
      hp: { label: 'HP', max: 255 },
      attack: { label: 'Attack', max: 255 },
      defense: { label: 'Defense', max: 255 },
      specialAttack: { label: 'Sp. Atk', max: 255 },
      specialDefense: { label: 'Sp. Def', max: 255 },
      speed: { label: 'Speed', max: 255 },
      total: { label: 'Total', max: 1500 },
    };

    return mapping[statKey];
  }
}
