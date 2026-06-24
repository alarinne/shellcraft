import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { DEFAULT_LAB_ID } from '../../core/shellcraft-data';

@Component({
  selector: 'sc-landing-page',
  templateUrl: './landing.page.html',
})
export class LandingPage {
  private readonly router = inject(Router);

  protected startLearning(): void {
    void this.router.navigate(['/lab', DEFAULT_LAB_ID]);
  }

  protected viewLabs(): void {
    void this.router.navigate(['/path']);
  }
}
