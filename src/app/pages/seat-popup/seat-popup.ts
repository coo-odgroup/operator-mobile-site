import { DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, ElementRef, HostListener, afterNextRender, computed, inject, output, viewChild } from '@angular/core';
import { Store, fmtDate } from '../../core/store';
import { lockScroll } from '../../shared/scroll-lock/scroll-lock';
import { Icon } from '../../shared/icon/icon';
import { SelectSeat } from '../select-seat/select-seat';

/**
 * Seat selection as a pop-up over the bus list (like redBus).
 * The list page stays underneath, so closing it returns to the same filters and scroll position.
 */
@Component({
  selector: 'app-seat-popup',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Icon, SelectSeat],
  styleUrl: './seat-popup.scss',
  templateUrl: './seat-popup.html',
})
export class SeatPopup {
  protected readonly s = inject(Store);
  private readonly doc = inject(DOCUMENT);
  private readonly closeBtn = viewChild<ElementRef<HTMLButtonElement>>('closeBtn');

  readonly closed = output<void>();

  protected readonly from = computed(() => this.s.search().from || 'New York');
  protected readonly to = computed(() => this.s.search().to || 'Boston');
  protected readonly date = computed(() => fmtDate(this.s.search().date));

  constructor() {
    // The page behind must not scroll while the pop-up is open.
    inject(DestroyRef).onDestroy(lockScroll(this.doc.body));

    afterNextRender(() => this.closeBtn()?.nativeElement.focus());
  }

  @HostListener('document:keydown.escape')
  protected onEscape() { this.closed.emit(); }
}
