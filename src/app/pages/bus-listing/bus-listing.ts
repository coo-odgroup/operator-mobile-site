import { CurrencyPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Store, fmtDate, short } from '../../core/store';
import { Icon } from '../../shared/icon/icon';

type Sort = 'cheapest' | 'fastest' | 'earliest';

@Component({
  selector: 'app-bus-listing',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Icon, CurrencyPipe],
  styleUrl: './bus-listing.scss',
  templateUrl: './bus-listing.html',
})
export class BusListing {
  protected readonly s = inject(Store);
  private readonly router = inject(Router);
  protected readonly short = short;
  protected readonly fmt = fmtDate;
  protected readonly sort = signal<Sort>('earliest');
  protected readonly sorts: { key: Sort; label: string }[] = [
    { key: 'earliest', label: 'Earliest' },
    { key: 'cheapest', label: 'Cheapest' },
    { key: 'fastest', label: 'Fastest' },
  ];

  protected readonly from = computed(() => this.s.search().from || 'New York');
  protected readonly to = computed(() => this.s.search().to || 'Boston');
  protected readonly saved = computed(() => this.s.isSaved(this.from(), this.to()));
  protected readonly list = computed(() => {
    const l = [...this.s.buses()];
    if (this.sort() === 'cheapest') l.sort((a, b) => a.price - b.price);
    if (this.sort() === 'fastest') l.sort((a, b) => a.minutes - b.minutes || a.price - b.price);
    return l;
  });

  protected pick(id: number) {
    this.s.selectBus(id);
    this.router.navigateByUrl('/bus-details');
  }
}
