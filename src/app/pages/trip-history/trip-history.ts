import { CurrencyPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Booking, Store, fmtDate, short } from '../../core/store';
import { Icon } from '../../shared/icon/icon';

@Component({
  selector: 'app-trip-history',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Icon, CurrencyPipe],
  templateUrl: './trip-history.html',
})
export class TripHistory {
  protected readonly s = inject(Store);
  private readonly router = inject(Router);
  protected readonly short = short;
  protected readonly fmt = fmtDate;

  protected again(b: Booking) {
    this.s.patchSearch({ from: b.from, to: b.to });
    this.s.commitSearch();
    this.router.navigateByUrl(this.s.resultsRoute());
  }
}
