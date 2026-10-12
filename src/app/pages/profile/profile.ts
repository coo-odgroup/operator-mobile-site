import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Profile, Store, fmtDate } from '../../core/store';
import { Icon } from '../../shared/icon/icon';

@Component({
  selector: 'app-profile',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Icon, RouterLink, DecimalPipe],
  styleUrl: './profile.scss',
  templateUrl: './profile.html',
})
export class ProfilePage {
  protected readonly s = inject(Store);
  private readonly router = inject(Router);
  protected readonly fmt = fmtDate;
  protected readonly editing = signal(false);
  protected readonly draft = signal<Profile>(this.s.profile());
  protected readonly error = signal('');

  protected readonly prefs = [
    { t: 'Language', s: 'English (US)', icon: 'globe', tone: 'teal' },
    { t: 'Currency', s: 'USD ($)', icon: 'tag', tone: 'ok' },
    { t: 'Notifications', s: 'Manage notification preferences', icon: 'bell', tone: 'red' },
    { t: 'Privacy Settings', s: 'Manage your privacy preferences', icon: 'shield', tone: 'warn' },
  ];

  protected edit() { this.draft.set({ ...this.s.profile() }); this.error.set(''); this.editing.set(true); }
  protected cancel() { this.editing.set(false); }
  protected set(key: keyof Profile, value: string) { this.draft.update((d) => ({ ...d, [key]: value })); }

  protected save() {
    const d = this.draft();
    if (!d.name.trim()) return this.error.set('Name cannot be empty.');
    if (!/^\S+@\S+\.\S+$/.test(d.email)) return this.error.set('Enter a valid email address.');
    this.s.profile.set({ ...d, name: d.name.trim() });
    this.editing.set(false);
    this.s.showToast('Profile updated');
  }

  protected download() {
    const data = { profile: this.s.profile(), bookings: this.s.bookings(), history: this.s.history(), points: this.s.points };
    const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = 'my-data.json';
    a.click();
    URL.revokeObjectURL(url);
  }

  protected signOut() {
    this.s.showToast('Signed out');
    this.router.navigateByUrl('/home');
  }
}
