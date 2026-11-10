import { ChangeDetectionStrategy, Component } from '@angular/core';

/** Decorative Odisha scene for the Home hero: temple, wheel motif, palms and an ODBUS bus. Drawn in-house. */
@Component({
  selector: 'app-hero-art',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [':host{display:block;width:100%;height:100%}svg{display:block;width:100%;height:100%}'],
  template: `
<svg viewBox="0 0 640 360" preserveAspectRatio="xMaxYMax meet" aria-hidden="true" focusable="false">
  <defs>
    <linearGradient id="ha-stone" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f1c58a"/><stop offset="1" stop-color="#c47c3c"/></linearGradient>
    <linearGradient id="ha-stone2" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#e6b072"/><stop offset="1" stop-color="#a8612b"/></linearGradient>
    <radialGradient id="ha-sun" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#ffe9a8"/><stop offset="1" stop-color="#ffb35c" stop-opacity="0"/></radialGradient>
    <g id="ha-palm">
      <path d="M0 0 C-3 -40 2 -70 8 -96" fill="none" stroke="#5a3b22" stroke-width="5" stroke-linecap="round"/>
      <g fill="#2f9e6b">
        <path d="M8 -96 C-14 -112 -34 -104 -46 -88 C-26 -96 -12 -98 8 -96Z"/>
        <path d="M8 -96 C30 -114 52 -106 62 -90 C42 -98 26 -98 8 -96Z"/>
        <path d="M8 -96 C-6 -122 4 -138 20 -142 C14 -126 12 -112 8 -96Z"/>
        <path d="M8 -96 C-24 -96 -40 -76 -40 -62 C-28 -78 -14 -88 8 -96Z" fill="#26855a"/>
        <path d="M8 -96 C36 -92 52 -72 52 -58 C40 -74 26 -86 8 -96Z" fill="#26855a"/>
      </g>
    </g>
  </defs>

  <g transform="translate(0 -46)">
  <circle cx="470" cy="150" r="120" fill="url(#ha-sun)"/>
  <circle cx="470" cy="150" r="38" fill="#ffd57a"/>
  <g fill="#fff" opacity=".85"><ellipse cx="250" cy="70" rx="40" ry="10"/><ellipse cx="278" cy="60" rx="26" ry="9"/><ellipse cx="570" cy="60" rx="34" ry="8"/></g>
  <g fill="none" stroke="#1b3c78" stroke-width="2" stroke-linecap="round" opacity=".6"><path d="M330 56 q6 -6 12 0 q6 -6 12 0"/><path d="M360 76 q5 -5 10 0 q5 -5 10 0"/></g>

  <path d="M0 262 C90 214 170 226 250 246 C330 216 430 214 520 240 C580 226 620 232 640 238 V330 H0Z" fill="#1c5fb0" opacity=".55"/>

  <g>
    <circle cx="596" cy="236" r="118" fill="url(#ha-stone2)"/>
    <circle cx="596" cy="236" r="104" fill="none" stroke="#7a4219" stroke-width="3" opacity=".7"/>
    <circle cx="596" cy="236" r="88" fill="none" stroke="#7a4219" stroke-width="2" opacity=".55"/>
    <g stroke="#7a4219" stroke-width="5" stroke-linecap="round" opacity=".75">
      <line x1="596" y1="236" x2="596" y2="118"/><line x1="596" y1="236" x2="596" y2="354"/>
      <line x1="596" y1="236" x2="478" y2="236"/><line x1="596" y1="236" x2="714" y2="236"/>
      <line x1="596" y1="236" x2="512" y2="152"/><line x1="596" y1="236" x2="680" y2="152"/>
      <line x1="596" y1="236" x2="512" y2="320"/><line x1="596" y1="236" x2="680" y2="320"/>
    </g>
    <circle cx="596" cy="236" r="22" fill="#f1c58a" stroke="#7a4219" stroke-width="4"/>
    <circle cx="596" cy="236" r="8" fill="#7a4219"/>
  </g>

  <g>
    <rect x="262" y="246" width="214" height="16" rx="2" fill="#a8612b"/>
    <g fill="url(#ha-stone2)">
      <rect x="290" y="214" width="58" height="34"/><rect x="296" y="198" width="46" height="16"/>
      <rect x="304" y="186" width="30" height="12"/><rect x="312" y="174" width="14" height="12"/><ellipse cx="319" cy="172" rx="9" ry="4"/>
      <rect x="416" y="222" width="46" height="26"/><rect x="422" y="208" width="34" height="14"/><rect x="430" y="198" width="18" height="10"/><ellipse cx="439" cy="196" rx="8" ry="3.5"/>
    </g>
    <path d="M346 248 L346 192 C346 152 362 124 374 104 C378 97 386 97 390 104 C402 124 418 152 418 192 L418 248 Z" fill="url(#ha-stone)"/>
    <g stroke="#9a5522" stroke-width="2" opacity=".55" fill="none">
      <path d="M347 232 H417"/><path d="M347 214 H417"/><path d="M348 196 H416"/><path d="M352 178 H412"/><path d="M358 160 H406"/><path d="M364 142 H400"/><path d="M370 124 H394"/>
      <path d="M382 104 V248"/>
    </g>
    <rect x="366" y="224" width="32" height="24" rx="14" fill="#6b3a17"/>
    <ellipse cx="382" cy="99" rx="17" ry="6" fill="#d9954f"/>
    <ellipse cx="382" cy="89" rx="5" ry="8" fill="#e8b472"/>
    <line x1="382" y1="82" x2="382" y2="58" stroke="#8a4c1e" stroke-width="2"/>
    <path d="M382 58 L402 64 L382 70Z" fill="#e8442f"/>
  </g>

  <path d="M0 292 C60 268 130 270 200 282 C260 262 330 262 400 276 C470 262 560 266 640 284 V340 H0Z" fill="#2f9e6b"/>
  <path d="M0 308 C90 292 190 296 290 304 C400 294 520 296 640 306 V340 H0Z" fill="#26855a"/>
  <use href="#ha-palm" x="238" y="296"/>
  <use href="#ha-palm" x="470" y="300" transform="translate(470 300) scale(.85) translate(-470 -300)"/>
  <use href="#ha-palm" x="520" y="302" transform="translate(520 302) scale(.65) translate(-520 -302)"/>

  <rect x="0" y="318" width="640" height="42" fill="#2b3a55"/>
  <line x1="0" y1="340" x2="640" y2="340" stroke="#f5f7fa" stroke-width="3" stroke-dasharray="24 18" opacity=".85"/>

  <g transform="translate(150 282)">
    <rect x="0" y="0" width="150" height="50" rx="10" fill="#fff"/>
    <path d="M0 8 a10 10 0 0 1 10 -8 h130 a10 10 0 0 1 10 8 v8 h-150Z" fill="#f4b400"/>
    <g fill="#bcd9f7"><rect x="10" y="20" width="22" height="14" rx="3"/><rect x="38" y="20" width="22" height="14" rx="3"/><rect x="66" y="20" width="22" height="14" rx="3"/><rect x="94" y="20" width="22" height="14" rx="3"/><rect x="122" y="18" width="22" height="22" rx="4"/></g>
    <rect x="0" y="40" width="150" height="6" fill="#1570d6"/>
    <text x="12" y="49" font-family="Inter, Arial, sans-serif" font-size="8" font-weight="700" fill="#fff">ODBUS</text>
    <circle cx="32" cy="52" r="10" fill="#1d2433"/><circle cx="32" cy="52" r="4" fill="#9aa5b8"/>
    <circle cx="118" cy="52" r="10" fill="#1d2433"/><circle cx="118" cy="52" r="4" fill="#9aa5b8"/>
    <rect x="146" y="30" width="5" height="6" rx="2" fill="#ffd166"/>
  </g>
  </g>
  <rect x="0" y="314" width="640" height="46" fill="#2b3a55"/>
</svg>`,
})
export class HeroArt {}
