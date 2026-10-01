import { describe, expect, it } from 'vitest';
import { firstValueFrom, of } from 'rxjs';
import { Pokemon } from '../../models/pokemon.model';
import { selectFilteredPokemons, selectSortedPokemons } from './pokemon.selectors';

const pokemons: Pokemon[] = [
  {
    id: 25,
    name: 'pikachu',
    height: 4,
    weight: 60,
    types: ['electric'],
    stats: { hp: 35, attack: 55, defense: 40, specialAttack: 50, specialDefense: 50, speed: 90, total: 320 },
    spriteUrl: 'https://example.com/pikachu.png',
  },
  {
    id: 6,
    name: 'charizard',
    height: 17,
    weight: 905,
    types: ['fire', 'flying'],
    stats: { hp: 78, attack: 84, defense: 78, specialAttack: 109, specialDefense: 85, speed: 100, total: 534 },
    spriteUrl: 'https://example.com/charizard.png',
  },
];

describe('pokemon selectors', () => {
  it('filters Pokémon by name and type', async () => {
    const result = await firstValueFrom(selectFilteredPokemons(of(pokemons), of('pik'), of('all')));
    expect(result.map((item) => item.name)).toEqual(['pikachu']);
  });

  it('sorts Pokémon by total descending', async () => {
    const result = await firstValueFrom(selectSortedPokemons(of(pokemons), of('total')));
    expect(result[0].name).toBe('charizard');
    expect(result[1].name).toBe('pikachu');
  });
});
