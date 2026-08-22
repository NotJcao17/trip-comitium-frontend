import { Component, inject, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-landing-page',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './landing-page.component.html',
  styleUrl: './landing-page.component.scss'
})
export class LandingPageComponent {
  private router = inject(Router);
  quickCode = '';

  onQuickJoin() {
    if (this.quickCode && this.quickCode.trim()) {
      this.router.navigate(['/join'], { queryParams: { code: this.quickCode.trim().toUpperCase() } });
    } else {
      this.router.navigate(['/join']);
    }
  }
}
