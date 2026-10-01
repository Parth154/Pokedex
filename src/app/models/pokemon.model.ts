export interface PokemonStatSet {
  hp: number;
  attack: number;
  defense: number;
  specialAttack: number;
  specialDefense: number;
  speed: number;
}

export interface Pokemon {
  id: number;
  name: string;
  height: number;
  weight: number;
  types: string[];
  stats: PokemonStatSet & { total: number };
  spriteUrl: string;
}

export interface Team {
  id: number;
  name: string;
  trainer_id: number;
  pokemon_ids: number[];
  created_at: string;
}

export type StatKey = 'hp' | 'attack' | 'defense' | 'specialAttack' | 'specialDefense' | 'speed' | 'total';
export type SortKey = 'name' | 'total' | 'hp' | 'attack' | 'defense' | 'specialAttack' | 'specialDefense' | 'speed';
