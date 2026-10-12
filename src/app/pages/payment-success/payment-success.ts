import { CurrencyPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Store, fmtDate, short, todayIso } from '../../core/store';
import { Icon } from '../../shared/icon/icon';
import { Stepper } from '../../shared/stepper/stepper';

@Component({
  selector: 'app-payment-success',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Icon, RouterLink, CurrencyPipe, Stepper],
  templateUrl: './payment-success.html',
  styleUrl: './payment-success.scss',
})
export class PaymentSuccess {
  protected readonly s = inject(Store);
  protected readonly short = short;
  protected readonly fmt = fmtDate;

  protected readonly shareOptions = [
    { key: 'message', icon: 'message', label: 'Share by message' },
    { key: 'link', icon: 'link', label: 'Copy link' },
    { key: 'share', icon: 'share', label: 'Share' },
    { key: 'mail', icon: 'mail', label: 'Share by email' },
  ];

  /** The booking just paid for, or the latest one when this page is opened directly. */
  protected readonly d = computed(() => {
    const b = this.s.lastBooking() ?? this.s.bookings()[0];
    const dateShort = new Date(b.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    return {
      id: b.id,
      bookedOn: b.bookedOn ?? todayIso(),
      pay: b.payLabel,
      total: b.total,
      operator: b.operator ?? 'BusGo Express',
      type: b.type ?? 'Premium Sleeper',
      from: b.from,
      to: b.to,
      dateShort,
      depart: b.time,
      arriveLine: b.arrive ? `${dateShort}, ${b.arrive}` : dateShort,
      passenger: b.passenger ?? this.s.profile().name,
      seats: b.seat.replace(/^Seats?\s*/, ''),
    };
  });

  protected async share(kind: string) {
    const d = this.d();
    const text = `My ${this.s.brand} trip: ${d.from} → ${d.to} on ${d.dateShort}, booking #${d.id}`;
    try {
      if (kind === 'link') {
        await navigator.clipboard.writeText(`${text} ${location.origin}`);
        this.s.showToast('Trip details copied');
      } else if (kind === 'mail') {
        location.href = `mailto:?subject=${encodeURIComponent('My trip details')}&body=${encodeURIComponent(text)}`;
      } else if (navigator.share) {
        await navigator.share({ title: this.s.brand, text });
      } else {
        await navigator.clipboard.writeText(text);
        this.s.showToast('Trip details copied');
      }
    } catch {
      /* share sheet dismissed */
    }
  }

  /** "Download PDF Ticket": opens the print dialog, where the user can choose Save as PDF. */
  protected printTicket() { window.print(); }
}
