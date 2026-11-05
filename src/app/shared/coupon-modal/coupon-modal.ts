import { DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, HostListener, inject, input, output, signal } from '@angular/core';
import { BusOffer } from '../../core/store';
import { lockScroll } from '../scroll-lock/scroll-lock';

/** Coupon details pop-up: shows the offer and a button that copies the code. */
@Component({
  selector: 'app-coupon-modal',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './coupon-modal.scss',
  templateUrl: './coupon-modal.html',
})
export class CouponModal {
  readonly offer = input.required<BusOffer>();
  readonly closed = output<void>();

  protected readonly copied = signal(false);
  private readonly doc = inject(DOCUMENT);
  private timer: ReturnType<typeof setTimeout> | undefined;

  constructor() {
    const release = lockScroll(this.doc.body);
    inject(DestroyRef).onDestroy(() => { release(); clearTimeout(this.timer); });
  }

  protected async copy() {
    const code = this.offer().code;
    try {
      await navigator.clipboard.writeText(code);
    } catch {
      // Older browsers / non-secure pages: fall back to a temporary text box.
      const ta = this.doc.createElement('textarea');
      ta.value = code;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      this.doc.body.appendChild(ta);
      ta.select();
      try { this.doc.execCommand('copy'); } catch { /* nothing more to try */ }
      ta.remove();
    }
    this.copied.set(true);
    clearTimeout(this.timer);
    this.timer = setTimeout(() => this.copied.set(false), 2000);
  }

  @HostListener('document:keydown.escape')
  protected onEscape() { this.closed.emit(); }
}
