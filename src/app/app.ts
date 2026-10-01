import { Component } from '@angular/core';
import { PokedexPageComponent } from './pokedex/pokedex-page.component';
import { TeamBuilderComponent } from './teams/team-builder.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [PokedexPageComponent, TeamBuilderComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {}
