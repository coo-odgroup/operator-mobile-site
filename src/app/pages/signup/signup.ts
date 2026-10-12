import { Location } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Store } from '../../core/store';
import { Icon } from '../../shared/icon/icon';

@Component({
  selector: 'app-signup',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Icon, RouterLink],
  templateUrl: './signup.html',
  styleUrl: './signup.scss',
})
export class Signup {
  protected readonly s = inject(Store);
  private readonly router = inject(Router);
  private readonly location = inject(Location);

  protected readonly name = signal('');
  protected readonly email = signal('');
  protected readonly phone = signal('');
  protected readonly password = signal('');
  protected readonly show = signal(false);
  protected readonly agree = signal(false);
  protected readonly error = signal('');

  /** 0 = nothing typed, 1 weak, 2 medium, 3 strong. */
  protected readonly strength = computed(() => {
    const p = this.password();
    if (!p) return 0;
    const score = [p.length >= 8, /[A-Z]/.test(p) && /[a-z]/.test(p), /\d/.test(p), /[^A-Za-z0-9]/.test(p)].filter(Boolean).length;
    return score <= 1 ? 1 : score <= 3 ? 2 : 3;
  });
  protected readonly strengthLabel = computed(() => ['', 'Weak', 'Medium', 'Strong'][this.strength()]);

  protected back() {
    if (history.length > 1) this.location.back();
    else this.router.navigateByUrl('/login');
  }

  /** Prototype only: replace with a call to your sign-up API. */
  protected submit() {
    if (!this.name().trim()) return this.error.set('Enter your full name.');
    if (!/^\S+@\S+\.\S+$/.test(this.email())) return this.error.set('Enter a valid email address.');
    if (this.phone().replace(/\D/g, '').length < 10) return this.error.set('Enter a valid phone number.');
    if (this.password().length < 8) return this.error.set('Password must be at least 8 characters.');
    if (!this.agree()) return this.error.set('Please accept the Terms of Service and Privacy Policy.');
    this.error.set('');
    this.s.signUp(this.name().trim(), this.email().trim(), this.phone().trim());
    this.s.showToast('Account created');
    this.router.navigateByUrl('/home');
  }
}
