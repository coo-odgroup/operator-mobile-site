import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { RouteInfo, Store, short } from '../../core/store';
import { Icon } from '../../shared/icon/icon';

@Component({
  selector: 'app-saved-routes',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Icon, RouterLink],
  templateUrl: './saved-routes.html',
})
export class SavedRoutes {
  protected readonly s = inject(Store);
  private readonly router = inject(Router);
  protected readonly short = short;

  protected go(r: RouteInfo) {
    this.s.pickRoute(r);
    this.router.navigateByUrl(this.s.resultsRoute());
  }
}
