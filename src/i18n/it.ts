import type { Dictionary } from './types';

export const it: Dictionary = {
  common: {
    close: 'Chiudi',
    cancel: 'Annulla',
    loading: 'Caricamento…',
    dismiss: 'Chiudi notifica',
    skipToContent: 'Vai al contenuto',
    notifications: 'Notifiche',
  },
  nav: {
    home: 'Home',
    settings: 'Impostazioni',
    main: 'Navigazione principale',
    openMenu: 'Apri menu',
    closeMenu: 'Chiudi menu',
    menu: 'Menu',
  },
  theme: {
    switchToLight: 'Passa al tema chiaro',
    switchToDark: 'Passa al tema scuro',
  },
  home: {
    title: 'Home',
    eyebrow: 'Studio di creazione skin per Minecraft',
    headline: 'Crea la tua identità Minecraft.',
    subtitle: 'Disegna ogni pixel. Personalizza ogni dettaglio. Dai vita al tuo personaggio.',
  },
  settings: {
    title: 'Impostazioni',
    intro: 'Le preferenze vengono salvate automaticamente su questo dispositivo.',
    appearance: 'Aspetto',
    theme: 'Tema',
    themeDark: 'Scuro',
    themeLight: 'Chiaro',
    themeSystem: 'Sistema',
    accent: 'Colore di accento',
    accentHint: 'Usato per evidenziazioni, indicatori di focus e controlli attivi.',
    accentCustom: 'Colore di accento personalizzato',
    accentNames: {
      emerald: 'Smeraldo',
      diamond: 'Diamante',
      lapis: 'Lapislazzuli',
      amethyst: 'Ametista',
      redstone: 'Pietrarossa',
      copper: 'Rame',
      gold: 'Oro',
    },
    language: 'Lingua',
    languageHint: 'Altre lingue potranno essere aggiunte in futuro.',
    motion: 'Animazioni',
    motionHint: 'Riduci il movimento di transizioni ed effetti di sfondo.',
    motionSystem: 'Come il sistema',
    motionReduced: 'Ridotte',
    motionFull: 'Complete',
    reset: 'Ripristina impostazioni',
    resetTitle: 'Ripristinare tutte le impostazioni?',
    resetDescription:
      'Tema, colore di accento, lingua e preferenze delle animazioni torneranno ai valori predefiniti.',
    resetConfirm: 'Ripristina',
    resetDone: 'Impostazioni ripristinate.',
  },
  languages: {
    en: 'English',
    it: 'Italiano',
  },
  notFound: {
    title: 'Pagina non trovata',
    message: 'La pagina che cerchi non esiste o è stata spostata.',
    backHome: 'Torna alla home',
  },
  error: {
    title: 'Qualcosa è andato storto',
    message: 'Si è verificato un errore imprevisto. Di solito basta ricaricare la pagina.',
    reload: 'Ricarica la pagina',
  },
  footer: {
    notAffiliated:
      'Non è un prodotto ufficiale di Minecraft. Non approvato né associato a Mojang o Microsoft.',
    rights: '© {year} {brand}',
  },
  webgl: {
    unavailable:
      "L'anteprima 3D non è disponibile: il browser o il dispositivo non supporta WebGL.",
  },
  devUi: {
    title: 'Sistema di design',
  },
};
