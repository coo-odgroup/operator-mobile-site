import { CurrencyPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
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

  /** This bus's layout. Desktop shows both decks side by side; mobile shows one at a time. */
  private readonly loaded = computed(() => loadDecks(this.s.bus().id));
  protected readonly decks = computed(() => this.loaded().decks);
  protected readonly error = computed(() => this.loaded().error);
  protected readonly active = signal<DeckKey>('lower');

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
