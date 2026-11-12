import { DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, afterNextRender, inject, signal } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { OperatorConfigService } from '../../core/operator-config';
import { RecentSearch, RouteInfo, Store } from '../../core/store';
import { Icon } from '../../shared/icon/icon';
import { OffersCarousel } from '../../shared/offers-carousel/offers-carousel';
import { SearchForm } from '../../shared/search-form/search-form';
import { Tooltip } from '../../shared/tooltip/tooltip';

/** Home layout 2 ("journey"): text left / search card right hero, step-based flow, departure-board routes. */
@Component({
  selector: 'app-home-2',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SearchForm, OffersCarousel, Icon, RouterLink, Tooltip],
  styleUrl: './home-2.scss',
  templateUrl: './home-2.html',
})
export class Home2 {
  protected readonly s = inject(Store);
  protected readonly op = inject(OperatorConfigService);
  private readonly router = inject(Router);
  protected readonly bgFailed = signal(false);
  /** "Fri, 13 Nov" */
  protected readonly fmt = (iso: string) =>
    new Date(`${iso}T00:00:00`).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
  protected readonly open = signal<number | null>(0);

  constructor() {
    // Lets the top bar (layout/shell) sit transparent over this hero, then turn white after a little scroll.
    // Only classes on <body> are touched, and they are removed again when leaving the page,
    // so every other page (including the classic Home) keeps its normal top bar.
    const body = inject(DOCUMENT).body;
    const destroyRef = inject(DestroyRef);
    afterNextRender(() => {
      let raf = 0;
      const update = () => { raf = 0; body.classList.toggle('hero-scrolled', window.scrollY > 24); };
      const onScroll = () => { if (!raf) raf = requestAnimationFrame(update); };
      body.classList.add('hero-over');
      update();
      window.addEventListener('scroll', onScroll, { passive: true });
      destroyRef.onDestroy(() => {
        window.removeEventListener('scroll', onScroll);
        if (raf) cancelAnimationFrame(raf);
        body.classList.remove('hero-over', 'hero-scrolled');
      });
    });
  }

  /** Hand-over note: move to Store / operator config when the backend is ready. */
  protected readonly steps = [
    { icon: 'search', title: 'Search', text: 'Pick your cities and travel date.' },
    { icon: 'bus', title: 'Choose a bus', text: 'Compare operators, timings and fares.' },
    { icon: 'ticket', title: 'Pick your seat', text: 'Select seats on the live seat map.' },
    { icon: 'card', title: 'Pay & travel', text: 'Pay securely and get your e-ticket.' },
  ];
  protected readonly promises = [
    { icon: 'shield-check', title: 'Verified operators', text: 'Every operator is checked before listing.' },
    { icon: 'lock', title: 'Secure payments', text: 'Cards, UPI and wallets, protected end to end.' },
    { icon: 'phone', title: 'Support 24×7', text: 'Real people to help before and during your trip.' },
  ];

  /** Slides a horizontal track by ~80% of its width (arrow buttons on desktop). */
  protected slide(el: HTMLElement, dir: 1 | -1) {
    el.scrollBy({ left: dir * el.clientWidth * 0.8, behavior: 'smooth' });
  }

  protected again(r: RecentSearch) {
    this.s.searchAgain(r);
    this.router.navigateByUrl(this.s.resultsRoute());
  }

  protected pickRoute(r: RouteInfo) {
    this.s.pickRoute(r);
    this.router.navigateByUrl(this.s.resultsRoute());
  }
}
