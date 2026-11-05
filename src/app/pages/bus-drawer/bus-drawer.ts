import { CurrencyPipe, DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, ElementRef, HostListener, afterNextRender, inject, output, signal, viewChild } from '@angular/core';
import { Store } from '../../core/store';
import { lockScroll } from '../../shared/scroll-lock/scroll-lock';
import { Icon } from '../../shared/icon/icon';
import { BusInfo } from '../bus-info/bus-info';

/** Bus details slide in from the right over the bus list, with a blurred backdrop. */
@Component({
  selector: 'app-bus-drawer',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Icon, BusInfo, CurrencyPipe],
  styleUrl: './bus-drawer.scss',
  templateUrl: './bus-drawer.html',
})
export class BusDrawer {
  protected readonly s = inject(Store);
  private readonly doc = inject(DOCUMENT);
  private readonly closeBtn = viewChild<ElementRef<HTMLButtonElement>>('closeBtn');

  private readonly info = viewChild(BusInfo);
  private readonly body = viewChild<ElementRef<HTMLElement>>('body');
  private readonly tabsEl = viewChild<ElementRef<HTMLElement>>('tabBar');

  /** Sections of the details, in page order. `key` matches data-sec in the bus-info markup. */
  protected readonly tabs = [
    { key: 'overview', label: 'Overview' },
    { key: 'amenities', label: 'Amenities' },
    { key: 'photos', label: 'Photos' },
    { key: 'pickup', label: 'Boarding point' },
    { key: 'drop', label: 'Dropping point' },
    { key: 'policy', label: 'Cancellation policy' },
    { key: 'reviews', label: 'Reviews' },
  ];
  protected readonly active = signal('overview');
  private pinned = false; // true while a tab click is scrolling, so the highlight does not flicker
  private pinTimer: ReturnType<typeof setTimeout> | undefined;

  readonly closed = output<void>();
  /** "Select seats" pressed inside the drawer. */
  readonly pick = output<number>();

  constructor() {
    // The list behind must not scroll while the drawer is open.
    inject(DestroyRef).onDestroy(lockScroll(this.doc.body));

    afterNextRender(() => this.closeBtn()?.nativeElement.focus({ preventScroll: true }));
  }

  @HostListener('document:keydown.escape')
  protected onEscape() {
    if ((this.info()?.viewing() ?? null) !== null) return; // Esc closes the photo viewer first
    this.closed.emit();
  }

  private sections(): { key: string; top: number }[] {
    const body = this.body()?.nativeElement;
    if (!body) return [];
    const base = body.getBoundingClientRect().top - body.scrollTop;
    return this.tabs.flatMap((t) => {
      const el = body.querySelector<HTMLElement>(`[data-sec="${t.key}"]`);
      return el ? [{ key: t.key, top: el.getBoundingClientRect().top - base }] : [];
    });
  }

  /** Tab pressed: scroll the matching section to the top of the panel. */
  protected go(key: string) {
    const body = this.body()?.nativeElement;
    const sec = this.sections().find((s) => s.key === key);
    if (!body || !sec) return;
    this.active.set(key);
    this.revealTab(key);
    this.pinned = true;
    clearTimeout(this.pinTimer);
    this.pinTimer = setTimeout(() => (this.pinned = false), 700);
    const calm = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
    body.scrollTo({ top: Math.max(0, sec.top - 12), behavior: calm ? 'auto' : 'smooth' });
  }

  /** Panel scrolled: highlight the section that is at the top. */
  protected onScroll() {
    if (this.pinned) return;
    const body = this.body()?.nativeElement;
    if (!body) return;
    const secs = this.sections();
    let key = secs[0]?.key ?? 'overview';
    for (const s of secs) if (s.top - 24 <= body.scrollTop) key = s.key;
    // At the very bottom the last section may be too short to reach the top: highlight it anyway.
    if (body.scrollTop + body.clientHeight >= body.scrollHeight - 4 && secs.length) key = secs[secs.length - 1].key;
    if (key !== this.active()) { this.active.set(key); this.revealTab(key); }
  }

  /** Keep the highlighted tab visible in the (horizontally scrollable) tab strip. */
  private revealTab(key: string) {
    const bar = this.tabsEl()?.nativeElement;
    const btn = bar?.querySelector<HTMLElement>(`[data-tab="${key}"]`);
    if (!bar || !btn) return;
    bar.scrollTo({ left: btn.offsetLeft - (bar.clientWidth - btn.offsetWidth) / 2, behavior: 'smooth' });
  }
}
