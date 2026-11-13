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
  /** FAQ: selected topic tab and the open question inside it. */
  protected readonly faqTab = signal(0);
  protected readonly open = signal<number | null>(0);
  /** Selected card in "Where to next?" */
  protected readonly wn = signal(0);
  private wnLock = 0;
  private wnRaf = 0;

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

  // ---- "Where to next?" ----

  /** Tap a side card to select it; tap the selected card to explore that route. */
  protected wnPick(r: RouteInfo, i: number, track: HTMLElement) {
    if (i === this.wn()) return this.pickRoute(r);
    this.wnGo(i, track);
  }

  protected wnStep(dir: 1 | -1, track: HTMLElement) {
    const n = this.s.exploreRoutes.length;
    this.wnGo((this.wn() + dir + n) % n, track);
  }

  /** A finger or wheel takes over from any slide the buttons started. */
  protected wnUnlock() {
    this.wnLock = 0;
  }

  /** While swiping, keep the selected card, background and counter in step with the card at the left edge. */
  protected wnScroll(track: HTMLElement) {
    if (performance.now() < this.wnLock || this.wnRaf) return;
    this.wnRaf = requestAnimationFrame(() => {
      this.wnRaf = 0;
      const i = Math.min(this.s.exploreRoutes.length - 1, Math.round(track.scrollLeft / this.wnStride(track)));
      if (i !== this.wn()) this.wn.set(i);
    });
  }

  private wnGo(i: number, track: HTMLElement) {
    this.wn.set(i);
    this.wnLock = performance.now() + 700; // ignore the scroll events caused by this slide
    track.scrollTo({ left: Math.min(i * this.wnStride(track), track.scrollWidth - track.clientWidth), behavior: 'smooth' });
  }

  /** Distance between two cards, read from the --wn-w / --wn-gap CSS variables so TS and SCSS never disagree. */
  private wnStride(track: HTMLElement) {
    const cs = getComputedStyle(track);
    return (parseFloat(cs.getPropertyValue('--wn-w')) || 1) + (parseFloat(cs.getPropertyValue('--wn-gap')) || 0);
  }

  protected faqPick(i: number) {
    this.faqTab.set(i);
    this.open.set(0);
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
