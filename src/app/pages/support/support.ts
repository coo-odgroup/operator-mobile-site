import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Store } from '../../core/store';
import { Icon } from '../../shared/icon/icon';

interface Category { key: string; title: string; sub: string; icon: string; tone: string; }
interface Faq { cat: string; q: string; a: string; }

@Component({
  selector: 'app-support',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Icon],
  templateUrl: './support.html',
  styleUrl: './support.scss',
})
export class Support {
  private readonly s = inject(Store);

  protected readonly categories: Category[] = [
    { key: 'booking', title: 'Booking & Tickets', sub: 'Help with booking, cancellation, and tickets', icon: 'ticket', tone: '' },
    { key: 'payments', title: 'Payments & Refunds', sub: 'Help with payments, refunds, and billing', icon: 'dollar', tone: 'ok' },
    { key: 'account', title: 'Account & Profile', sub: 'Help with account settings and profile', icon: 'user', tone: 'red' },
    { key: 'offers', title: 'Offers & Rewards', sub: 'Help with offers, discounts, and rewards', icon: 'gift', tone: 'warn' },
  ];

  // Sample help content - replace with your help-centre API.
  protected readonly faqs: Faq[] = [
    { cat: 'booking', q: 'How do I cancel my booking?', a: 'Open My Bookings, choose the trip and tap Cancel. Free cancellation applies until 24 hours before departure; 50% is refunded between 24 and 12 hours, and nothing within 12 hours.' },
    { cat: 'booking', q: 'Where can I find my ticket?', a: 'Your e-ticket with a QR code is in My Tickets. A copy is also emailed to you after payment.' },
    { cat: 'booking', q: 'Can I change my seat after booking?', a: 'Seat changes are possible until departure if the seat you want is still free. Contact support with your booking ID.' },
    { cat: 'payments', q: 'When will I get my refund?', a: 'Refunds go back to the original payment method and usually reach your account in 5 to 7 working days.' },
    { cat: 'payments', q: 'My payment failed but money was deducted.', a: 'Failed payments are reversed automatically, normally within 3 to 5 working days. If not, share your booking ID with support.' },
    { cat: 'account', q: 'How do I update my phone number or email?', a: 'Go to Profile, tap Edit on Personal Information, change the details and save.' },
    { cat: 'offers', q: 'How do I use a promo code?', a: 'Enter the code in the Offers page or on the payment screen and tap Apply. The discount shows in your order summary.' },
    { cat: 'offers', q: 'How do travel points work?', a: 'You earn points on every completed trip. Collect enough to move up a level and unlock rewards such as priority boarding.' },
  ];

  protected readonly query = signal('');
  protected readonly cat = signal<string | null>(null);
  protected readonly open = signal<string | null>(null);

  protected readonly visibleCategories = computed(() => {
    const q = this.query().trim().toLowerCase();
    return this.categories.filter((c) => !q || (c.title + c.sub).toLowerCase().includes(q));
  });
  protected readonly visibleFaqs = computed(() => {
    const q = this.query().trim().toLowerCase();
    const cat = this.cat();
    return this.faqs.filter((f) => (!cat || f.cat === cat) && (!q || (f.q + f.a).toLowerCase().includes(q)));
  });

  protected pick(key: string) {
    this.cat.set(this.cat() === key ? null : key);
    this.open.set(null);
  }
  protected toggle(q: string) { this.open.set(this.open() === q ? null : q); }
  protected contact() { this.s.showToast('Connect this button to your support chat or phone line'); }
}
