import { CurrencyPipe, NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { BOOKED_SEATS, SEAT_ROWS, Store } from '../../core/store';
import { Icon } from '../../shared/icon/icon';
import { Stepper } from '../../shared/stepper/stepper';

@Component({
  selector: 'app-select-seat',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Icon, CurrencyPipe, NgTemplateOutlet, Stepper],
  styleUrl: './select-seat.scss',
  templateUrl: './select-seat.html',
})
export class SelectSeat {
  protected readonly s = inject(Store);
  private readonly router = inject(Router);
  protected readonly rows = Array.from({ length: SEAT_ROWS }, (_, i) => i + 1);
  protected isBooked(id: string) { return BOOKED_SEATS.includes(id); }
  protected next() { this.router.navigateByUrl('/verification'); }
}
