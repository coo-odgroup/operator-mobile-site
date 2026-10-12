import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Store, fmtDate, short } from '../../core/store';
import { Icon } from '../../shared/icon/icon';

/**
 * Decorative QR placeholder generated from the booking id.
 * It is NOT scannable - swap in the code issued by your ticketing API.
 */
function pseudoQr(seed: string, n = 21): { x: number; y: number }[] {
  let h = 2166136261;
  for (const ch of seed) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  const cells: { x: number; y: number }[] = [];
  const finder = (x: number, y: number) => (x < 8 && y < 8) || (x >= n - 8 && y < 8) || (x < 8 && y >= n - 8);
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      if (finder(x, y)) continue;
      h = Math.imul(h ^ (x * 31 + y), 16777619) >>> 0;
      if ((h >>> 7) % 2 === 0) cells.push({ x, y });
    }
  }
  const eye = (ox: number, oy: number) => {
    for (let i = 0; i < 7; i++) for (let j = 0; j < 7; j++) {
      const edge = i === 0 || j === 0 || i === 6 || j === 6;
      const core = i >= 2 && i <= 4 && j >= 2 && j <= 4;
      if (edge || core) cells.push({ x: ox + i, y: oy + j });
    }
  };
  eye(0, 0); eye(n - 7, 0); eye(0, n - 7);
  return cells;
}

@Component({
  selector: 'app-tickets',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Icon, RouterLink],
  styleUrl: './tickets.scss',
  templateUrl: './tickets.html',
})
export class Tickets {
  private readonly s = inject(Store);
  protected readonly short = short;
  protected readonly fmt = fmtDate;
  protected readonly confirmed = computed(() => this.s.bookings().filter((b) => b.status === 'Confirmed'));
  private readonly cache = new Map<string, { x: number; y: number }[]>();
  protected qr(id: string) {
    if (!this.cache.has(id)) this.cache.set(id, pseudoQr(id));
    return this.cache.get(id)!;
  }
}
