import { Component } from '@angular/core';
import { PipesVisualizerComponent } from '../../components/pipes/pipes-visualizer.component';

@Component({
  selector: 'sc-pipes-page',
  imports: [PipesVisualizerComponent],
  templateUrl: './pipes.page.html',
})
export class PipesPage {}
