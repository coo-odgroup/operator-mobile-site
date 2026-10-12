import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { RecentSearch, Store, fmtDate, short } from '../../core/store';
import { Icon } from '../../shared/icon/icon';
import { SearchForm } from '../../shared/search-form/search-form';

@Component({
  selector: 'app-search-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SearchForm, Icon],
  styleUrl: './search.scss',
  templateUrl: './search.html',
})
export class SearchPage {
  protected readonly s = inject(Store);
  private readonly router = inject(Router);
  protected readonly short = short;
  protected readonly fmt = fmtDate;

  protected again(r: RecentSearch) {
    this.s.searchAgain(r);
    this.router.navigateByUrl(this.s.resultsRoute());
  }
  /** Tapping a destination pre-fills "To" and scrolls the user back to the form. */
  protected goTo(city: string) {
    this.s.patchSearch({ to: city, from: this.s.search().from === city ? '' : this.s.search().from });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}
