import { Component, Input, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface VoterRef {
  id?: number;
  name: string;
}

/**
 * Lista de votantes. Muestra las iniciales en avatares y, al tocarlas,
 * despliega los nombres completos (en móvil no existe el hover del title).
 */
@Component({
  selector: 'app-voters-list',
  standalone: true,
  imports: [CommonModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './voters-list.component.html',
  styleUrl: './voters-list.component.scss'
})
export class VotersListComponent {
  @Input() voters: VoterRef[] = [];
  @Input() label = 'Votantes';
  /** Deja los nombres siempre visibles, sin necesidad de tocar los avatares. */
  @Input() alwaysExpanded = false;

  isOpen = false;

  get expanded(): boolean {
    return this.alwaysExpanded || this.isOpen;
  }

  toggle() {
    if (this.alwaysExpanded) return;
    this.isOpen = !this.isOpen;
  }

  initial(name: string): string {
    return name?.trim() ? name.trim().charAt(0).toUpperCase() : '?';
  }
}
