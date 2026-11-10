import { DOCUMENT } from '@angular/common';
import { Directive, ElementRef, OnDestroy, inject, input } from '@angular/core';

/**
 * Lightweight hover/focus tooltip. Usage:
 *   <button [appTip]="'Full text'" tipIfClipped=".name">…<span class="name">Shortened…</span></button>
 * - `tipIfClipped` (optional CSS selector): only show when that inner element is cut off with "…".
 * - Rendered on <body>, so parent `overflow:hidden` never clips it. Themed via --brand-deep.
 * - Shows on mouse hover and keyboard focus; on touch a tap navigates, so it hides on click.
 */
@Directive({
  selector: '[appTip]',
  host: {
    '(mouseenter)': 'show()',
    '(mouseleave)': 'hide()',
    '(focus)': 'show()',
    '(blur)': 'hide()',
    '(click)': 'hide()',
  },
})
export class Tooltip implements OnDestroy {
  readonly appTip = input.required<string>();
  readonly tipIfClipped = input<string>();

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly doc = inject(DOCUMENT);
  private tip: HTMLElement | null = null;
  private readonly onScroll = () => this.hide();

  show() {
    const view = this.doc.defaultView;
    if (!view || this.tip || !this.appTip()) return;
    const sel = this.tipIfClipped();
    if (sel) {
      const t = this.host.querySelector<HTMLElement>(sel);
      if (!t || t.scrollWidth <= t.clientWidth + 1) return;
    }
    const tip = this.doc.createElement('div');
    tip.textContent = this.appTip();
    tip.setAttribute('role', 'tooltip');
    Object.assign(tip.style, {
      position: 'fixed', zIndex: '1000', pointerEvents: 'none', maxWidth: '280px', padding: '7px 11px',
      borderRadius: '8px', background: 'var(--brand-deep, #0b2a55)', color: '#fff', font: '600 12.5px/1.35 inherit',
      boxShadow: '0 6px 18px rgba(0,0,0,.25)', opacity: '0', transition: 'opacity .15s ease', left: '0', top: '0',
    } as Partial<CSSStyleDeclaration>);
    tip.style.fontFamily = 'inherit';
    this.doc.body.appendChild(tip);
    const r = this.host.getBoundingClientRect();
    const w = tip.offsetWidth, h = tip.offsetHeight;
    const left = Math.min(Math.max(8, r.left + r.width / 2 - w / 2), view.innerWidth - w - 8);
    const above = r.top - h - 8;
    tip.style.left = `${left}px`;
    tip.style.top = `${above >= 4 ? above : r.bottom + 8}px`;
    view.requestAnimationFrame(() => (tip.style.opacity = '1'));
    view.addEventListener('scroll', this.onScroll, { passive: true });
    this.tip = tip;
  }

  hide() {
    this.doc.defaultView?.removeEventListener('scroll', this.onScroll);
    this.tip?.remove();
    this.tip = null;
  }

  ngOnDestroy() { this.hide(); }
}
