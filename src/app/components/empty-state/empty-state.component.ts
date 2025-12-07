import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  templateUrl: './empty-state.component.html',
  styleUrl: './empty-state.component.scss'
})
export class EmptyStateComponent {
  @Input() message: string = 'No hay datos disponibles';
  @Input() icon: string = 'bi-inbox'; // Icono de Bootstrap por defecto
}
