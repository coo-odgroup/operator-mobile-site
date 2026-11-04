import { SAMPLE_API_LAYOUT } from './sample-api-layout';

/**
 * Seat structure for the seat page.
 *
 * Every bus can have a different layout, so the page never hardcodes one. It asks for a SeatConfig
 * (the small JSON below, which is what the backend should send per bus), validates it, and draws it.
 *
 * A bus has one or two decks. Each deck is a text map, one string per row, symbols separated by spaces:
 *   S = seat      B = sleeper (takes this row and the next one, so it is as tall as 2 seats)
 *   | = lower half of the sleeper above      . = aisle / empty
 * That covers 1/2, 2/2, 2/1 ... layouts, sleepers between seat rows and a rear bench row.
 */
export type DeckKey = 'lower' | 'upper';

/** Most seats one customer can pick in a single booking. */
export const MAX_SEATS = 6;

// ---------- What the backend sends ----------
export interface DeckConfig {
  key: DeckKey;
  map: string[];
  /** Ids already taken on this deck. */
  booked?: string[];
}
export interface SeatConfig {
  decks: DeckConfig[];
}

// ---------- What the page draws ----------
export interface SeatCell {
  /** Unique across the bus. Seats: L1, L2 ... / U1 ... Sleepers: LB1 ... / UB1 ... */
  id: string;
  kind: 'seat' | 'sleeper';
  /** 1-based grid position. */
  row: number;
  col: number;
  rowSpan: number;
  booked: boolean;
  /** Set on seats booked by a lady (F) or a gent (M), when the backend says so. */
  gender?: 'F' | 'M';
}
export interface Deck {
  key: DeckKey;
  title: string;
  hasDriver: boolean;
  cols: number;
  cells: SeatCell[];
}

export function parseDeck(key: DeckKey, map: string[], booked: string[] = []): Deck {
  if (!map?.length) throw new Error(`Deck "${key}" has no rows`);
  const rows = map.map((r) => r.trim().split(/\s+/));
  const cols = rows[0].length;
  const prefix = key === 'lower' ? 'L' : 'U';
  const cells: SeatCell[] = [];
  let seats = 0, sleepers = 0;

  rows.forEach((tokens, r) => {
    if (tokens.length !== cols) throw new Error(`Deck "${key}" row ${r + 1} has ${tokens.length} columns, expected ${cols}`);
    tokens.forEach((t, c) => {
      if (t === 'S' || t === 'B') {
        if (t === 'B' && rows[r + 1]?.[c] !== '|') throw new Error(`Deck "${key}": sleeper at row ${r + 1}, column ${c + 1} needs a "|" below it`);
        const id = t === 'S' ? `${prefix}${++seats}` : `${prefix}B${++sleepers}`;
        cells.push({ id, kind: t === 'S' ? 'seat' : 'sleeper', row: r + 1, col: c + 1, rowSpan: t === 'B' ? 2 : 1, booked: booked.includes(id) });
      } else if (t === '|') {
        if (rows[r - 1]?.[c] !== 'B') throw new Error(`Deck "${key}": "|" at row ${r + 1}, column ${c + 1} has no sleeper above it`);
      } else if (t !== '.') {
        throw new Error(`Deck "${key}": unknown symbol "${t}" at row ${r + 1}, column ${c + 1}`);
      }
    });
  });

  if (!cells.length) throw new Error(`Deck "${key}" has no seats`);
  return { key, title: key === 'lower' ? 'Lower deck' : 'Upper deck', hasDriver: key === 'lower', cols, cells };
}

/** Turns a bus's config into decks (lower first). Throws if the config is not usable. */
export function buildDecks(config: SeatConfig): Deck[] {
  const list = config?.decks;
  if (!list?.length) throw new Error('Seat layout has no decks');
  if (list.length > 2) throw new Error('A bus can have at most 2 decks');
  if (new Set(list.map((d) => d.key)).size !== list.length) throw new Error('Seat layout repeats a deck');
  const decks = list.map((d) => parseDeck(d.key, d.map, d.booked));
  return decks.sort((a, b) => (a.key === 'lower' ? -1 : 1) - (b.key === 'lower' ? -1 : 1));
}

// ---------- Real backend response ----------
// The backend sends each deck as a grid of cells. Its rows run ACROSS the bus and its columns run ALONG the bus
// (column 0 = front), so we turn it a quarter turn: front at the top, backend row 0 = driver side (right).
// seat_class_id: 1 = seat, 2 = sleeper, anything else = aisle / empty. seatText is the seat number.
// A seat is for sale when it has a fare (bus_seats.PDetails / ticket_price); every other seat is not available.
// Gender "F" / "M" marks a seat booked by a lady / a gent.
export interface ApiCell {
  id: number;
  seat_class_id: number;
  seatText: string;
  rowNumber: number;
  colNumber: number;
  Gender?: string;
  bus_seats?: { PDetails?: unknown[]; ticket_price?: unknown };
}
export interface ApiSeatLayout {
  bus?: { id: number; name?: string; max_seat_book?: number }[];
  lower_berth?: ApiCell[];
  lowerBerth_totalRows?: number;
  lowerBerth_totalColumns?: number;
  upper_berth?: ApiCell[];
  upperBerth_totalRows?: number;
  upperBerth_totalColumns?: number;
}

const isForSale = (c: ApiCell) => !!c.bus_seats && (!!c.bus_seats.PDetails?.length || !!c.bus_seats.ticket_price);

function deckFromApi(key: DeckKey, cells: ApiCell[] | undefined, rows: number | undefined, cols: number | undefined): Deck | null {
  if (!cells?.length) return null;
  if (!rows || !cols) throw new Error(`Deck "${key}" has no row / column count`);
  const used = cells.filter((c) => (c.seat_class_id === 1 || c.seat_class_id === 2) && c.seatText);
  // A column along the bus is one seat long, or two when it holds sleepers.
  const height = Array.from({ length: cols }, (_, c) => (used.some((u) => u.colNumber === c && u.seat_class_id === 2) ? 2 : 1));
  const start = height.map((_, c) => 1 + height.slice(0, c).reduce((a, b) => a + b, 0));
  const out: SeatCell[] = [];
  const seen = new Set<string>();
  for (const u of used) {
    if (u.rowNumber >= rows || u.colNumber >= cols) throw new Error(`Deck "${key}": seat ${u.seatText} is outside the ${rows}x${cols} grid`);
    if (seen.has(u.seatText)) throw new Error(`Deck "${key}": seat ${u.seatText} appears twice`);
    seen.add(u.seatText);
    const sleeper = u.seat_class_id === 2;
    out.push({ id: u.seatText, kind: sleeper ? 'sleeper' : 'seat', row: start[u.colNumber], col: rows - u.rowNumber, rowSpan: sleeper ? 2 : 1, booked: !isForSale(u), gender: u.Gender === 'F' || u.Gender === 'M' ? u.Gender : undefined });
  }
  if (!out.length) return null;
  return { key, title: key === 'lower' ? 'Lower deck' : 'Upper deck', hasDriver: key === 'lower', cols: rows, cells: out };
}

/** Turns the backend response into decks. */
export function decksFromApi(res: ApiSeatLayout): Deck[] {
  const decks = [
    deckFromApi('lower', res.lower_berth, res.lowerBerth_totalRows, res.lowerBerth_totalColumns),
    deckFromApi('upper', res.upper_berth, res.upperBerth_totalRows, res.upperBerth_totalColumns),
  ].filter((d): d is Deck => !!d);
  if (!decks.length) throw new Error('Seat layout has no seats');
  return decks;
}

/** Never throws: a broken layout becomes an error message, not a broken page. */
export function loadDecks(busId: number): { decks: Deck[]; error: string | null } {
  try {
    const api = busId === 1 ? SAMPLE_API_LAYOUT : null; // later: the live API response for the chosen bus
    return { decks: api ? decksFromApi(api) : buildDecks(seatConfigFor(busId)), error: null };
  } catch (e) {
    console.error('Seat layout error for bus', busId, e);
    return { decks: [], error: 'The seat layout for this bus is not available right now.' };
  }
}

// ---------- Selecting seats (several at once, up to MAX_SEATS) ----------
export function toggleSelection(selected: string[], id: string, max = MAX_SEATS): { selected: string[]; blocked: boolean } {
  if (selected.includes(id)) return { selected: selected.filter((x) => x !== id), blocked: false };
  if (selected.length >= max) return { selected, blocked: true };
  return { selected: [...selected, id], blocked: false };
}

/** Keeps only ids that exist on this bus and are still free (e.g. after switching buses). */
export function pruneSelection(selected: string[], decks: Deck[]): string[] {
  const free = new Set(decks.flatMap((d) => d.cells.filter((c) => !c.booked).map((c) => c.id)));
  return selected.filter((id) => free.has(id));
}

// ---------------------------------------------------------------------------------------------
// SAMPLE DATA. The store has no seat inventory yet. Replace seatConfigFor() with the API call that
// returns a SeatConfig for the bus and trip.
// ---------------------------------------------------------------------------------------------
const SAMPLE_CONFIGS: Record<number, SeatConfig> = {
  // 2/2, two decks (main demo bus): 10 rows each. Seats, 2 sleepers on the left and a rear bench downstairs; sleepers upstairs
  1: {
    decks: [
      {
        key: 'lower',
        map: [
          'S S . S S',
          'S S . S S',
          'B B . S S',
          '| | . S S',
          'S S . S S',
          'S S . S S',
          'S S . S S',
          'S S . S S',
          'S S . S S',
          'S S S S S',
        ],
        booked: ['L2', 'L6', 'L11', 'L15', 'L19', 'L26', 'L30', 'L35', 'LB2'],
      },
      {
        key: 'upper',
        map: ['B B . B B', '| | . | |', 'B B . B B', '| | . | |', 'B B . B B', '| | . | |', 'B B . B B', '| | . | |', 'B B . B B', '| | . | |'],
        booked: ['UB2', 'UB5', 'UB9', 'UB13', 'UB16'],
      },
    ],
  },
  // 2/2, single deck, rear bench of 5
  2: {
    decks: [
      {
        key: 'lower',
        map: ['S S . S S', 'S S . S S', 'S S . S S', 'S S . S S', 'S S . S S', 'S S . S S', 'S S . S S', 'S S . S S', 'S S . S S', 'S S S S S'],
        booked: ['L1', 'L6', 'L12', 'L13', 'L22', 'L23', 'L31', 'L40'],
      },
    ],
  },
  // 2/2, two decks: sleepers sit in the seat rows downstairs, all sleepers upstairs
  3: {
    decks: [
      { key: 'lower', map: ['S S . S S', 'S S . S S', 'B B . S S', '| | . S S', 'B B . S S', '| | . S S', 'S S S S S'], booked: ['L2', 'L5', 'L10', 'L15', 'L19', 'LB2'] },
      { key: 'upper', map: ['B B . B B', '| | . | |', 'B B . B B', '| | . | |', 'B B . B B', '| | . | |'], booked: ['UB3', 'UB7'] },
    ],
  },
  // 1/2, single deck: sleepers on the left of the seat rows
  4: {
    decks: [
      { key: 'lower', map: ['B . S S', '| . S S', 'B . S S', '| . S S', 'S . S S', 'S . S S', 'S S S S'], booked: ['L2', 'L6', 'L9', 'L12', 'L16', 'LB2'] },
    ],
  },
  // Bus 5 uses the real backend sample (sample-api-layout.ts), see loadDecks().
};

export function seatConfigFor(busId: number): SeatConfig {
  return SAMPLE_CONFIGS[busId] ?? SAMPLE_CONFIGS[1];
}
