import { Component, HostListener, inject, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService, RecentTrip } from '../../services/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss'
})
export class NavbarComponent {
  authService = inject(AuthService);
  private router = inject(Router);

  isScrolled = false;
  isMenuOpen = false;
  showRoomsModal = false;
  copiedCode: string | null = null;

  get recentTrips(): RecentTrip[] {
    return this.authService.getRecentTrips();
  }

  @HostListener('window:scroll', [])
  onWindowScroll() {
    this.isScrolled = window.scrollY > 40;
  }

  @HostListener('window:keydown.escape')
  onEscape() {
    if (this.showRoomsModal) {
      this.closeRoomsModal();
    }
  }

  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
  }

  closeMenu() {
    this.isMenuOpen = false;
  }

  toggleRoomsModal() {
    this.showRoomsModal = !this.showRoomsModal;
  }

  closeRoomsModal() {
    this.showRoomsModal = false;
  }

  isCurrentTrip(trip: RecentTrip): boolean {
    return this.authService.getActiveTripCode() === trip.shareCode;
  }

  onMyRoomClick(event: Event) {
    event.preventDefault();
    const trips = this.recentTrips;
    if (trips.length > 1) {
      this.showRoomsModal = true;
    } else if (trips.length === 1) {
      this.authService.switchToTrip(trips[0]);
    } else {
      this.router.navigate(['/dashboard']);
    }
    this.closeMenu();
  }

  switchTrip(trip: RecentTrip) {
    this.authService.switchToTrip(trip);
    this.showRoomsModal = false;
    this.closeMenu();
  }

  removeTrip(trip: RecentTrip, event: Event) {
    event.stopPropagation();
    this.authService.removeRecentTrip(trip.shareCode);
    if (this.recentTrips.length === 0) {
      this.closeRoomsModal();
    }
  }

  copyCode(code: string, event: Event) {
    event.stopPropagation();
    navigator.clipboard.writeText(code).then(() => {
      this.copiedCode = code;
      setTimeout(() => {
        if (this.copiedCode === code) this.copiedCode = null;
      }, 2000);
    });
  }

  logout() {
    this.authService.logout();
    this.showRoomsModal = false;
    this.closeMenu();
  }
}
