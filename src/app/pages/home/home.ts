import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { RecentSearch, RouteInfo, Store, fmtDate, short } from '../../core/store';
import { Icon } from '../../shared/icon/icon';
import { OfferCard } from '../../shared/offer-card/offer-card';
import { SearchForm } from '../../shared/search-form/search-form';

@Component({
  selector: 'app-home',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SearchForm, OfferCard, Icon],
  styleUrl: './home.scss',
  templateUrl: './home.html',
})
export class Home {
  protected readonly s = inject(Store);
  private readonly router = inject(Router);
  protected readonly short = short;
  protected readonly fmt = fmtDate;

  protected pickRoute(r: RouteInfo) {
    this.s.pickRoute(r);
    this.router.navigateByUrl(this.s.resultsRoute());
  }
  protected again(r: RecentSearch) {
    this.s.searchAgain(r);
    this.router.navigateByUrl(this.s.resultsRoute());
  }
}
