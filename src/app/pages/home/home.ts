import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { RecentSearch, RouteInfo, Store, fmtDate, short } from '../../core/store';
import { Icon } from '../../shared/icon/icon';
import { OfferCard } from '../../shared/offer-card/offer-card';
import { SearchForm } from '../../shared/search-form/search-form';

@Component({
  selector: 'app-home',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SearchForm, OfferCard, Icon, RouterLink],
  styleUrl: './home.scss',
  templateUrl: './home.html',
})
export class Home {
  protected readonly s = inject(Store);
  private readonly router = inject(Router);
  protected readonly short = short;
  protected readonly fmt = fmtDate;

  protected readonly open = signal('');
  protected readonly advantages = [
    { icon: 'ticket', t: 'Instant Booking', s: 'Book your seat in a few taps and get the ticket at once.' },
    { icon: 'shield-check', t: 'Assured Seats', s: 'Confirmed seats on every trip, no last-minute surprises.' },
    { icon: 'qr', t: 'Instant Trip Details', s: 'Boarding point, timings and contact details on your phone.' },
    { icon: 'help', t: '24x7 Support', s: 'Our team is available any time of day to help you.' },
    { icon: 'card', t: 'Fast Refunds', s: 'Quick refunds on cancellations to your original method.' },
    { icon: 'bus', t: "Odisha's Largest Network", s: 'Hundreds of routes and trusted bus operators.' },
  ];
  protected readonly faqs = [
    { q: 'How do I book a bus ticket?', a: 'Choose From, To and the date, pick a bus and seats, verify your details and pay.' },
    { q: 'Where can I find my ticket?', a: 'Open Manage Booking to see and print all your tickets.' },
    { q: 'Which payment methods are accepted?', a: 'Cards, UPI and wallets, depending on what your gateway supports.' },
    { q: 'How do cancellations and refunds work?', a: 'Cancel from Manage Booking; the refund depends on the cancellation policy of the trip.' },
  ];
  // decorative, non-scannable QR placeholder
  protected readonly qr = Array.from({ length: 441 }, (_, i) => ({ x: i % 21, y: Math.floor(i / 21) }))
    .filter((c) => ((c.x * 7 + c.y * 13 + c.x * c.y) % 5 < 2) || (c.x < 7 && c.y < 7 && (c.x === 0 || c.y === 0 || c.x === 6 || c.y === 6 || (c.x > 1 && c.x < 5 && c.y > 1 && c.y < 5))));

  protected pickRoute(r: RouteInfo) {
    this.s.pickRoute(r);
    this.router.navigateByUrl(this.s.resultsRoute());
  }
  protected again(r: RecentSearch) {
    this.s.searchAgain(r);
    this.router.navigateByUrl(this.s.resultsRoute());
  }
}
