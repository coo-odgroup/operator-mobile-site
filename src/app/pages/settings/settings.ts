import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Store } from '../../core/store';
import { Icon } from '../../shared/icon/icon';

@Component({
  selector: 'app-settings',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Icon, RouterLink],
  styleUrl: './settings.scss',
  templateUrl: './settings.html',
})
export class Settings {
  protected readonly s = inject(Store);
  private readonly router = inject(Router);

  protected soon(what: string) { this.s.showToast(`${what} - connect this to your backend`); }
  protected signOut() {
    this.s.showToast('Signed out');
    this.router.navigateByUrl('/home');
  }
}
