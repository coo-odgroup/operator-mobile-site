import { ChangeDetectionStrategy, Component, HostListener, computed, inject, signal } from '@angular/core';
import { Store } from '../../core/store';
import { Icon } from '../../shared/icon/icon';

/** Bus details (amenities, photos, pickup/drop, policy, reviews) shown under the seat layout in the pop-up. */
@Component({
  selector: 'app-bus-info',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Icon],
  templateUrl: './bus-info.html',
  styleUrl: './bus-info.scss',
})
export class BusInfo {
  protected readonly s = inject(Store);
  protected readonly b = this.s.bus;

  // Gradient placeholders - swap for real bus photos by filling `url` (the gradient is the fallback).
  // Photos are files in public/photos/ (served as /photos/...). Each item shows its `url`; when a photo is
  // missing or fails to load, the gradient `bg` is shown instead. Later this list can come from the API per bus.
  protected readonly photos: { label: string; bg: string; url?: string }[] = [
    { label: 'Malleswari · Executive Luxury A/C', bg: 'linear-gradient(135deg,#f08a24,#d6336c)', url: '/photos/malleswari-luxury-ac.jpg' },
    { label: 'Padhi Bus · Sleeper', bg: 'linear-gradient(135deg,#2b7fff,#0f9d8a)', url: '/photos/padhi-bus-sleeper.jpg' },
  ];
  /** URLs that failed to load (shown as the gradient instead). */
  protected readonly broken = signal<ReadonlySet<string>>(new Set());
  protected markBroken(url: string) { this.broken.update((s) => new Set(s).add(url)); }
  protected src(p: { url?: string }) { return p.url && !this.broken().has(p.url) ? p.url : null; }

  // ---- Photo viewer (full-screen) ----
  /** Index of the photo being viewed, or null when the viewer is closed. */
  readonly viewing = signal<number | null>(null);
  private opener: HTMLElement | null = null;
  private touchX = 0;

  protected openPhoto(i: number, ev: Event) {
    this.opener = ev.currentTarget as HTMLElement;
    this.viewing.set(i);
  }
  protected closePhoto() {
    this.viewing.set(null);
    this.opener?.focus({ preventScroll: true });
  }
  protected step(d: number) {
    const i = this.viewing();
    if (i === null) return;
    const n = this.photos.length;
    this.viewing.set((i + d + n) % n);
  }
  protected onTouchStart(ev: TouchEvent) { this.touchX = ev.changedTouches[0].clientX; }
  protected onTouchEnd(ev: TouchEvent) {
    const dx = ev.changedTouches[0].clientX - this.touchX;
    if (Math.abs(dx) > 50) this.step(dx < 0 ? 1 : -1);
  }

  @HostListener('document:keydown.escape')
  protected onEsc() { if (this.viewing() !== null) this.closePhoto(); }
  @HostListener('document:keydown.arrowright')
  protected onRight() { this.step(1); }
  @HostListener('document:keydown.arrowleft')
  protected onLeft() { this.step(-1); }

  protected readonly dateShort = computed(() =>
    new Date(this.s.search().date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
  );
  protected readonly from = computed(() => this.s.search().from || 'New York');
  protected readonly to = computed(() => this.s.search().to || 'Boston');

  protected has(key: string) { return this.b().amenities.includes(key); }
  protected initial(name: string) { return name.charAt(0); }
}
