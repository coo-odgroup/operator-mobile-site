import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Store } from '../../core/store';
import { Icon } from '../../shared/icon/icon';

@Component({
  selector: 'app-login',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Icon, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login {
  protected readonly s = inject(Store);
  private readonly router = inject(Router);

  protected readonly email = signal('');
  protected readonly password = signal('');
  protected readonly show = signal(false);
  protected readonly remember = signal(false);
  protected readonly error = signal('');
  protected readonly social = [
    { key: 'Google', glyph: 'G' },
    { key: 'Facebook', glyph: 'f' },
    { key: 'Apple', glyph: 'A' },
  ];

  /** Prototype only: replace with a call to your auth API. */
  protected submit() {
    if (!/^\S+@\S+\.\S+$/.test(this.email())) return this.error.set('Enter a valid email address.');
    if (this.password().length < 6) return this.error.set('Password must be at least 6 characters.');
    this.error.set('');
    this.s.signIn(this.email().trim());
    this.s.showToast('Signed in');
    this.router.navigateByUrl('/home');
  }

  protected forgot() { this.s.showToast('Password reset - connect this to your auth provider'); }
  protected signInWith(provider: string) { this.s.showToast(`${provider} sign-in - connect this to your auth provider`); }
}
