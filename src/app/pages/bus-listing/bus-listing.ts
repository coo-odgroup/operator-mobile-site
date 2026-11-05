import { CurrencyPipe, DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, Component, WritableSignal, computed, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { map } from 'rxjs';
import { Bus, Store, fmtDate, short } from '../../core/store';
import { releaseStaleScrollLock } from '../../shared/scroll-lock/scroll-lock';
import { Icon } from '../../shared/icon/icon';
import { BusDrawer } from '../bus-drawer/bus-drawer';
import { SeatPopup } from '../seat-popup/seat-popup';

type Sort = 'cheapest' | 'fastest' | 'earliest';
type BusType = 'ac' | 'seater' | 'sleeper';
type DepartSlot = 'morning' | 'day' | 'evening' | 'night';

const BUS_TYPES: { key: BusType; label: string }[] = [
  { key: 'ac', label: 'AC' },
  { key: 'seater', label: 'Seater' },
  { key: 'sleeper', label: 'Sleeper' },
];

// Slots follow the left filter card: Before 10 AM, 10 AM - 5 PM, 5 PM - 11 PM, After 11 PM.
const DEPART_SLOTS: { key: DepartSlot; label: string; from: number; to: number }[] = [
  { key: 'morning', label: 'Before 10 AM', from: 0, to: 10 * 60 },
  { key: 'day', label: '10 AM - 5 PM', from: 10 * 60, to: 17 * 60 },
  { key: 'evening', label: '5 PM - 11 PM', from: 17 * 60, to: 23 * 60 },
  { key: 'night', label: 'After 11 PM', from: 23 * 60, to: 24 * 60 },
];

const toMinutes = (t: string) => {
  const m = /(\d+):(\d+)\s*(AM|PM)/i.exec(t);
  if (!m) return 0;
  return ((+m[1] % 12) + (m[3].toUpperCase() === 'PM' ? 12 : 0)) * 60 + +m[2];
};

@Component({
  selector: 'app-bus-listing',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Icon, CurrencyPipe, SeatPopup, BusDrawer],
  styleUrl: './bus-listing.scss',
  templateUrl: './bus-listing.html',
})
export class BusListing {
  protected readonly s = inject(Store);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly doc = inject(DOCUMENT);
  protected readonly short = short;
  protected readonly fmt = fmtDate;
  protected readonly sort = signal<Sort>('earliest');
  protected readonly sorts: { key: Sort; label: string }[] = [
    { key: 'earliest', label: 'Earliest' },
    { key: 'cheapest', label: 'Cheapest' },
    { key: 'fastest', label: 'Fastest' },
  ];

  protected readonly from = computed(() => this.s.search().from || 'New York');
  protected readonly to = computed(() => this.s.search().to || 'Boston');
  protected readonly saved = computed(() => this.s.isSaved(this.from(), this.to()));

  // ---------- Filters ----------
  protected readonly busTypes = BUS_TYPES;
  protected readonly departSlots = DEPART_SLOTS;

  protected readonly filtersOpen = signal(false); // mobile only: the card is always open on desktop
  protected readonly typeSel = signal<BusType[]>([]);
  protected readonly slotSel = signal<DepartSlot[]>([]);
  protected readonly boardSel = signal<string[]>([]);
  protected readonly dropSel = signal<string[]>([]);
  protected readonly boardOpen = signal(false);
  protected readonly dropOpen = signal(false);
  private readonly priceLo = signal<number | null>(null);
  private readonly priceHi = signal<number | null>(null);

  /** Cheapest and dearest fare on this route: the ends of the price slider. */
  protected readonly bounds = computed(() => {
    const p = this.s.buses().map((b) => b.price);
    return p.length ? { min: Math.floor(Math.min(...p)), max: Math.ceil(Math.max(...p)) } : { min: 0, max: 0 };
  });
  protected readonly priceMin = computed(() => Math.max(this.priceLo() ?? this.bounds().min, this.bounds().min));
  protected readonly priceMax = computed(() => Math.min(this.priceHi() ?? this.bounds().max, this.bounds().max));

  /**
   * SAMPLE DATA: the store has no per-bus boarding/dropping points yet, so every bus is
   * given two of three points here. Replace with the real fields once the API sends them.
   */
  private pointsFor(b: Bus) {
    const f = this.from(), t = this.to();
    const board = [`${f} Central Station`, `${f} Grand Terminal`, `${f} City Bus Stand`];
    const drop = [`${t} South Station`, `${t} Back Bay Station`, `${t} City Bus Stand`];
    return {
      boarding: [board[b.id % 3], board[(b.id + 1) % 3]],
      dropping: [drop[b.id % 3], drop[(b.id + 2) % 3]],
    };
  }
  protected readonly boardingPoints = computed(() => this.uniquePoints('boarding'));
  protected readonly droppingPoints = computed(() => this.uniquePoints('dropping'));
  private uniquePoints(k: 'boarding' | 'dropping') {
    return [...new Set(this.s.buses().flatMap((b) => this.pointsFor(b)[k]))].sort();
  }

  /** "AC" and "Sleeper" are read from the bus type text; anything that is not a sleeper is a seater. */
  private busKinds(b: Bus): BusType[] {
    const k: BusType[] = [/sleeper/i.test(b.type) ? 'sleeper' : 'seater'];
    if (/\bAC\b/i.test(b.type)) k.push('ac');
    return k;
  }

  protected readonly activeCount = computed(
    () =>
      this.typeSel().length + this.slotSel().length + this.boardSel().length + this.dropSel().length +
      (this.priceMin() > this.bounds().min || this.priceMax() < this.bounds().max ? 1 : 0),
  );

  protected readonly list = computed(() => {
    const types = this.typeSel(), slots = this.slotSel(), board = this.boardSel(), drop = this.dropSel();
    const lo = this.priceMin(), hi = this.priceMax();
    const l = this.s.buses().filter((b) => {
      if (types.length && !types.every((t) => this.busKinds(b).includes(t))) return false;
      if (b.price < lo || b.price > hi) return false;
      if (slots.length) {
        const m = toMinutes(b.depart);
        if (!DEPART_SLOTS.some((d) => slots.includes(d.key) && m >= d.from && m < d.to)) return false;
      }
      const p = this.pointsFor(b);
      if (board.length && !board.some((x) => p.boarding.includes(x))) return false;
      if (drop.length && !drop.some((x) => p.dropping.includes(x))) return false;
      return true;
    });
    if (this.sort() === 'cheapest') l.sort((a, b) => a.price - b.price);
    if (this.sort() === 'fastest') l.sort((a, b) => a.minutes - b.minutes || a.price - b.price);
    return l;
  });

  private toggle<T>(sig: WritableSignal<T[]>, v: T) {
    sig.update((cur) => (cur.includes(v) ? cur.filter((x) => x !== v) : [...cur, v]));
  }
  protected toggleType(k: BusType) { this.toggle(this.typeSel, k); }
  protected toggleSlot(k: DepartSlot) { this.toggle(this.slotSel, k); }
  protected toggleBoard(p: string) { this.toggle(this.boardSel, p); }
  protected toggleDrop(p: string) { this.toggle(this.dropSel, p); }

  protected setMin(v: string) { this.priceLo.set(Math.min(+v, this.priceMax())); }
  protected setMax(v: string) { this.priceHi.set(Math.max(+v, this.priceMin())); }

  protected clearFilters() {
    this.typeSel.set([]);
    this.slotSel.set([]);
    this.boardSel.set([]);
    this.dropSel.set([]);
    this.priceLo.set(null);
    this.priceHi.set(null);
  }

  // ---------- Seat pop-up ----------
  // The pop-up is driven by the address (?seat=<bus id>): the browser Back button closes it,
  // a reload keeps it open, and the list underneath keeps its filters and scroll position.
  private readonly seatParam = toSignal(this.route.queryParamMap.pipe(map((p) => p.get('seat'))), { initialValue: null });
  protected readonly seatBusId = computed(() => {
    const id = Number(this.seatParam());
    return this.seatParam() !== null && this.s.buses().some((b) => b.id === id) ? id : null;
  });

  private readonly detailsParam = toSignal(this.route.queryParamMap.pipe(map((p) => p.get('details'))), { initialValue: null });
  protected readonly detailsBusId = computed(() => {
    const id = Number(this.detailsParam());
    return this.detailsParam() !== null && this.s.buses().some((b) => b.id === id) ? id : null;
  });

  constructor() {
    // Opened from a link or reload: make that bus the selected one.
    effect(() => {
      const id = this.seatBusId() ?? this.detailsBusId();
      if (id !== null && this.s.bus().id !== id) this.s.selectBus(id);
    });

    // No overlay is open: make sure the page can scroll (clears any lock left behind).
    effect(() => {
      if (this.seatBusId() === null && this.detailsBusId() === null) setTimeout(() => releaseStaleScrollLock(this.doc.body));
    });
  }

  // ---------- Bus details drawer ----------
  protected openDetails(id: number) {
    this.s.selectBus(id);
    this.router.navigate([], { relativeTo: this.route, queryParams: { details: id }, queryParamsHandling: 'merge' });
  }

  protected closeDetails() {
    this.router.navigate([], { relativeTo: this.route, queryParams: { details: null }, queryParamsHandling: 'merge' });
  }

  /** "Select seats" inside the drawer: swap the drawer for the seat pop-up. */
  protected pickFromDetails(id: number) {
    this.router.navigate([], { relativeTo: this.route, queryParams: { details: null, seat: id }, queryParamsHandling: 'merge', replaceUrl: true });
  }

  protected pick(id: number) {
    this.s.selectBus(id);
    this.router.navigate([], { relativeTo: this.route, queryParams: { seat: id }, queryParamsHandling: 'merge' });
  }

  protected closeSeats() {
    this.router.navigate([], { relativeTo: this.route, queryParams: { seat: null }, queryParamsHandling: 'merge' });
  }
}
