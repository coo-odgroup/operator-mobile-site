import { Location } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterOutlet } from '@angular/router';
import { filter, map, startWith } from 'rxjs';
import { Store } from '../../core/store';
import { Icon } from '../../shared/icon/icon';

interface Meta { title: string; icon: string; tab: string; back: boolean; hideTabs: boolean; }

@Component({
  selector: 'app-shell',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, RouterLink, Icon],
  styleUrl: './shell.scss',
  templateUrl: './shell.html',
})
export class Shell {
  private readonly router = inject(Router);
  private readonly location = inject(Location);
  protected readonly s = inject(Store);
  protected readonly drawer = signal(false);

  protected readonly tabs = [
    { key: 'home', label: 'Home', icon: 'home', link: '/home' },
    { key: 'search', label: 'Search', icon: 'search', link: '/search' },
    { key: 'bookings', label: 'My Tickets', icon: 'ticket', link: '/bookings' },
    { key: 'offers', label: 'Offers', icon: 'gift', link: '/offers' },
    { key: 'profile', label: 'Profile', icon: 'user', link: '/profile' },
  ];

  protected readonly menu = [
    { label: 'Home', icon: 'home', link: '/home' },
    { label: 'Bus Listing', icon: 'list', link: '/buses' },
    { label: 'Bus Details', icon: 'bus', link: '/bus-details' },
    { label: 'Select Seat', icon: 'grid', link: '/seats' },
    { label: 'Verification', icon: 'shield-check', link: '/verification' },
    { label: 'Checkout Payment', icon: 'card', link: '/checkout' },
    { label: 'Payment Successful', icon: 'check-circle', link: '/success' },
    { label: 'My Tickets', icon: 'qr', link: '/tickets' },
    { label: 'Profile', icon: 'user', link: '/profile' },
    { label: 'My Bookings', icon: 'ticket', link: '/bookings' },
    { label: 'Trip History', icon: 'clock', link: '/history' },
    { label: 'Saved Routes', icon: 'heart', link: '/saved' },
    { label: 'Offers & Rewards', icon: 'gift', link: '/offers' },
    { label: 'Notifications', icon: 'bell', link: '/notifications' },
    { label: 'Help & Support', icon: 'help', link: '/support' },
    { label: 'No Buses Found', icon: 'calendar-x', link: '/no-buses' },
    { label: 'Settings', icon: 'sliders', link: '/settings' },
    { label: 'Login', icon: 'log-in', link: '/login' },
    { label: 'Sign Up', icon: 'user', link: '/signup' },
  ];

  protected readonly meta = toSignal(
    this.router.events.pipe(
      filter((e) => e instanceof NavigationEnd),
      map(() => this.readMeta()),
      startWith(this.readMeta()),
    ),
    { initialValue: this.readMeta() },
  ) as () => Meta;

  private readMeta(): Meta {
    let r = this.router.routerState.snapshot.root;
    while (r.firstChild) r = r.firstChild;
    const d = r.data;
    return {
      title: d['title'] ?? this.s.brand,
      icon: d['icon'] ?? 'bus',
      tab: d['tab'] ?? 'home',
      back: !!d['back'],
      hideTabs: !!d['hideTabs'],
    };
  }

  protected back() {
    if (history.length > 1) this.location.back();
    else this.router.navigateByUrl('/home');
  }
}
