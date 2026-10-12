import { ChangeDetectionStrategy, Component, inject, input, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Store, addDays, todayIso } from '../../core/store';
import { Icon } from '../icon/icon';

/** Trip search card. mode="simple" = Home "Find Your Bus", mode="full" = Search "Find Your Trip". */
@Component({
  selector: 'app-search-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Icon],
  styleUrl: './search-form.scss',
  templateUrl: './search-form.html',
})
export class SearchForm {
  readonly mode = input<'simple' | 'full'>('simple');
  protected readonly s = inject(Store);
  private readonly router = inject(Router);
  protected readonly today = todayIso();
  protected readonly tomorrow = addDays(todayIso(), 1);
  protected readonly error = signal('');

  protected set(key: string, value: string | number | boolean) {
    this.s.patchSearch({ [key]: value });
    this.error.set('');
  }

  protected quick(n: number) {
    this.set('date', addDays(this.today, n));
  }

  protected go(e: Event) {
    e.preventDefault();
    const q = this.s.search();
    if (!q.from || !q.to) return this.error.set('Choose both a departure and a destination city.');
    if (q.from === q.to) return this.error.set('Departure and destination must be different.');
    if (!q.date) return this.error.set('Pick a date of journey.');
    this.s.commitSearch();
    this.router.navigateByUrl(this.s.resultsRoute());
  }
}
