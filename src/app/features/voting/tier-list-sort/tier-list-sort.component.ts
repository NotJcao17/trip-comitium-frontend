import { Component, ElementRef, Input, OnInit, ViewChild, inject, CUSTOM_ELEMENTS_SCHEMA, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { DragDropModule, CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { Poll, PollOptionImage } from '../../../models/poll.interface';
import { PollService } from '../../../services/poll.service';
import { AuthService } from '../../../services/auth.service';
import { OptionGalleryComponent } from '../../../components/option-gallery/option-gallery.component';

@Component({
  selector: 'app-tier-list-sort',
  standalone: true,
  imports: [CommonModule, DragDropModule, OptionGalleryComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './tier-list-sort.component.html',
  styleUrl: './tier-list-sort.component.scss'
})
export class TierListSortComponent implements OnInit {
  @Input({ required: true }) poll!: Poll;
  private pollService = inject(PollService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  tiers = [
    { id: 'S', label: 'S', color: 'var(--tier-s)', ink: 'var(--tier-s-ink)', items: [] as string[] },
    { id: 'A', label: 'A', color: 'var(--tier-a)', ink: 'var(--tier-a-ink)', items: [] as string[] },
    { id: 'B', label: 'B', color: 'var(--tier-b)', ink: 'var(--tier-b-ink)', items: [] as string[] },
    { id: 'C', label: 'C', color: 'var(--tier-c)', ink: 'var(--tier-c-ink)', items: [] as string[] },
    { id: 'D', label: 'D', color: 'var(--tier-d)', ink: 'var(--tier-d-ink)', items: [] as string[] },
    { id: 'Unranked', label: 'Sin clasificar', color: 'var(--mono-muted)', ink: 'var(--bg-darkest)', items: [] as string[] }
  ];

  connectedLists: string[] = ['tier-S', 'tier-A', 'tier-B', 'tier-C', 'tier-D', 'tier-Unranked'];

  isSubmitting = false;
  successMessage = '';

  /** Los votos se guardan por texto, así que indexamos los detalles por texto. */
  private descriptions: Record<string, string> = {};
  private images: Record<string, PollOptionImage[]> = {};
  activeDetail: { text: string; description: string; images: PollOptionImage[] } | null = null;
  showAllDetails = false;

  /**
   * La ficha va en un <dialog>: el panel de la votación tiene backdrop-filter y
   * eso convierte a cualquier hijo `position: fixed` en relativo al panel, que
   * era lo que dejaba la ficha hasta el fondo y encimada al hacer scroll.
   */
  @ViewChild('detailDialog') detailDialog?: ElementRef<HTMLDialogElement>;

  @HostListener('dragstart', ['$event'])
  onNativeDragStart(event: DragEvent) {
    event.preventDefault();
  }

  ngOnInit() {
    if (this.poll.options) {
      this.tiers[5].items = this.poll.options.map(o => o.text);
      this.poll.options.forEach(o => {
        if (o.description && o.description.trim()) {
          this.descriptions[o.text] = o.description.trim();
        }
        if (o.images && o.images.length > 0) {
          this.images[o.text] = o.images;
        }
      });
    }
    this.loadMyVote();
  }

  /** Una opción puede traer solo fotos, sin texto: también merece su ficha. */
  hasDetails(item: string): boolean {
    return Boolean(this.descriptions[item]) || this.getImages(item).length > 0;
  }

  getDescription(item: string): string {
    return this.descriptions[item] || '';
  }

  getImages(item: string): PollOptionImage[] {
    return this.images[item] || [];
  }

  get hasAnyImages(): boolean {
    return Object.keys(this.images).length > 0;
  }

  get optionsWithDetails() {
    return (this.poll.options || []).filter(o => this.hasDetails(o.text));
  }

  openDetail(item: string, event: Event) {
    event.stopPropagation();
    event.preventDefault();
    if (!this.hasDetails(item)) return;
    this.activeDetail = {
      text: item,
      description: this.descriptions[item] || '',
      images: this.getImages(item)
    };
    // Esperamos a que Angular pinte el contenido antes de abrirlo
    queueMicrotask(() => {
      const dlg = this.detailDialog?.nativeElement;
      if (dlg && !dlg.open) dlg.showModal();
    });
  }

  closeDetail() {
    const dlg = this.detailDialog?.nativeElement;
    if (dlg?.open) dlg.close();
    this.activeDetail = null;
  }

  loadMyVote() {
    if (!this.poll.poll_id) return;
    this.pollService.getMyVote(this.poll.poll_id).subscribe(vote => {
      if (vote && vote.vote_value) {
        let savedTiers = vote.vote_value;
        if (typeof savedTiers === 'string') {
          try { savedTiers = JSON.parse(savedTiers); } catch { savedTiers = {}; }
        }

        this.tiers.forEach(t => t.items = []);

        this.poll.options?.forEach(opt => {
          const rank = savedTiers[opt.text];
          if (rank) {
            const targetTier = this.tiers.find(t => t.id === rank);
            if (targetTier) targetTier.items.push(opt.text);
            else this.tiers[5].items.push(opt.text);
          } else {
            this.tiers[5].items.push(opt.text);
          }
        });
      }
    });
  }

  drop(event: CdkDragDrop<string[]>) {
    if (this.poll.status === 'locked') return;

    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex,
      );
    }
  }

  moveToTier(item: string, currentTierId: string, targetTierId: string) {
    if (this.poll.status === 'locked' || currentTierId === targetTierId) return;

    const sourceTier = this.tiers.find(t => t.id === currentTierId);
    const targetTier = this.tiers.find(t => t.id === targetTierId);

    if (sourceTier && targetTier) {
      const idx = sourceTier.items.indexOf(item);
      if (idx !== -1) {
        sourceTier.items.splice(idx, 1);
        targetTier.items.push(item);
      }
    }
  }

  submitVote() {
    if (!this.poll.poll_id || this.poll.status === 'locked' || this.isSubmitting) return;

    this.isSubmitting = true;

    const voteValue: any = {};
    this.tiers.forEach(tier => {
      if (tier.id !== 'Unranked') {
        tier.items.forEach(item => {
          voteValue[item] = tier.id;
        });
      }
    });

    this.pollService.submitVote({
      pollId: this.poll.poll_id,
      voteValue: voteValue
    }).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.successMessage = '¡Tu clasificación ha sido guardada!';

        const tripCode = this.route.snapshot.paramMap.get('code') || this.authService.getActiveTripCode();
        setTimeout(() => {
          if (tripCode) {
            this.router.navigate(['/trip', tripCode], { 
              queryParams: { voted: '1', title: this.poll.title } 
            });
          } else {
            this.router.navigate(['/dashboard'], { 
              queryParams: { voted: '1', title: this.poll.title } 
            });
          }
        }, 600);
      },
      error: (err) => {
        this.isSubmitting = false;
        alert(err.error?.error || 'Error al guardar.');
      }
    });
  }
}
