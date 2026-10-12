import { Routes } from '@angular/router';
import { Shell } from './layout/shell/shell';

// data.title / icon / tab / back drive the shared header and bottom tab bar.
export const routes: Routes = [
  // --- full-screen auth pages (no header / tab bar) ---
  { path: 'login', loadComponent: () => import('./pages/login/login').then((m) => m.Login) },
  { path: 'signup', loadComponent: () => import('./pages/signup/signup').then((m) => m.Signup) },

  {
    path: '',
    component: Shell,
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'home' },

      // --- screens in the design file ---
      { path: 'home', loadComponent: () => import('./pages/home/home').then((m) => m.Home), data: { icon: 'bus', tab: 'home' } },
      { path: 'search', loadComponent: () => import('./pages/search/search').then((m) => m.SearchPage), data: { title: 'Search', icon: 'search', tab: 'search' } },
      { path: 'bookings', loadComponent: () => import('./pages/bookings/bookings').then((m) => m.Bookings), data: { title: 'My Bookings', icon: 'ticket', tab: 'bookings' } },
      { path: 'offers', loadComponent: () => import('./pages/offers/offers').then((m) => m.Offers), data: { title: 'Offers & Rewards', icon: 'gift', tab: 'offers' } },
      { path: 'settings', loadComponent: () => import('./pages/settings/settings').then((m) => m.Settings), data: { title: 'Settings', icon: 'sliders', tab: 'profile' } },
      { path: 'profile', loadComponent: () => import('./pages/profile/profile').then((m) => m.ProfilePage), data: { title: 'Profile', icon: 'user', tab: 'profile' } },

      // --- booking flow, named in the side bar of the design ---
      { path: 'buses', loadComponent: () => import('./pages/bus-listing/bus-listing').then((m) => m.BusListing), data: { title: 'Bus Listing', icon: 'list', tab: 'search', back: true } },
      { path: 'bus-details', loadComponent: () => import('./pages/bus-details/bus-details').then((m) => m.BusDetails), data: { icon: 'bus', tab: 'search', hideTabs: true } },
      { path: 'seats', loadComponent: () => import('./pages/select-seat/select-seat').then((m) => m.SelectSeat), data: { title: 'Select Seat', icon: 'grid', tab: 'search', back: true } },
      { path: 'verification', loadComponent: () => import('./pages/verification/verification').then((m) => m.Verification), data: { title: 'Verification', icon: 'shield-check', tab: 'search', back: true } },
      { path: 'checkout', loadComponent: () => import('./pages/checkout/checkout').then((m) => m.Checkout), data: { title: 'Payment', icon: 'card', tab: 'search', back: true, hideTabs: true } },
      { path: 'success', loadComponent: () => import('./pages/payment-success/payment-success').then((m) => m.PaymentSuccess), data: { title: 'Payment Success', icon: 'check-circle', tab: 'bookings' } },

      // --- side bar destinations ---
      { path: 'tickets', loadComponent: () => import('./pages/tickets/tickets').then((m) => m.Tickets), data: { title: 'My Tickets', icon: 'qr', tab: 'bookings' } },
      { path: 'history', loadComponent: () => import('./pages/trip-history/trip-history').then((m) => m.TripHistory), data: { title: 'Trip History', icon: 'clock', tab: 'bookings', back: true } },
      { path: 'saved', loadComponent: () => import('./pages/saved-routes/saved-routes').then((m) => m.SavedRoutes), data: { title: 'Saved Routes', icon: 'heart', tab: 'search', back: true } },

      // --- extra screens ---
      { path: 'support', loadComponent: () => import('./pages/support/support').then((m) => m.Support), data: { title: 'Help & Support', icon: 'help', tab: 'profile' } },
      { path: 'notifications', loadComponent: () => import('./pages/notifications/notifications').then((m) => m.Notifications), data: { title: 'Notifications', icon: 'bell', tab: 'home' } },
      { path: 'no-buses', loadComponent: () => import('./pages/no-buses/no-buses').then((m) => m.NoBuses), data: { title: 'Bus Search', icon: 'search', tab: 'search', back: true } },

      { path: '**', redirectTo: 'home' },
    ],
  },
];
