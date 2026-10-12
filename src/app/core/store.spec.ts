import { TestBed } from '@angular/core/testing';
import { Store } from './store';

describe('Store', () => {
  let s: Store;
  beforeEach(() => {
    TestBed.configureTestingModule({});
    s = TestBed.inject(Store);
    s.patchSearch({ from: 'New York', to: 'Boston', passengers: 2 });
  });

  it('rejects identical cities', () => {
    s.patchSearch({ to: 'New York' });
    expect(s.canSearch()).toBe(false);
  });

  it('limits selection to the passenger count and ignores booked seats', () => {
    s.toggleSeat('1A'); // booked
    s.toggleSeat('4B');
    s.toggleSeat('4C');
    s.toggleSeat('4D'); // drops the oldest pick
    expect(s.seats()).toEqual(['4C', '4D']);
  });

  it('computes the fare with a promo code', () => {
    s.selectBus(1); // $55 on New York -> Boston
    s.toggleSeat('4B');
    expect(s.applyPromo('weekend20')).toBe(true);
    expect(s.total()).toBeCloseTo(55 + 2.5 - 11, 5);
  });

  it('has no Pittsburgh service on a Monday, with nearby dates and a results route', () => {
    s.patchSearch({ from: 'Pittsburgh', to: 'Boston', date: '2030-01-07' }); // Monday
    expect(s.buses()).toEqual([]);
    expect(s.resultsRoute()).toBe('/no-buses');
    expect(s.nearbyDates().length).toBe(4);
    s.useDate(s.nearbyDates()[0].iso);
    expect(s.buses().length).toBe(5);
    expect(s.resultsRoute()).toBe('/buses');
  });

  it('runs Pittsburgh routes on a Tuesday', () => {
    s.patchSearch({ from: 'Pittsburgh', to: 'Boston', date: '2030-01-08' }); // Tuesday
    expect(s.buses().length).toBe(5);
  });

  it('counts unread notifications and clears them', () => {
    expect(s.unread()).toBe(2);
    s.markAllRead();
    expect(s.unread()).toBe(0);
  });

  it('rejects unknown promo codes', () => {
    expect(s.applyPromo('NOPE')).toBe(false);
    expect(s.promo()).toBeNull();
  });
});
