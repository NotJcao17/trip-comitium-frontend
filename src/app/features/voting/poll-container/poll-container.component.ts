import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Poll } from '../../../models/poll.interface';
import { DateSelectorComponent } from '../date-selector/date-selector.component';
import { TierListSortComponent } from '../tier-list-sort/tier-list-sort.component';
import { BudgetSliderComponent } from '../budget-slider/budget-slider.component';
import { StandardVoteComponent } from '../standard-vote/standard-vote.component';

@Component({
  selector: 'app-poll-container',
  standalone: true,
  imports: [CommonModule, DateSelectorComponent, TierListSortComponent, BudgetSliderComponent, StandardVoteComponent],
  templateUrl: './poll-container.component.html',
  styleUrl: './poll-container.component.scss'
})
export class PollContainerComponent {
  @Input() poll!: Poll;
}
