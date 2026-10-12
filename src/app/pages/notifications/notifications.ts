import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { AppNotification, Store } from '../../core/store';
import { Icon } from '../../shared/icon/icon';

type Filter = 'all' | 'booking' | 'offer' | 'system';

@Component({
  selector: 'app-notifications',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Icon],
  templateUrl: './notifications.html',
  styleUrl: './notifications.scss',
})
export class Notifications {
  protected readonly s = inject(Store);
  protected readonly filter = signal<Filter>('all');
  protected readonly filters: { key: Filter; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'booking', label: 'Bookings' },
    { key: 'offer', label: 'Offers' },
    { key: 'system', label: 'System' },
  ];
  private readonly meta: Record<AppNotification['kind'], { icon: string; tone: string }> = {
    booking: { icon: 'ticket', tone: '' },
    offer: { icon: 'tag', tone: 'red' },
    system: { icon: 'check-circle', tone: 'ok' },
  };

  protected readonly groups = computed(() => {
    const f = this.filter();
    const list = this.s.notifications().filter((n) => f === 'all' || n.kind === f);
    return (['Today', 'Yesterday'] as const)
      .map((g) => ({ name: g, items: list.filter((n) => n.group === g) }))
      .filter((g) => g.items.length);
  });

  protected iconOf(n: AppNotification) { return this.meta[n.kind]; }
}
