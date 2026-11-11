import { ChangeDetectionStrategy, Component, ElementRef, inject, input, signal, viewChild } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Offer, Store } from '../../core/store';
import { CouponModal } from '../coupon-modal/coupon-modal';
import { Icon } from '../icon/icon';

/** Horizontally scrolling coupon cards. Tap a card for details; "Copy" copies the code straight away. */
@Component({
  selector: 'app-offers-carousel',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Icon, CouponModal, RouterLink],
  styleUrl: './offers-carousel.scss',
  templateUrl: './offers-carousel.html',
})
export class OffersCarousel {
  readonly offers = input.required<Offer[]>();
  readonly title = input('Offers for you');
  /** Optional "View all" link target (e.g. '/offers'); the link is hidden when not set. */
  readonly viewAll = input<string | null>(null);

  protected readonly active = signal<Offer | null>(null);
  private readonly s = inject(Store);
  private readonly track = viewChild<ElementRef<HTMLElement>>('track');

  protected scroll(dir: 1 | -1) {
    const el = this.track()?.nativeElement;
    if (el) el.scrollBy({ left: dir * Math.max(240, el.clientWidth * 0.8), behavior: 'smooth' });
  }

  protected async copy(code: string, ev: Event) {
    ev.stopPropagation();
    try {
      await navigator.clipboard.writeText(code);
      this.s.showToast(`Code ${code} copied`);
    } catch {
      this.s.showToast(`Use code ${code}`);
    }
  }
}
