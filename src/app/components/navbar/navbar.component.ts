import { Component, OnInit, HostListener, inject, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
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
export class NavbarComponent implements OnInit {
  authService = inject(AuthService);
  private router = inject(Router);

  isScrolled = false;
  isMenuOpen = false;
  showRoomsModal = false;
  copiedCode: string | null = null;

  recentTrips: RecentTrip[] = [];
  activeTripCode: string | null = null;

  ngOnInit() {
    this.refreshTripsState();
  }

  refreshTripsState() {
    this.recentTrips = this.authService.getRecentTrips();
    this.activeTripCode = this.authService.getActiveTripCode();
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
    this.refreshTripsState();
    this.showRoomsModal = !this.showRoomsModal;
  }

  closeRoomsModal() {
    this.showRoomsModal = false;
  }

  isCurrentTrip(trip: RecentTrip): boolean {
    return this.activeTripCode === trip.shareCode;
  }

  onMyRoomClick(event: Event) {
    event.preventDefault();
    this.refreshTripsState();
    
    if (this.recentTrips.length > 1) {
      this.showRoomsModal = true;
    } else if (this.recentTrips.length === 1) {
      this.switchTrip(this.recentTrips[0]);
    } else {
      this.router.navigate(['/dashboard']);
    }
    this.closeMenu();
  }

  switchTrip(trip: RecentTrip) {
    this.authService.switchToTrip(trip);
    this.refreshTripsState();
    this.showRoomsModal = false;
    this.closeMenu();
  }

  removeTrip(trip: RecentTrip, event: Event) {
    event.stopPropagation();
    this.authService.removeRecentTrip(trip.shareCode);
    this.refreshTripsState();
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
