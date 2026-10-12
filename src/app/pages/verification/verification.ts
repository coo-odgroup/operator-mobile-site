import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Store } from '../../core/store';
import { Icon } from '../../shared/icon/icon';
import { Stepper } from '../../shared/stepper/stepper';

@Component({
  selector: 'app-verification',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Icon, RouterLink, Stepper],
  styleUrl: './verification.scss',
  templateUrl: './verification.html',
})
export class Verification {
  protected readonly s = inject(Store);
  private readonly router = inject(Router);
  protected readonly name = signal(this.s.profile().name);
  protected readonly phone = signal(this.s.profile().phone);
  protected readonly email = signal(this.s.profile().email);
  protected readonly otp = signal('');
  protected readonly otpSent = signal(false);
  protected readonly error = signal('');
  protected readonly otpError = signal('');

  protected sendOtp() {
    if (!this.name().trim()) return this.error.set('Enter the passenger name.');
    if (this.phone().replace(/\D/g, '').length < 10) return this.error.set('Enter a valid mobile number.');
    if (!/^\S+@\S+\.\S+$/.test(this.email())) return this.error.set('Enter a valid email address.');
    this.error.set('');
    this.otpSent.set(true);
  }

  protected verify() {
    if (this.otp().length !== 4) return this.otpError.set('Enter the 4-digit code.');
    this.otpError.set('');
    this.router.navigateByUrl('/checkout');
  }
}
