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

/** Never throws: a broken layout becomes an error message, not a broken page. */
export function loadDecks(busId: number): { decks: Deck[]; error: string | null } {
  try {
    return { decks: buildDecks(seatConfigFor(busId)), error: null };
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
  // 2/1, single deck, all sleepers
  5: {
    decks: [
      { key: 'lower', map: ['B B . B', '| | . |', 'B B . B', '| | . |', 'B B . B', '| | . |', 'B B . B', '| | . |'], booked: ['LB2', 'LB5', 'LB9'] },
    ],
  },
};

export function seatConfigFor(busId: number): SeatConfig {
  return SAMPLE_CONFIGS[busId] ?? SAMPLE_CONFIGS[1];
}
