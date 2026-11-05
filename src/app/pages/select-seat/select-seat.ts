import { CurrencyPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, ElementRef, computed, inject, input, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Store } from '../../core/store';
import { Icon } from '../../shared/icon/icon';
import { Stepper } from '../../shared/stepper/stepper';
import { DeckKey, MAX_SEATS, SeatCell, loadDecks, pruneSelection, toggleSelection } from './seat-layout';

@Component({
  selector: 'app-select-seat',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Icon, CurrencyPipe, Stepper],
  styleUrl: './select-seat.scss',
  templateUrl: './select-seat.html',
})
export class SelectSeat {
  protected readonly s = inject(Store);
  private readonly router = inject(Router);
  protected readonly max = MAX_SEATS;

  /** True when shown inside the seat pop-up on the bus list: no stepper, tighter spacing. */
  readonly embedded = input(false);

  /** This bus's layout. Desktop shows both decks side by side; mobile shows one at a time. */
  private readonly loaded = computed(() => loadDecks(this.s.bus().id));
  protected readonly decks = computed(() => this.loaded().decks);
  protected readonly error = computed(() => this.loaded().error);
  protected readonly active = signal<DeckKey>('lower');

  // ---- Mobile flow in the pop-up: 1) pick seats, 2) pick boarding / dropping point (desktop shows both at once) ----
  protected readonly step = signal<'seats' | 'points'>('seats');
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  protected goSeats() { this.step.set('seats'); this.toTop(); }
  protected mobileContinue() {
    if (this.step() === 'seats') { if (this.s.seats().length) { this.step.set('points'); this.toTop(); } }
    else this.pointsContinue();
  }
  private toTop() { this.host.nativeElement.closest('.sheet-body')?.scrollTo({ top: 0 }); }

  // ---- Boarding / dropping points (pop-up) ----
  protected readonly ptsTab = signal<'board' | 'drop'>('board');
  protected readonly ptsQuery = signal('');
  protected readonly ptsSelected = computed(() => (this.ptsTab() === 'board' ? this.s.pickupIdx() : this.s.dropIdx()));
  protected readonly ptsList = computed(() => {
    const src = this.ptsTab() === 'board' ? this.s.pickupPoints() : this.s.dropPoints();
    const q = this.ptsQuery().trim().toLowerCase();
    return src.map((p, i) => ({ ...p, i })).filter((p) => !q || (p.name + ' ' + p.detail).toLowerCase().includes(q));
  });
  protected setTab(t: 'board' | 'drop') { this.ptsTab.set(t); this.ptsQuery.set(''); }
  /**
   * Boarding point chosen -> straight on to the dropping tab.
   * Dropping point chosen -> just ticked; Continue takes the person on.
   */
  protected choosePoint(i: number) {
    if (this.ptsTab() === 'board') {
      this.s.pickupIdx.set(i);
      setTimeout(() => this.setTab('drop'), 180); // brief pause so the tick is seen
      return;
    }
    this.s.dropIdx.set(i);
  }

  /** Continue inside the points box: boarding tab -> dropping tab, dropping tab -> next step (Verify). */
  protected pointsContinue() {
    if (this.ptsTab() === 'board') { this.setTab('drop'); return; }
    if (!this.s.seats().length) { this.s.showToast('Select your seat(s) to continue'); return; }
    this.next();
  }

  constructor() {
    // Drop anything selected earlier that is not a free seat on this bus.
    this.s.seats.update((list) => pruneSelection(list, this.decks()));
  }

  protected isSel(c: SeatCell) { return this.s.seats().includes(c.id); }

  /** Seats are checkboxes: tick to add, untick to remove, up to MAX_SEATS. */
  protected onToggle(c: SeatCell, ev: Event) {
    const box = ev.target as HTMLInputElement;
    if (c.booked) { box.checked = false; return; }
    const r = toggleSelection(this.s.seats(), c.id, MAX_SEATS);
    if (r.blocked) {
      box.checked = false; // undo the tick, the limit is reached
      this.s.showToast(`You can select up to ${MAX_SEATS} seats`);
      return;
    }
    this.s.seats.set(r.selected);
  }

  protected next() {
    const n = this.s.seats().length;
    if (!n) return;
    // Later pages (checkout, ticket) read the passenger count: keep it equal to the seats chosen.
    this.s.patchSearch({ passengers: n });
    this.router.navigateByUrl('/verification');
  }
}
