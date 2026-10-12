import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Store } from '../../core/store';
import { Icon } from '../../shared/icon/icon';
import { OfferCard } from '../../shared/offer-card/offer-card';

@Component({
  selector: 'app-offers',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Icon, OfferCard, DecimalPipe],
  styleUrl: './offers.scss',
  templateUrl: './offers.html',
})
export class Offers {
  protected readonly s = inject(Store);
  protected readonly code = signal('');

  protected pct(need: number) { return Math.min(100, Math.round((this.s.points / need) * 100)); }

  protected apply() {
    if (!this.code().trim()) return this.s.showToast('Enter a promo code first');
    if (this.s.applyPromo(this.code())) this.code.set('');
  }

  protected async share() {
    const text = `Join me on ${this.s.brand} and get $15 off your first trip!`;
    try {
      if (navigator.share) await navigator.share({ title: this.s.brand, text, url: location.origin });
      else {
        await navigator.clipboard.writeText(`${text} ${location.origin}`);
        this.s.showToast('Invite link copied');
      }
    } catch {
      /* user cancelled the share sheet */
    }
  }
}
