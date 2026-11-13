import { ChangeDetectionStrategy, Component, DestroyRef, ElementRef, afterNextRender, inject, signal, viewChild } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { OperatorConfigService } from '../../core/operator-config';
import { RecentSearch, RouteInfo, Store, fmtDate, short } from '../../core/store';
import { CouponModal } from '../../shared/coupon-modal/coupon-modal';
import { HeroArt } from '../../shared/hero-art/hero-art';
import { Icon } from '../../shared/icon/icon';
import { OffersCarousel } from '../../shared/offers-carousel/offers-carousel';
import { SearchForm } from '../../shared/search-form/search-form';
import { Tooltip } from '../../shared/tooltip/tooltip';

@Component({
  selector: 'app-home',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SearchForm, HeroArt, CouponModal, OffersCarousel, Icon, RouterLink, Tooltip],
  styleUrl: './home.scss',
  templateUrl: './home.html',
})
export class Home {
  protected readonly s = inject(Store);
  private readonly router = inject(Router);
  protected readonly short = short;
  protected readonly fmt = fmtDate;

  protected readonly op = inject(OperatorConfigService);

  // ---- Stats strip: icons pop and numbers count up the first time it scrolls into view ----
  private readonly trustEl = viewChild<ElementRef<HTMLElement>>('trustEl');
  /** true = zero state shown, waiting for the first scroll to the strip */
  protected readonly armed = signal(false);
  protected readonly started = signal(false);
  /** 0 → 1 while counting; stays 1 (final values) when animation is skipped */
  protected readonly progress = signal(1);

  constructor() {
    const destroyRef = inject(DestroyRef);
    afterNextRender(() => {
      const el = this.trustEl()?.nativeElement;
      if (!el || !('IntersectionObserver' in window) || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      let raf = 0;
      const run = () => {
        this.started.set(true);
        const t0 = performance.now();
        const step = (now: number) => {
          const x = Math.min(1, (now - t0) / 1800);
          this.progress.set(1 - Math.pow(1 - x, 3)); // ease-out
          if (x < 1) raf = requestAnimationFrame(step);
        };
        raf = requestAnimationFrame(step);
      };
      this.armed.set(true);
      this.progress.set(0);
      const io = new IntersectionObserver((entries) => {
        const e = entries[0];
        if (e.isIntersecting) { run(); io.disconnect(); }
        else if (e.boundingClientRect.top < 0) { // page opened already scrolled past the strip
          this.started.set(true); this.progress.set(1); io.disconnect();
        }
      }, { threshold: 0.4 });
      io.observe(el);
      // jumped past the strip without it ever being visible (End key, anchor link): show final values
      const onScroll = () => {
        if (this.started()) { removeEventListener('scroll', onScroll); return; }
        if (el.getBoundingClientRect().bottom < 0) {
          this.started.set(true); this.progress.set(1); io.disconnect(); removeEventListener('scroll', onScroll);
        }
      };
      addEventListener('scroll', onScroll, { passive: true });
      destroyRef.onDestroy(() => { io.disconnect(); removeEventListener('scroll', onScroll); cancelAnimationFrame(raf); });
    });
  }

  /** "2500+" / "10 Lakh+" / "4.5" / "24/7" → same text with the number scaled by progress */
  protected shown(v: string): string {
    const p = this.progress();
    const m = /^(\D*?)(\d[\d,]*(?:\.\d+)?)(.*)$/.exec(v);
    if (!m || p >= 1) return v;
    const raw = m[2];
    const dec = raw.includes('.') ? raw.split('.')[1].length : 0;
    const cur = parseFloat(raw.replace(/,/g, '')) * p;
    let txt = dec ? cur.toFixed(dec) : String(Math.round(cur));
    if (raw.includes(',')) txt = Number(txt).toLocaleString('en-IN');
    return m[1] + txt + m[3];
  }

  private readonly rtTrack = viewChild<ElementRef<HTMLElement>>('rtTrack');
  protected slide(el: HTMLElement, dir: 1 | -1) {
    el.scrollBy({ left: dir * Math.max(240, el.clientWidth * 0.8), behavior: 'smooth' });
  }
  protected scrollRoutes(dir: 1 | -1) {
    const el = this.rtTrack()?.nativeElement;
    if (el) el.scrollBy({ left: dir * Math.max(240, el.clientWidth * 0.8), behavior: 'smooth' });
  }
  protected readonly open = signal('');
  protected readonly faqTab = signal(0);
  protected faqPick(i: number) {
    this.faqTab.set(i);
    this.open.set('');
  }
  protected readonly couponOpen = signal(false);
  /** Falls back to the drawn illustration if the hero photo can't load. */
  protected readonly artFailed = signal(false);

  protected pickRoute(r: RouteInfo) {
    this.s.pickRoute(r);
    this.router.navigateByUrl(this.s.resultsRoute());
  }
  protected again(r: RecentSearch) {
    this.s.searchAgain(r);
    this.router.navigateByUrl(this.s.resultsRoute());
  }
}
