import { CurrencyPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Store } from '../../core/store';
import { Icon } from '../../shared/icon/icon';

@Component({
  selector: 'app-no-buses',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Icon, RouterLink, CurrencyPipe],
  templateUrl: './no-buses.html',
  styleUrl: './no-buses.scss',
})
export class NoBuses {
  protected readonly s = inject(Store);
  private readonly router = inject(Router);

  protected pickDate(iso: string) {
    this.s.useDate(iso);
    this.router.navigateByUrl(this.s.resultsRoute());
  }
  protected pickAlt(via: string) {
    this.s.useAlternative(via);
    this.router.navigateByUrl(this.s.resultsRoute());
  }
}
