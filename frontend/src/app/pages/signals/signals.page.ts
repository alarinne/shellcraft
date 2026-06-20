import { Component } from '@angular/core';
import { SignalsVisualizerComponent } from '../../components/signals/signals-visualizer.component';

@Component({
  selector: 'sc-signals-page',
  imports: [SignalsVisualizerComponent],
  templateUrl: './signals.page.html',
})
export class SignalsPage {}
