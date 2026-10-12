import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { Router } from '@angular/router';
import { Offer, Store } from '../../core/store';
import { Icon } from '../icon/icon';

@Component({
  selector: 'app-offer-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Icon],
  styleUrl: './offer-card.scss',
  templateUrl: './offer-card.html',
})
export class OfferCard {
  readonly offer = input.required<Offer>();
  readonly action = input(false);
  private readonly s = inject(Store);
  private readonly router = inject(Router);

  protected use() {
    if (this.s.applyPromo(this.offer().code)) this.router.navigateByUrl('/search');
  }
}
