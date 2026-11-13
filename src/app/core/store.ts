import { Injectable, computed, inject, signal } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { OperatorConfigService } from './operator-config';


export const CITIES = ['New York', 'Boston', 'Philadelphia', 'Washington DC', 'Baltimore', 'Pittsburgh', 'Bhubaneswar', 'Cuttack', 'Puri', 'Sambalpur', 'Gopalpur', 'Berhampur', 'Rourkela'];
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
export interface RouteInfo {
  from: string; to: string; price: number; duration: string;
  /** Groups routes into tabs on Home (e.g. 'Top routes', 'Weekend trips'). */
  tag?: string;
  /** Optional photo URL, e.g. '/photos/routes/boston.jpg'. Without one, a coloured card is shown. */
  img?: string;
  /** Currency symbol; defaults to '$'. */
  cur?: string;
}
export interface BusOffer {
  title: string;
  code: string;
  /** One or two lines shown in the coupon pop-up. */
  desc: string;
}
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
  /** Optional promo shown as a tag on top of the listing card. */
  offer?: BusOffer;
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
  STUDENT15: { code: 'STUDENT15', type: 'pct', value: 15, label: 'Student Special' },
  EARLY12: { code: 'EARLY12', type: 'pct', value: 12, label: 'Early Bird' },
  GROUP8: { code: 'GROUP8', type: 'pct', value: 8, label: 'Group Booking' },
  FESTIVE25: { code: 'FESTIVE25', type: 'pct', value: 25, label: 'Festive Special' },
  UPI5: { code: 'UPI5', type: 'pct', value: 5, label: 'UPI Offer' },
};

// Sample route table - replace with the real pricing API.
const ROUTE_TABLE: Record<string, { price: number; duration: string }> = {
  'Boston|New York': { price: 45, duration: '4h 30m' },
  'New York|Washington DC': { price: 40, duration: '4h 15m' },
  'New York|Philadelphia': { price: 25, duration: '2h 10m' },
  'Philadelphia|Washington DC': { price: 22, duration: '2h 20m' },
  'Bhubaneswar|Puri': { price: 180, duration: '2h 00m' },
  'Bhubaneswar|Cuttack': { price: 80, duration: '0h 45m' },
  'Bhubaneswar|Sambalpur': { price: 450, duration: '5h 30m' },
  'Bhubaneswar|Gopalpur': { price: 320, duration: '4h 15m' },
  'Bhubaneswar|Berhampur': { price: 300, duration: '3h 30m' },
  'Bhubaneswar|Rourkela': { price: 600, duration: '7h 00m' },
  'Cuttack|Puri': { price: 220, duration: '2h 45m' },
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
  private readonly document = inject(DOCUMENT);
  private readonly operator = inject(OperatorConfigService);
  /** Brand name comes from the operator config (core/operator-config.ts). */
  get brand() { return this.operator.brand().name; }
  /** FAQ with topic tabs on both Home layouts. Backend: GET /content/faq-topics -> [{ topic, items: [{ q, a }] }] (plain text). */
  readonly faqTopics = [
    {
      topic: 'General',
      items: [
        { q: 'What is an e-ticket?', a: 'An e-ticket is the digital version of your bus ticket. You get it by SMS and email right after booking, so you can board by showing it on your phone.' },
        { q: 'Do I need an account to book a ticket?', a: 'You can search without an account. To book, sign in with your mobile number so we can send your ticket and keep your trips in one place.' },
        { q: 'Does booking online cost more?', a: 'No. The fare is the same as the operator’s counter fare. Any convenience fee is shown before you pay.' },
        { q: 'Can I book a multi-city trip?', a: 'Book each leg as a separate trip. Choose the second leg’s date after your first bus arrives.' },
        { q: 'What should I know when travelling with an infant?', a: 'Rules for infants differ by operator. Check the bus details or contact support before you book.' },
      ],
    },
    {
      topic: 'Ticket related',
      items: [
        { q: 'Where can I find my ticket?', a: 'Open Manage Booking to see and print all your tickets.' },
        { q: 'Can I change my travel date after booking?', a: 'Rescheduling depends on the operator. Open Manage Booking to see the options for your trip, or contact support.' },
        { q: 'What do I show when boarding?', a: 'Show the e-ticket on your phone along with a valid photo ID.' },
        { q: 'How do I find my boarding point?', a: 'The boarding point, time and contact number are on your ticket and in Manage Booking.' },
      ],
    },
    {
      topic: 'Payment',
      items: [
        { q: 'Which payment methods are accepted?', a: 'Cards, UPI and wallets, depending on what your gateway supports.' },
        { q: 'How do I use an offer code?', a: 'Enter the code on the payment step. The discount shows in your fare summary before you pay.' },
        { q: 'My money was deducted but I got no ticket. What now?', a: 'Failed bookings are refunded to the source account automatically. If you see no refund in a few days, contact support with your payment reference.' },
      ],
    },
    {
      topic: 'Cancellation & refund',
      items: [
        { q: 'How do cancellations and refunds work?', a: 'Cancel from Manage Booking; the refund depends on the cancellation policy of the trip.' },
        { q: 'When will I get my refund?', a: 'Refunds go back to the original payment method. The time taken depends on your bank or wallet.' },
        { q: 'What happens if the operator cancels the trip?', a: 'You get a full refund, and we will tell you by SMS and email.' },
      ],
    },
  ];
  /** "Bus amenities" section on Home. Backend: GET /content/amenities. `icon` must be an app-icon name. */
  readonly comfort = {
    title: 'Choose a bus that fits your journey.',
    text: 'Compare bus types and onboard facilities before you book.',
    image: '/photos/amenities-odbus.jpg',
    items: [
      { icon: 'asterisk', label: 'AC / Non-AC' },
      { icon: 'moon', label: 'Sleeper' },
      { icon: 'users', label: 'Seater' },
      { icon: 'plug', label: 'Charging Point' },
      { icon: 'wifi', label: 'Wi-Fi' },
      { icon: 'droplet', label: 'Water Bottle' },
      { icon: 'heart', label: 'Blanket' },
      { icon: 'eye', label: 'Reading Light' },
    ],
    cta: { label: 'Explore buses', link: '/search' },
  };
  /** Reviews on Home. Backend: GET /reviews?limit=6 + summary. Demo data. `url` opens the original review. */
  readonly travellerReviews = {
    rating: 4.5,
    count: '2,400+',
    allUrl: 'https://www.google.com/maps',
    items: [
      { name: 'Satya Sahoo', trip: 'Bhubaneswar → Puri', stars: 5, text: 'Comfortable seats, on-time departure and a very smooth booking. Boarding details came instantly on my phone.' },
      { name: 'Priya Mohanty', trip: 'Cuttack → Bhubaneswar', stars: 5, text: 'Clean bus, good legroom and the driver was careful. Got my refund quickly when I changed plans.' },
      { name: 'Rajesh Patra', trip: 'Bhubaneswar → Sambalpur', stars: 4, text: 'Night journey was relaxed and the AC was just right. Support answered my call at midnight.' },
      { name: 'Ananya Das', trip: 'Bhubaneswar → Gopalpur', stars: 5, text: 'Easy to pick seats and the live bus timing helped a lot. Will book here again for the next trip.' },
      { name: 'Biswajit Nayak', trip: 'Puri → Bhubaneswar', stars: 5, text: 'Great value fares and a friendly crew. The ticket was ready in seconds after payment.' },
      { name: 'Smruti Behera', trip: 'Bhubaneswar → Rourkela', stars: 4, text: 'Long route but the ride was steady and clean. Pickup point was easy to find.' },
    ],
  };
  /** "About" section on Home. Backend: GET /content/about (all fields are plain text/URLs). */
  readonly about = {
    title: 'Connecting Odisha, one journey at a time.',
    text: 'brings passengers and bus operators together through a convenient online booking experience. Discover routes, compare services, manage bookings and get travel assistance in one place.',
    image: '/photos/about-odbus.jpg',
    stats: [
      { value: '100+', label: 'Operator partners' },
      { value: '500+', label: 'Daily services' },
      { value: '24×7', label: 'Travel support' },
    ],
    cta: { label: 'Know more about us', link: '/support' },
  };
  /** Help strip shown above the FAQ. The backend replaces the phone and email with the operator's own. */
  readonly help = {
    title: 'Need help with a booking?',
    text: 'Talk to our team. Keep your PNR ready.',
    phone: '+91 90000 00000',
    email: 'support@example.com',
    link: '/support',
    linkLabel: 'Help and support',
  };
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
    { from: 'Bhubaneswar', to: 'Puri', date: '2025-04-05', passengers: 1 },
  ]);
  /** Home 2 "Recent searches" strip: demo filler card after the real ones. Replace with the recent-searches API and delete this. */
  readonly recentHome2 = computed<RecentSearch[]>(() => [
    ...this.recent(),
    { from: 'Bhubaneswar', to: 'Konark', date: '2025-04-02', passengers: 1 },
  ]);
  readonly popularRoutes: RouteInfo[] = [
    { from: 'Bhubaneswar', to: 'Puri', price: 180, duration: '2h 00m', tag: 'Odisha', cur: '₹', img: '/photos/routes/puri.jpg' },
    { from: 'Cuttack', to: 'Bhubaneswar', price: 80, duration: '0h 45m', tag: 'Odisha', cur: '₹', img: '/photos/routes/bhubaneswar.jpg' },
    { from: 'Bhubaneswar', to: 'Sambalpur', price: 450, duration: '5h 30m', tag: 'Odisha', cur: '₹', img: '/photos/routes/sambalpur.jpg' },
    { from: 'Bhubaneswar', to: 'Gopalpur', price: 320, duration: '4h 15m', tag: 'Odisha', cur: '₹', img: '/photos/routes/gopalpur.jpg' },
    { from: 'New York', to: 'Boston', price: 45, duration: '4h 30m', tag: 'Top routes' },
    { from: 'Washington DC', to: 'New York', price: 40, duration: '4h 15m', tag: 'Top routes' },
    { from: 'Philadelphia', to: 'New York', price: 22, duration: '2h 10m', tag: 'Top routes' },
    { from: 'Boston', to: 'Philadelphia', price: 52, duration: '6h 05m', tag: 'Top routes' },
    { from: 'New York', to: 'Washington DC', price: 38, duration: '4h 20m', tag: 'Weekend trips' },
    { from: 'Boston', to: 'New York', price: 44, duration: '4h 30m', tag: 'Weekend trips' },
    { from: 'Philadelphia', to: 'Washington DC', price: 26, duration: '2h 45m', tag: 'Weekend trips' },
    { from: 'Washington DC', to: 'Philadelphia', price: 27, duration: '2h 50m', tag: 'Weekend trips' },
  ];
  /** Home 2 "Where to next?" slider. Cards without `img` show a coloured card; drop a photo in /public/photos/routes and set `img`. */
  readonly exploreRoutes: RouteInfo[] = [
    { from: 'Bhubaneswar', to: 'Puri', price: 180, duration: '2h 00m', cur: '₹', tag: 'Pilgrimage', img: '/photos/routes/puri.jpg' },
    { from: 'Cuttack', to: 'Bhubaneswar', price: 80, duration: '0h 45m', cur: '₹', tag: 'Heritage', img: '/photos/routes/bhubaneswar.jpg' },
    { from: 'Bhubaneswar', to: 'Sambalpur', price: 450, duration: '5h 30m', cur: '₹', tag: 'Nature', img: '/photos/routes/sambalpur.jpg' },
    { from: 'Bhubaneswar', to: 'Gopalpur', price: 320, duration: '4h 15m', cur: '₹', tag: 'Beach', img: '/photos/routes/gopalpur.jpg' },
    { from: 'Bhubaneswar', to: 'Konark', price: 120, duration: '1h 45m', cur: '₹', tag: 'Heritage' },
    { from: 'Bhubaneswar', to: 'Chilika', price: 150, duration: '2h 15m', cur: '₹', tag: 'Lake' },
    { from: 'Bhubaneswar', to: 'Rourkela', price: 600, duration: '7h 00m', cur: '₹', tag: 'Steel city' },
    { from: 'Bhubaneswar', to: 'Berhampur', price: 300, duration: '3h 30m', cur: '₹', tag: 'Silk city' },
  ];
  /** Home "Popular routes" slider (no photos). Replace with the real top-routes API. */
  readonly topRoutes: RouteInfo[] = [
    { from: 'Bhubaneswar', to: 'Puri', price: 180, duration: '2h 00m', cur: '₹' },
    { from: 'Bhubaneswar', to: 'Cuttack', price: 80, duration: '0h 45m', cur: '₹' },
    { from: 'Bhubaneswar', to: 'Berhampur', price: 300, duration: '3h 30m', cur: '₹' },
    { from: 'Bhubaneswar', to: 'Sambalpur', price: 450, duration: '5h 30m', cur: '₹' },
    { from: 'Bhubaneswar', to: 'Gopalpur', price: 320, duration: '4h 15m', cur: '₹' },
    { from: 'Bhubaneswar', to: 'Rourkela', price: 600, duration: '7h 00m', cur: '₹' },
    { from: 'Cuttack', to: 'Puri', price: 220, duration: '2h 45m', cur: '₹' },
    { from: 'Puri', to: 'Bhubaneswar', price: 180, duration: '2h 00m', cur: '₹' },
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
      { operator: 'BusGo Express', type: 'Premium AC - 2+2 Recliner', at: 6 * 60 + 30, add: 10, rating: 4.8, left: 12, offer: { title: 'Upto $5 off', code: 'SAVE5', desc: 'Get up to $5 off on this bus. Applies to a single booking.' }, am: ['Wi-Fi', 'Charging', 'Snacks', 'TV', 'AC', 'Restroom', 'Luggage', 'USB'] },
      { operator: 'Metro Liner', type: 'Standard AC', at: 9 * 60 + 15, add: 0, rating: 4.5, left: 20, am: ['AC', 'Charging'] },
      { operator: 'Skyline Coach', type: 'Premium AC', at: 12 * 60 + 45, add: 8, rating: 4.7, left: 7, offer: { title: 'Flat 10% off', code: 'FIRST10', desc: 'Flat 10% off on your first booking with ODBUS.' }, am: ['Wi-Fi', 'Charging', 'Restroom'] },
      { operator: 'Coastal Cruiser', type: 'Standard', at: 16 * 60, add: -5, rating: 4.2, left: 25, am: ['AC'] },
      { operator: 'Night Rider', type: 'Sleeper AC', at: 22 * 60 + 30, add: 4, rating: 4.6, left: 5, offer: { title: 'Upto $4 off', code: 'NIGHT4', desc: 'Travel at night and save up to $4 per booking.' }, am: ['Blanket', 'Charging', 'Wi-Fi'] },
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
      offer: t.offer,
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
  /** Per-seat fares published by the seat map (seat id -> price). Seats not listed fall back to the bus fare. */
  readonly seatPrices = signal<Record<string, number>>({});
  readonly subtotal = computed(() => this.seats().reduce((sum, id) => sum + (this.seatPrices()[id] ?? this.bus().price), 0));
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
    { code: 'RETURN10', title: 'Return Trip Offer', desc: '10% off when you book a return journey', badge: '10% OFF', note: 'Applied on return trips', icon: 'ticket' },
    { code: 'NIGHT5', title: 'Night Rider', desc: '$5 off on all night departures', badge: '$5 OFF', note: 'Night buses only', icon: 'moon' },
    { code: 'STUDENT15', title: 'Student Special', desc: '15% off for students on every trip', badge: '15% OFF', note: 'Show a valid student ID', icon: 'star' },
    { code: 'EARLY12', title: 'Early Bird', desc: '12% off when you book 7 days ahead', badge: '12% OFF', note: 'Advance bookings', icon: 'calendar' },
    { code: 'GROUP8', title: 'Group Booking', desc: '8% off when you book 4 or more seats', badge: '8% OFF', note: 'Min 4 seats', icon: 'users' },
    { code: 'FESTIVE25', title: 'Festive Special', desc: '25% off on festival weekend trips', badge: '25% OFF', note: 'Limited period', icon: 'zap' },
    { code: 'UPI5', title: 'Pay by UPI', desc: '5% off when you pay with UPI', badge: '5% OFF', note: 'On UPI payments', icon: 'card' },
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
    this.document.documentElement.dataset['theme'] = on ? 'dark' : 'light';
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
