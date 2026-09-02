import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-icona-foro',
  standalone: true,
  template: `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"
      stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      @switch (nome) {
        @case ('calendario') { <path d="M6 2v4M18 2v4M3 9h18M5 4h14a2 2 0 0 1 2 2v14H3V6a2 2 0 0 1 2-2Z"/><path d="M7 13h3M14 13h3M7 17h3M14 17h3"/> }
        @case ('documenti') { <path d="M6 2h8l4 4v16H6z"/><path d="M14 2v5h5M9 12h6M9 16h6"/> }
        @case ('email') { <rect x="3" y="5" width="18" height="14" rx="2"/><path d="m4 7 8 6 8-6"/> }
        @case ('anagrafiche') { <path d="M5 3h14a2 2 0 0 1 2 2v16H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z"/><circle cx="12" cy="9" r="2.5"/><path d="M7.5 17c.7-2.3 2.2-3.5 4.5-3.5s3.8 1.2 4.5 3.5M3 8h2M3 13h2"/> }
        @case ('pratiche') { <path d="M9 5V3h6v2M4 7h16v13H4z"/><path d="M4 11h16M10 11v2h4v-2"/> }
        @case ('collaboratori') { <circle cx="9" cy="8" r="3"/><circle cx="17" cy="9" r="2"/><path d="M3 20c.4-4 2.4-6 6-6s5.6 2 6 6M15 15c3 0 5 1.6 6 4"/> }
        @case ('notifiche') { <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/> }
        @case ('impostazioni') { <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-4V21a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14H2.8v-4H3a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1A1.7 1.7 0 0 0 9 4.6 1.7 1.7 0 0 0 10 3V2.8h4V3a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v4H21a1.7 1.7 0 0 0-1.6 1Z"/> }
        @case ('ricerca') { <circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/> }
        @case ('scrivania') { <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/> }
        @case ('chiudi') { <path d="m6 6 12 12M18 6 6 18"/> }
        @case ('azioni') { <circle cx="5" cy="12" r="1" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1" fill="currentColor" stroke="none"/><circle cx="19" cy="12" r="1" fill="currentColor" stroke="none"/> }
        @case ('apri') { <path d="M14 3h7v7M21 3l-9 9"/><path d="M18 13v7H4V6h7"/> }
        @case ('aggiungi') { <path d="M12 5v14M5 12h14"/> }
        @default { <circle cx="12" cy="12" r="8"/> }
      }
    </svg>
  `,
  styles: [':host{display:inline-grid;width:1.15em;height:1.15em;place-items:center;flex:none}:host svg{width:100%;height:100%;display:block}']
})
export class IconaForoComponent {
  @Input({ required: true }) nome = '';
}
