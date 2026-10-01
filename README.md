# Pokédex App

This project is a small Angular Pokédex that loads data from the public GraphQL PokéAPI, provides a sortable searchable table, and supports team creation through a mock local GraphQL server.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the mock GraphQL server in a separate terminal:
   ```bash
   npm run mock:server
   ```
3. Start the Angular app:
   ```bash
   npm start
   ```
4. Open http://localhost:4200

## Architecture

- App state is split between custom RxJS stores in `src/app/pokedex/state` and `src/app/teams/state`.
- All component state uses Angular signals and OnPush change detection.
- The app uses GraphQL fetch calls for Pokémon data and local mock GraphQL for team CRUD.
- Team creation follows an optimistic-update flow with rollback on failure.

## What I would improve next

- Add polished toast notifications and motion transitions.
- Expand unit coverage around API error states and pagination.
- Add drag-and-drop team selection and a richer loading skeleton.
