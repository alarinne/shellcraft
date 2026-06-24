import { Component, input, output } from '@angular/core';
import { LabCommandGuide } from '../../core/execution/types';

@Component({
  selector: 'sc-command-guide-dialog',
  templateUrl: './command-guide-dialog.component.html',
})
export class CommandGuideDialogComponent {
  readonly entry = input<LabCommandGuide | null>(null);
  readonly close = output<void>();

  protected readonly dialogTitleId = 'sc-command-guide-dialog-title';
}
