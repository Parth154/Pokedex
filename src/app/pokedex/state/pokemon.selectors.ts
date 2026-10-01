import { Observable, combineLatest, map, distinctUntilChanged } from 'rxjs';
import { Pokemon, SortKey } from '../../models/pokemon.model';

export const selectFilteredPokemons = (
  pokemons$: Observable<Pokemon[]>,
  searchTerm$: Observable<string>,
  typeFilter$: Observable<string>,
) =>
  combineLatest([pokemons$, searchTerm$, typeFilter$]).pipe(
    map(([pokemons, searchTerm, typeFilter]) => {
      const normalizedQuery = searchTerm.trim().toLowerCase();

      return pokemons.filter((pokemon) => {
        const matchesSearch =
          !normalizedQuery ||
          pokemon.name.toLowerCase().includes(normalizedQuery) ||
          pokemon.types.some((type) => type.toLowerCase().includes(normalizedQuery));

        const matchesType = typeFilter === 'all' || pokemon.types.includes(typeFilter);
        return matchesSearch && matchesType;
      });
    }),
    distinctUntilChanged((prev, curr) => JSON.stringify(prev) === JSON.stringify(curr)),
  );

export const selectSortedPokemons = (
  pokemons$: Observable<Pokemon[]>,
  sortKey$: Observable<SortKey>,
) =>
  combineLatest([pokemons$, sortKey$]).pipe(
    map(([pokemons, sortKey]) => {
      const items = [...pokemons];

      items.sort((a, b) => {
        if (sortKey === 'name') {
          return a.name.localeCompare(b.name);
        }

        return b.stats[sortKey] - a.stats[sortKey];
      });

      return items;
    }),
    distinctUntilChanged((prev, curr) => JSON.stringify(prev) === JSON.stringify(curr)),
  );

export const selectTypeOptions = (pokemons$: Observable<Pokemon[]>) =>
  pokemons$.pipe(
    map((pokemons) => Array.from(new Set(pokemons.flatMap((pokemon) => pokemon.types))).sort()),
    distinctUntilChanged((prev, curr) => JSON.stringify(prev) === JSON.stringify(curr)),
  );
