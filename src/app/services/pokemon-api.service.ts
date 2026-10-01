import { Injectable } from '@angular/core';
import { Pokemon } from '../models/pokemon.model';

interface PokemonGraphqlRow {
  id: number;
  name: string;
  height: number;
  weight: number;
  pokemon_v2_pokemontypes: Array<{ pokemon_v2_type: { name: string } }>;
  pokemon_v2_pokemonstats: Array<{ base_stat: number; pokemon_v2_stat: { name: string } }>;
  pokemon_v2_pokemonsprites: Array<{ sprites: Record<string, unknown> | string | null }>;
}

@Injectable({ providedIn: 'root' })
export class PokemonApiService {
  private readonly endpoint = 'https://beta.pokeapi.co/graphql/v1beta';

  async fetchPokemonList(limit: number, offset: number): Promise<Pokemon[]> {
    const query = `
      query GetPokemon($limit: Int!, $offset: Int!) {
        pokemon_v2_pokemon(limit: $limit, offset: $offset) {
          id
          name
          height
          weight
          pokemon_v2_pokemontypes {
            pokemon_v2_type {
              name
            }
          }
          pokemon_v2_pokemonstats {
            base_stat
            pokemon_v2_stat {
              name
            }
          }
          pokemon_v2_pokemonsprites {
            sprites
          }
        }
      }
    `;

    const data = await this.fetchGraphql<{ pokemon_v2_pokemon: PokemonGraphqlRow[] }>({
      query,
      variables: { limit, offset },
    });

    return data.pokemon_v2_pokemon.map((row) => this.mapPokemon(row));
  }

  async fetchPokemonById(id: number): Promise<Pokemon> {
    const list = await this.fetchPokemonList(250, 0);
    const match = list.find((pokemon) => pokemon.id === id);

    if (!match) {
      throw new Error(`No Pokémon found for id ${id}`);
    }

    return match;
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
          throw new Error('Missing GraphQL data');
        }

        return json.data;
      } catch (error) {
        lastError = error;
        if (attempt < 2) {
          await this.delay(400 * (attempt + 1));
        }
      }
    }

    throw lastError instanceof Error ? lastError : new Error('Pokemon request failed');
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private mapPokemon(row: PokemonGraphqlRow): Pokemon {
    const statsMap = new Map<string, number>();
    row.pokemon_v2_pokemonstats.forEach((entry) => {
      const statName = entry.pokemon_v2_stat.name;
      statsMap.set(statName, entry.base_stat);
    });

    const statValues = {
      hp: statsMap.get('hp') ?? 0,
      attack: statsMap.get('attack') ?? 0,
      defense: statsMap.get('defense') ?? 0,
      specialAttack: statsMap.get('special-attack') ?? 0,
      specialDefense: statsMap.get('special-defense') ?? 0,
      speed: statsMap.get('speed') ?? 0,
    };

    const total = Object.values(statValues).reduce((sum, item) => sum + item, 0);

    const spritePayload = row.pokemon_v2_pokemonsprites?.[0]?.sprites;
    const spriteData = typeof spritePayload === 'string' ? JSON.parse(spritePayload) : spritePayload ?? {};
    const spriteUrl =
      spriteData?.other?.['official-artwork']?.front_default ||
      spriteData?.front_default ||
      'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/0.png';

    return {
      id: row.id,
      name: row.name,
      height: row.height,
      weight: row.weight,
      types: row.pokemon_v2_pokemontypes.map((entry) => entry.pokemon_v2_type.name),
      stats: {
        ...statValues,
        total,
      },
      spriteUrl,
    };
  }
}
