import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Store, fmtDate, todayIso } from '../../core/store';
import { Icon } from '../icon/icon';

/**
 * "Modify search" bar for the top of the bus list.
 * Shows a one-line summary with a Modify button; pressing it opens the fields (From, swap, To, Date, Search).
 * Nothing changes until Search is pressed, so the list doesn't jump while the person is typing.
 */
@Component({
  selector: 'app-modify-search',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Icon],
  styleUrl: './modify-search.scss',
  templateUrl: './modify-search.html',
})
export class ModifySearch {
  protected readonly s = inject(Store);
  private readonly router = inject(Router);

  protected readonly fmt = fmtDate;
  protected readonly today = todayIso();

  protected readonly open = signal(false);
  protected readonly error = signal('');

  // Draft values: copied from the current search when the bar opens.
  // Same fallback route the list itself shows when nothing has been searched yet.
  protected readonly from = signal(this.s.search().from || 'New York');
  protected readonly to = signal(this.s.search().to || 'Boston');
  protected readonly curFrom = () => this.s.search().from || 'New York';
  protected readonly curTo = () => this.s.search().to || 'Boston';
  protected readonly date = signal(this.s.search().date);

  protected toggle() {
    if (!this.open()) this.resetDraft();
    this.open.set(!this.open());
    this.error.set('');
  }

  /** Start from whatever the current search is (it may have changed since the bar was created). */
  protected resetDraft() {
    const q = this.s.search();
    this.from.set(q.from || 'New York');
    this.to.set(q.to || 'Boston');
    this.date.set(q.date);
  }

  protected swap() {
    const f = this.from();
    this.from.set(this.to());
    this.to.set(f);
    this.error.set('');
  }

  protected submit(e: Event) {
    e.preventDefault();
    if (!this.from() || !this.to()) return this.error.set('Choose both a departure and a destination city.');
    if (this.from() === this.to()) return this.error.set('Departure and destination must be different.');
    if (!this.date()) return this.error.set('Pick a date of journey.');
    this.s.patchSearch({ from: this.from(), to: this.to(), date: this.date() });
    this.s.commitSearch();
    this.open.set(false);
    this.error.set('');
    // Same results page (this also closes an open seat pop-up / details drawer); "no buses" page if nothing runs.
    this.router.navigateByUrl(this.s.resultsRoute());
  }
}
