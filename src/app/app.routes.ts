import { Routes } from '@angular/router';
import { LandingPageComponent } from './pages/landing-page/landing-page.component';
import { CreateTripComponent } from './pages/create-trip/create-trip.component';
import { JoinTripComponent } from './pages/join-trip/join-trip.component';
import { TripDashboardComponent } from './pages/trip-dashboard/trip-dashboard.component';
import { AdminPanelComponent } from './pages/admin-panel/admin-panel.component';
import { VotePageComponent } from './pages/vote-page/vote-page.component';
import { authGuard } from './guards/auth.guard';
import { adminGuard } from './guards/admin.guard';

export const routes: Routes = [
    // 1. Landing Page (Pública)
    { path: '', component: LandingPageComponent },

    // 2. Crear Viaje (Pública)
    { path: 'create', component: CreateTripComponent },

    // 3. Unirse / Login (Pública)
    { path: 'join', component: JoinTripComponent },

    // 4. Dashboard del Viaje (Protegida con authGuard)
    // El ':code' es una variable dinámica (ej. trip/A8X9L)
    {
        path: 'trip/:code',
        component: TripDashboardComponent,
        canActivate: [authGuard]
    },

    // 5. Panel de Admin (Protegida con adminGuard)
    {
        path: 'trip/:code/admin',
        component: AdminPanelComponent,
        canActivate: [adminGuard]
    },

    // 6. Ruta de Votación (Protegida con authGuard)
    {
        path: 'trip/:code/vote/:pollId',
        component: VotePageComponent,
        canActivate: [authGuard]
    },

    // Comodín: Si ponen una ruta rara, mandar a home
    { path: '**', redirectTo: '' }
];
