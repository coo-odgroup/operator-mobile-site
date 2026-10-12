import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Booking, Store, fmtDate, short } from '../../core/store';
import { Icon } from '../../shared/icon/icon';

@Component({
  selector: 'app-bookings',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Icon, RouterLink],
  styleUrl: './bookings.scss',
  templateUrl: './bookings.html',
})
export class Bookings {
  protected readonly s = inject(Store);
  private readonly router = inject(Router);
  protected readonly short = short;
  protected readonly fmt = fmtDate;

  protected complete(b: Booking) {
    this.s.resume(b);
    this.router.navigateByUrl('/seats');
  }
}
