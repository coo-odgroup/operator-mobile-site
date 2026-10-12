import { CurrencyPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Store, fmtDate, short } from '../../core/store';
import { Icon } from '../../shared/icon/icon';
import { Stepper } from '../../shared/stepper/stepper';

@Component({
  selector: 'app-checkout',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Icon, RouterLink, CurrencyPipe, Stepper],
  templateUrl: './checkout.html',
  styleUrl: './checkout.scss',
})
export class Checkout {
  protected readonly s = inject(Store);
  private readonly router = inject(Router);
  protected readonly short = short;
  protected readonly fmt = fmtDate;

  protected readonly code = signal('');
  protected readonly adding = signal(false);
  protected readonly number = signal('');
  protected readonly expiry = signal('');
  protected readonly cvv = signal('');
  protected readonly error = signal('');

  protected readonly pax = computed(() => {
    const n = this.s.search().passengers;
    return `${n} ${n === 1 ? 'Adult' : 'Adults'}`;
  });

  protected apply() {
    if (!this.code().trim()) return this.s.showToast('Enter a promo code first');
    if (this.s.applyPromo(this.code())) this.code.set('');
  }

  /** Prototype only: only the last 4 digits are kept, in memory. Use your payment gateway's tokenised form for real cards. */
  protected addCard() {
    const digits = this.number().replace(/\D/g, '');
    const m = /^(0[1-9]|1[0-2])\/(\d{2})$/.exec(this.expiry().trim());
    if (digits.length < 15 || digits.length > 16) return this.error.set('Enter a valid card number.');
    if (!m) return this.error.set('Enter the expiry as MM/YY.');
    const exp = new Date(2000 + +m[2], +m[1], 0, 23, 59);
    if (exp < new Date()) return this.error.set('This card has expired.');
    if (!/^\d{3,4}$/.test(this.cvv())) return this.error.set('Enter the 3 or 4 digit CVV.');
    this.s.addCard(digits.slice(-4), this.expiry().trim());
    this.number.set('');
    this.expiry.set('');
    this.cvv.set('');
    this.error.set('');
    this.adding.set(false);
    this.s.showToast('Card added');
  }

  /** Formats the card number in groups of four as the user types. */
  protected onNumber(value: string) {
    this.number.set(value.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim());
  }

  // Prototype only: wire this to your payment gateway before going live.
  protected pay() {
    const card = this.s.cards().find((c) => c.id === this.s.cardId());
    if (!card) return this.s.showToast('Select a payment method first');
    this.s.confirmBooking(`Card •••• ${card.last4}`);
    this.router.navigateByUrl('/success');
  }
}
