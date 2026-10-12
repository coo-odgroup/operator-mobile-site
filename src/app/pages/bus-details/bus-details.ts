import { Location } from '@angular/common';
import { CurrencyPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Store, short } from '../../core/store';
import { Icon } from '../../shared/icon/icon';

@Component({
  selector: 'app-bus-details',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Icon, CurrencyPipe],
  templateUrl: './bus-details.html',
  styleUrl: './bus-details.scss',
})
export class BusDetails {
  protected readonly s = inject(Store);
  private readonly router = inject(Router);
  private readonly location = inject(Location);
  protected readonly short = short;
  protected readonly b = this.s.bus;

  // Gradient placeholders - swap for real bus photos.
  protected readonly photos = [
    'linear-gradient(135deg,#5b3df5,#2b7fff)',
    'linear-gradient(135deg,#d6336c,#7a22e8)',
    'linear-gradient(135deg,#0f9d8a,#3b6cf5)',
  ];

  protected readonly dateShort = computed(() =>
    new Date(this.s.search().date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
  );
  protected readonly from = computed(() => this.s.search().from || 'New York');
  protected readonly to = computed(() => this.s.search().to || 'Boston');

  protected has(key: string) { return this.b().amenities.includes(key); }
  protected initial(name: string) { return name.charAt(0); }

  protected back() {
    if (history.length > 1) this.location.back();
    else this.router.navigateByUrl('/buses');
  }

  protected async share() {
    const text = `${this.b().operator}: ${this.from()} → ${this.to()}, ${this.dateShort()} at ${this.b().depart}`;
    try {
      if (navigator.share) await navigator.share({ title: this.s.brand, text });
      else {
        await navigator.clipboard.writeText(text);
        this.s.showToast('Bus details copied');
      }
    } catch {
      /* share sheet dismissed */
    }
  }

  protected next() { this.router.navigateByUrl('/seats'); }
}
