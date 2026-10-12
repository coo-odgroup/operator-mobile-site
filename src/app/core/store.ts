import { Injectable, computed, signal } from '@angular/core';

/** Change the brand name here (header, sidebar, settings). */
export const BRAND = 'ODBUS';

export const CITIES = ['New York', 'Boston', 'Philadelphia', 'Washington DC', 'Baltimore', 'Pittsburgh'];
const SHORT: Record<string, string> = { 'New York': 'NYC', Philadelphia: 'Philly', 'Washington DC': 'DC' };
export const short = (city: string) => SHORT[city] ?? city;

const pad = (n: number) => String(n).padStart(2, '0');
export const todayIso = () => {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};
export const fmtDate = (iso: string) =>
  iso ? new Date(iso + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '';

export const addDays = (iso: string, n: number) => {
  const d = new Date(iso + 'T00:00:00');
  d.setDate(d.getDate() + n);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};
export const dayOf = (iso: string) => new Date(iso + 'T00:00:00').getDate();
export const monthOf = (iso: string) => new Date(iso + 'T00:00:00').toLocaleDateString('en-US', { month: 'short' });
const fmtDuration = (mins: number) => `${Math.floor(mins / 60)}h ${pad(mins % 60)}m`;

/** Sample rule so the "No Buses Available" screen is reachable: Pittsburgh routes run Tue/Thu/Sat only. */
export const LIMITED_CITY = 'Pittsburgh';
const LIMITED_DAYS = [2, 4, 6];
const hasService = (from: string, to: string, iso: string) =>
  (from !== LIMITED_CITY && to !== LIMITED_CITY) || LIMITED_DAYS.includes(new Date(iso + 'T00:00:00').getDay());

export interface SearchState {
  from: string;
  to: string;
  date: string;
  returnDate: string;
  roundTrip: boolean;
  passengers: number;
}
export interface RecentSearch { from: string; to: string; date: string; passengers: number; }
export interface RouteInfo { from: string; to: string; price: number; duration: string; }
export interface Bus {
  id: number;
  operator: string;
  type: string;
  depart: string;
  arrive: string;
  duration: string;
  minutes: number;
  price: number;
  rating: number;
  seatsLeft: number;
  amenities: string[];
}
export interface Booking {
  id: string;
  from: string;
  to: string;
  date: string;
  time: string;
  status: 'Confirmed' | 'Pending' | 'Completed';
  seat: string;
  total?: number;
  // filled in when a booking is made in the app
  operator?: string;
  type?: string;
  arrive?: string;
  passenger?: string;
  pax?: number;
  payLabel?: string;
  bookedOn?: string;
}
export interface AppNotification {
  id: number;
  kind: 'booking' | 'offer' | 'system';
  group: 'Today' | 'Yesterday';
  title: string;
  body: string;
  when: string;
  read: boolean;
}
export interface SavedCard { id: number; last4: string; expiry: string; }
export interface StopPoint { name: string; detail: string; time: string; }
export interface Review { name: string; date: string; rating: number; text: string; }
export interface Offer { code: string; title: string; desc: string; badge: string; note: string; icon: string; }
export interface Promo { code: string; type: 'pct' | 'flat'; value: number; label: string; }
export interface Profile { name: string; email: string; phone: string; dob: string; address: string; }

const PROMOS: Record<string, Promo> = {
  WEEKEND20: { code: 'WEEKEND20', type: 'pct', value: 20, label: 'Weekend Special' },
  FIRST10: { code: 'FIRST10', type: 'flat', value: 10, label: 'First Trip Discount' },
  REFER15: { code: 'REFER15', type: 'flat', value: 15, label: 'Referral reward' },
};

// Sample route table - replace with the real pricing API.
const ROUTE_TABLE: Record<string, { price: number; duration: string }> = {
  'Boston|New York': { price: 45, duration: '4h 30m' },
  'New York|Washington DC': { price: 40, duration: '4h 15m' },
  'New York|Philadelphia': { price: 25, duration: '2h 10m' },
  'Philadelphia|Washington DC': { price: 22, duration: '2h 20m' },
};
const routeKey = (a: string, b: string) => [a, b].sort().join('|');
const routeInfo = (a: string, b: string) => ROUTE_TABLE[routeKey(a, b)] ?? { price: 38, duration: '3h 40m' };

const parseMinutes = (d: string) => {
  const m = /(\d+)h\s*(\d+)?m?/.exec(d);
  return m ? +m[1] * 60 + +(m[2] ?? 0) : 240;
};
const fmtTime = (mins: number) => {
  const m = ((mins % 1440) + 1440) % 1440;
  const h = Math.floor(m / 60);
  return `${pad(h % 12 === 0 ? 12 : h % 12)}:${pad(m % 60)} ${h < 12 ? 'AM' : 'PM'}`;
};

export const SEAT_ROWS = 10;
export const BOOKED_SEATS = ['1A', '2C', '3B', '3C', '5D', '6A', '6B', '8C', '9D', '10A'];

@Injectable({ providedIn: 'root' })
export class Store {
  readonly brand = BRAND;
  readonly cities = CITIES;
  readonly points = 2450;
  readonly tiers = [
    { name: 'Silver', at: 0 },
    { name: 'Gold', at: 4000 },
    { name: 'Platinum', at: 10000 },
  ];

  // ----- search -----
  readonly search = signal<SearchState>({
    from: '', to: '', date: todayIso(), returnDate: '', roundTrip: false, passengers: 1,
  });
  readonly canSearch = computed(() => {
    const s = this.search();
    return !!s.from && !!s.to && s.from !== s.to && !!s.date;
  });
  readonly recent = signal<RecentSearch[]>([
    { from: 'New York', to: 'Boston', date: '2025-04-15', passengers: 1 },
    { from: 'Washington DC', to: 'Philadelphia', date: '2025-04-10', passengers: 2 },
  ]);
  readonly popularRoutes: RouteInfo[] = [
    { from: 'New York', to: 'Boston', price: 45, duration: '4h 30m' },
    { from: 'Washington DC', to: 'New York', price: 40, duration: '4h 15m' },
  ];
  readonly destinations = [
    { city: 'New York', from: 25, tint: 'linear-gradient(135deg,#5b3df5,#2b7fff)' },
    { city: 'Boston', from: 35, tint: 'linear-gradient(135deg,#d6336c,#7a22e8)' },
    { city: 'Philadelphia', from: 22, tint: 'linear-gradient(135deg,#0f9d8a,#3b6cf5)' },
    { city: 'Washington DC', from: 30, tint: 'linear-gradient(135deg,#f08c00,#d6336c)' },
  ];

  patchSearch(p: Partial<SearchState>) { this.search.update((s) => ({ ...s, ...p })); }
  swapCities() { this.search.update((s) => ({ ...s, from: s.to, to: s.from })); }

  commitSearch() {
    const s = this.search();
    const entry: RecentSearch = { from: s.from, to: s.to, date: s.date, passengers: s.passengers };
    this.recent.update((r) =>
      [entry, ...r.filter((x) => !(x.from === entry.from && x.to === entry.to && x.date === entry.date))].slice(0, 4),
    );
    this.selectedBusId.set(null);
    this.seats.set([]);
  }
  searchAgain(r: RecentSearch) {
    const today = todayIso();
    this.patchSearch({ from: r.from, to: r.to, date: r.date < today ? today : r.date, passengers: r.passengers });
    this.commitSearch();
  }
  pickRoute(r: RouteInfo) {
    this.patchSearch({ from: r.from, to: r.to });
    this.commitSearch();
  }
  removeRecent(r: RecentSearch) { this.recent.update((list) => list.filter((x) => x !== r)); }

  // ----- buses -----
  private readonly allBuses = computed<Bus[]>(() => {
    const s = this.search();
    const from = s.from || 'New York';
    const to = s.to || 'Boston';
    const { price, duration } = routeInfo(from, to);
    const minutes = parseMinutes(duration);
    const templates = [
      { operator: 'BusGo Express', type: 'Premium AC - 2+2 Recliner', at: 6 * 60 + 30, add: 10, rating: 4.8, left: 12, am: ['Wi-Fi', 'Charging', 'Snacks', 'TV', 'AC', 'Restroom', 'Luggage', 'USB'] },
      { operator: 'Metro Liner', type: 'Standard AC', at: 9 * 60 + 15, add: 0, rating: 4.5, left: 20, am: ['AC', 'Charging'] },
      { operator: 'Skyline Coach', type: 'Premium AC', at: 12 * 60 + 45, add: 8, rating: 4.7, left: 7, am: ['Wi-Fi', 'Charging', 'Restroom'] },
      { operator: 'Coastal Cruiser', type: 'Standard', at: 16 * 60, add: -5, rating: 4.2, left: 25, am: ['AC'] },
      { operator: 'Night Rider', type: 'Sleeper AC', at: 22 * 60 + 30, add: 4, rating: 4.6, left: 5, am: ['Blanket', 'Charging', 'Wi-Fi'] },
    ];
    return templates.map((t, i) => ({
      id: i + 1,
      operator: t.operator,
      type: t.type,
      depart: fmtTime(t.at),
      arrive: fmtTime(t.at + minutes),
      duration,
      minutes,
      price: price + t.add,
      rating: t.rating,
      seatsLeft: t.left,
      amenities: t.am,
    }));
  });
  /** Buses for the current search; empty when the route has no service on the chosen date. */
  readonly buses = computed<Bus[]>(() => {
    const s = this.search();
    return hasService(s.from, s.to, s.date) ? this.allBuses() : [];
  });
  /** Where a finished search should land. */
  resultsRoute() { return this.buses().length ? '/buses' : '/no-buses'; }

  readonly selectedBusId = signal<number | null>(null);
  readonly bus = computed(() => this.allBuses().find((b) => b.id === this.selectedBusId()) ?? this.allBuses()[0]);
  selectBus(id: number) {
    this.selectedBusId.set(id);
    this.seats.set([]);
    this.pickupIdx.set(0);
    this.dropIdx.set(0);
  }

  // ----- "No buses" suggestions -----
  readonly nearbyDates = computed(() => {
    const s = this.search();
    const base = routeInfo(s.from || 'New York', s.to || 'Boston').price;
    const today = todayIso();
    const found: string[] = [];
    for (let i = 1; i <= 14 && found.length < 4; i++) {
      for (const off of [i, -i]) {
        const d = addDays(s.date, off);
        if (d >= today && hasService(s.from, s.to, d) && found.length < 4) found.push(d);
      }
    }
    return found.sort().map((iso, i) => ({ iso, day: dayOf(iso), month: monthOf(iso), price: base + [0, 3, 6, -2][i] }));
  });
  readonly altRoutes = computed(() => {
    const s = this.search();
    const base = routeInfo(s.from || 'New York', s.to || 'Boston');
    const vias = this.cities.filter((c) => c !== s.from && c !== s.to && c !== LIMITED_CITY).slice(0, 2);
    return vias.map((via, i) => ({
      via,
      label: `${short(s.from)} → ${short(via)} → ${short(s.to)}`,
      price: base.price + 7 + i * 4,
      duration: fmtDuration(parseMinutes(base.duration) + 60 + i * 45),
    }));
  });
  useDate(iso: string) { this.patchSearch({ date: iso }); }
  /** Search the leg of an alternative route that avoids the city without service. */
  useAlternative(via: string) {
    const s = this.search();
    if (s.from === LIMITED_CITY) this.patchSearch({ from: via });
    else this.patchSearch({ to: via });
  }

  // ----- stops, reviews, policy (sample content for Bus Details) -----
  readonly pickupPoints = computed<StopPoint[]>(() => {
    const from = this.search().from || 'New York';
    return [
      { name: `${from} Central Station`, detail: 'Gate 5, Platform B', time: this.bus().depart },
      { name: `${from} Grand Terminal`, detail: 'Bus Bay 3', time: fmtTime(this.timeToMinutes(this.bus().depart) + 15) },
    ];
  });
  readonly dropPoints = computed<StopPoint[]>(() => {
    const to = this.search().to || 'Boston';
    return [
      { name: `${to} South Station`, detail: 'Main Terminal', time: this.bus().arrive },
      { name: `${to} Back Bay Station`, detail: 'Exit Gate 2', time: fmtTime(this.timeToMinutes(this.bus().arrive) + 15) },
    ];
  });
  readonly pickupIdx = signal(0);
  readonly dropIdx = signal(0);
  readonly cancellation = [
    { tone: 'ok', text: 'Free cancellation until 24 hours before departure' },
    { tone: 'warn', text: '50% refund between 24 and 12 hours before departure' },
    { tone: 'red', text: 'No refund within 12 hours of departure' },
  ];
  readonly reviews: Review[] = [
    { name: 'John Smith', date: 'June 10, 2025', rating: 4.5, text: 'Very comfortable bus with excellent service. The staff was friendly and the bus was right on time. Would definitely travel again.' },
    { name: 'Sarah Johnson', date: 'June 8, 2025', rating: 5.0, text: 'Amazing experience! The bus was clean, WiFi worked perfectly, and we arrived ahead of schedule. Highly recommended.' },
  ];
  readonly allAmenities = [
    { key: 'Wi-Fi', icon: 'wifi' }, { key: 'Charging', icon: 'zap' }, { key: 'TV', icon: 'tv' }, { key: 'Snacks', icon: 'coffee' },
    { key: 'AC', icon: 'asterisk' }, { key: 'Restroom', icon: 'droplet' }, { key: 'Luggage', icon: 'briefcase' }, { key: 'USB', icon: 'plug' },
  ];
  private timeToMinutes(t: string) {
    const m = /(\d+):(\d+)\s*(AM|PM)/.exec(t)!;
    return ((+m[1] % 12) + (m[3] === 'PM' ? 12 : 0)) * 60 + +m[2];
  }

  // ----- seats & fare -----
  readonly seats = signal<string[]>([]);
  toggleSeat(label: string) {
    if (BOOKED_SEATS.includes(label)) return;
    const max = this.search().passengers;
    this.seats.update((list) => {
      if (list.includes(label)) return list.filter((x) => x !== label);
      return list.length >= max ? [...list.slice(1), label] : [...list, label];
    });
  }
  readonly promo = signal<Promo | null>(null);
  readonly subtotal = computed(() => this.bus().price * this.seats().length);
  readonly fee = computed(() => (this.seats().length ? 2.5 : 0));
  readonly discount = computed(() => {
    const p = this.promo();
    if (!p) return 0;
    const sub = this.subtotal();
    return Math.min(sub, p.type === 'pct' ? (sub * p.value) / 100 : p.value);
  });
  readonly total = computed(() => Math.max(0, this.subtotal() + this.fee() - this.discount()));

  applyPromo(code: string): boolean {
    const p = PROMOS[code.trim().toUpperCase()];
    if (!p) { this.showToast('That promo code is not valid'); return false; }
    this.promo.set(p);
    this.showToast(`${p.label} applied`);
    return true;
  }
  clearPromo() { this.promo.set(null); }

  // ----- bookings -----
  readonly bookings = signal<Booking[]>([
    { id: 'BG78345', from: 'New York', to: 'Boston', date: '2025-04-15', time: '10:30 AM', status: 'Confirmed', seat: 'Premium Seat - Window' },
    { id: 'BG79012', from: 'Washington DC', to: 'Philadelphia', date: '2025-04-22', time: '08:15 AM', status: 'Pending', seat: 'Standard Seat - Aisle' },
  ]);
  readonly history = signal<Booking[]>([
    { id: 'BG70211', from: 'New York', to: 'Philadelphia', date: '2025-03-02', time: '07:45 AM', status: 'Completed', seat: 'Standard Seat - Window', total: 27.5 },
    { id: 'BG69870', from: 'Boston', to: 'New York', date: '2025-02-14', time: '05:30 PM', status: 'Completed', seat: 'Premium Seat - Aisle', total: 57.5 },
    { id: 'BG69105', from: 'Washington DC', to: 'New York', date: '2025-01-20', time: '09:00 AM', status: 'Completed', seat: 'Standard Seat - Window', total: 42.5 },
  ]);
  readonly lastBooking = signal<Booking | null>(null);

  confirmBooking(payLabel = 'Card'): Booking {
    const s = this.search();
    const b = this.bus();
    const booking: Booking = {
      id: 'BG' + (70000 + Math.floor(Math.random() * 29999)),
      from: s.from || 'New York',
      to: s.to || 'Boston',
      date: s.date,
      time: b.depart,
      status: 'Confirmed',
      seat: `Seat ${this.seats().join(', ')}`,
      total: this.total(),
      operator: b.operator,
      type: b.type,
      arrive: b.arrive,
      passenger: this.profile().name,
      pax: s.passengers,
      payLabel,
      bookedOn: todayIso(),
    };
    this.notifications.update((l) => [
      { id: Date.now(), kind: 'booking', group: 'Today', title: 'Booking Confirmed', body: `Your booking #${booking.id} from ${short(booking.from)} to ${short(booking.to)} has been confirmed.`, when: 'Just now', read: false },
      ...l,
    ]);
    this.bookings.update((list) => [booking, ...list]);
    this.lastBooking.set(booking);
    this.seats.set([]);
    this.promo.set(null);
    return booking;
  }
  resume(b: Booking) {
    this.patchSearch({ from: b.from, to: b.to, date: b.date < todayIso() ? todayIso() : b.date });
    this.selectedBusId.set(null);
    this.seats.set([]);
  }

  // ----- saved routes -----
  readonly saved = signal<RouteInfo[]>([
    { from: 'New York', to: 'Boston', price: 45, duration: '4h 30m' },
    { from: 'Washington DC', to: 'New York', price: 40, duration: '4h 15m' },
  ]);
  isSaved(from: string, to: string) { return this.saved().some((r) => r.from === from && r.to === to); }
  toggleSaved(from: string, to: string) {
    if (this.isSaved(from, to)) {
      this.saved.update((l) => l.filter((r) => !(r.from === from && r.to === to)));
    } else {
      this.saved.update((l) => [...l, { from, to, ...routeInfo(from, to) }]);
    }
  }

  // ----- offers -----
  readonly offers: Offer[] = [
    { code: 'WEEKEND20', title: 'Weekend Special', desc: '20% off on all weekend trips', badge: '20% OFF', note: 'Valid until Apr 30', icon: 'ticket' },
    { code: 'FIRST10', title: 'First Trip Discount', desc: '$10 off on your first booking', badge: '$10 OFF', note: 'New users only', icon: 'gift' },
  ];
  readonly rewards = [
    { title: 'Free Onboard Refreshments', tier: 'Gold', need: 4000, icon: 'gift' },
    { title: 'Priority Boarding', tier: 'Platinum', need: 10000, icon: 'zap' },
  ];
  readonly nextTier = computed(() => this.tiers.find((t) => t.at > this.points) ?? this.tiers[this.tiers.length - 1]);
  readonly currentTier = computed(() => [...this.tiers].reverse().find((t) => t.at <= this.points)!);
  readonly tierPercent = computed(() => Math.min(100, Math.round((this.points / this.nextTier().at) * 100)));

  // ----- profile & settings -----
  readonly profile = signal<Profile>({
    name: 'Alex Johnson',
    email: 'alexjohnson@example.com',
    phone: '+1 (555) 123-4567',
    dob: '1985-05-15',
    address: '123 Main St, New York, NY 10001',
  });
  readonly dark = signal(false);
  readonly location = signal(true);
  readonly pushOn = signal(true);

  setDark(on: boolean) {
    this.dark.set(on);
    document.documentElement.dataset['theme'] = on ? 'dark' : 'light';
  }

  // ----- saved cards (sample, in-memory; only the last 4 digits are kept) -----
  readonly cards = signal<SavedCard[]>([
    { id: 1, last4: '4321', expiry: '05/28' },
    { id: 2, last4: '8765', expiry: '08/29' },
  ]);
  readonly cardId = signal<number | null>(1);
  addCard(last4: string, expiry: string) {
    const card = { id: Date.now(), last4, expiry };
    this.cards.update((l) => [...l, card]);
    this.cardId.set(card.id);
  }

  // ----- notifications -----
  readonly notifications = signal<AppNotification[]>([
    { id: 1, kind: 'booking', group: 'Today', title: 'Booking Confirmed', body: 'Your booking #BG78945 from NYC to Boston has been confirmed.', when: '2 hours ago', read: false },
    { id: 2, kind: 'offer', group: 'Today', title: 'New Offer Available', body: 'Weekend Special: 20% off on all weekend trips. Valid until Apr 30.', when: '5 hours ago', read: false },
    { id: 3, kind: 'system', group: 'Yesterday', title: 'Payment Successful', body: 'Your payment of $45.00 for booking #BG78945 was successful.', when: 'Yesterday, 3:45 PM', read: true },
  ]);
  readonly unread = computed(() => this.notifications().filter((n) => !n.read).length);
  markAllRead() { this.notifications.update((l) => l.map((n) => ({ ...n, read: true }))); }
  markRead(id: number) { this.notifications.update((l) => l.map((n) => (n.id === id ? { ...n, read: true } : n))); }

  // ----- auth (UI only - connect to your auth API) -----
  readonly loggedIn = signal(false);
  signIn(email: string) {
    this.loggedIn.set(true);
    this.profile.update((p) => ({ ...p, email }));
  }
  signUp(name: string, email: string, phone: string) {
    this.loggedIn.set(true);
    this.profile.update((p) => ({ ...p, name, email, phone }));
  }

  // ----- toast -----
  readonly toast = signal('');
  private timer?: ReturnType<typeof setTimeout>;
  showToast(msg: string) {
    this.toast.set(msg);
    clearTimeout(this.timer);
    this.timer = setTimeout(() => this.toast.set(''), 2600);
  }
}
