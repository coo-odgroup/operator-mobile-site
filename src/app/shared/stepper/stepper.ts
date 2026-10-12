import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** Booking progress: Seats → Verify → Payment → Ticket. `current` is the 0-based active step. */
@Component({
  selector: 'app-stepper',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './stepper.html',
  styleUrl: './stepper.scss',
})
export class Stepper {
  readonly current = input(0);
  /** When true every step is shown as completed (booking confirmation). */
  readonly done = input(false);
  protected readonly steps = ['Seats', 'Verify', 'Payment', 'Ticket'];
}
