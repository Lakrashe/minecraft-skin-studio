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
    studio: 'Studio',
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
    ctaStudio: 'Apri lo Studio',
    ctaCharacters: 'Scopri i personaggi di esempio',
    heroViewerLabel:
      'Anteprima 3D interattiva del personaggio di esempio {name}. Trascina per ruotare.',
    dragHint: 'Trascina per ruotare',
    pauseMotion: 'Metti in pausa l’animazione',
    playMotion: 'Avvia l’animazione',
    features: {
      title: 'Tutto per il tuo look Minecraft',
      intro: 'Lo studio viene costruito per fasi. Ecco cosa fa ogni parte e a che punto è oggi.',
      status: {
        available: 'Disponibile',
        inProgress: 'In sviluppo',
        planned: 'In programma',
      },
      pixelEditor: {
        title: 'Editor pixel avanzato',
        body: 'Dipingi ogni pixel della texture 64×64 con strumenti precisi, livelli e disegno a specchio.',
      },
      preview3d: {
        title: 'Anteprima 3D in tempo reale',
        body: 'Ruota, ingrandisci e anima un personaggio Minecraft fedele, con entrambi i livelli della skin.',
      },
      ai: {
        title: 'Generatore di skin con IA',
        body: 'Descrivi un personaggio e ottieni skin Minecraft modificabili e mappate correttamente.',
      },
      outfits: {
        title: 'Creatore di outfit',
        body: 'Combina capi sul livello esterno senza perdere la tua skin originale.',
      },
      showcase: {
        title: 'Vetrina cinematografica',
        body: 'Metti in posa il personaggio ed esporta render ad alta risoluzione per i social.',
      },
      marketplace: {
        title: 'Marketplace della community',
        body: "Condividi e scopri skin di altri creatori. Facoltativo: l'editor resta gratuito.",
      },
    },
    characters: {
      title: 'Personaggi di esempio',
      intro:
        'Personaggi originali creati per questo studio. Ognuno è una vera skin 64×64 da esaminare in 2D e 3D.',
      choose: 'Scegli un personaggio',
      openInStudio: 'Apri nello Studio',
      viewerLabel: 'Anteprima 3D di {name}. Trascina per ruotare.',
      classic: 'Braccia classiche',
      slim: 'Braccia sottili',
      outerLayer: 'Livello esterno',
    },
    accuracy: {
      title: 'Fedele a Minecraft',
      intro:
        'Lo studio usa le stesse regioni di texture di Minecraft, verificate da test automatici.',
      format: {
        title: 'Formato skin 64×64',
        body: 'La texture standard usata dalle skin personalizzate di Java Edition e Bedrock Edition.',
      },
      models: {
        title: 'Modelli classico e sottile',
        body: 'Entrambe le larghezze delle braccia, con le aree di texture esatte per ciascuna.',
      },
      layers: {
        title: 'Livello interno ed esterno',
        body: 'Cappello, giacca, maniche e pantaloni sono un guscio separato, con trasparenza.',
      },
      uv: {
        title: 'Mappatura UV testata',
        body: 'Ogni faccia di ogni parte del corpo è mappata da un’unica tabella di regioni testata.',
      },
    },
    faq: {
      title: 'Domande frequenti',
      free: {
        q: 'È gratuito?',
        a: 'Sì. Lo studio è gratuito. Un futuro marketplace sarà facoltativo e separato dall’editor.',
      },
      account: {
        q: 'Serve un account?',
        a: 'No. Tutto ciò che è disponibile oggi funziona senza account. Gli account serviranno solo per il salvataggio nel cloud e le funzioni della community.',
      },
      editions: {
        q: 'Quali edizioni di Minecraft sono supportate?',
        a: 'Le skin usano il formato standard 64×64 con braccia classiche o sottili, valido per Java Edition e per le skin personalizzate di Bedrock Edition.',
      },
      edit: {
        q: 'Posso già modificare le skin?',
        a: 'Non ancora. Per ora puoi esaminare le skin in 2D e 3D nello studio. Strumenti di disegno, importazione ed esportazione sono i prossimi traguardi.',
      },
      affiliated: {
        q: 'È un prodotto ufficiale di Minecraft?',
        a: 'No. È un progetto indipendente, non approvato né associato a Mojang o Microsoft.',
      },
    },
    finalCta: {
      title: 'Guarda ogni pixel da ogni angolazione',
      body: 'Apri lo studio per esplorare i personaggi di esempio in 2D e 3D.',
    },
  },
  samples: {
    explorer: { name: 'Esploratore', tagline: 'Giacca da trekking, zaino e scarponi.' },
    knight: { name: 'Cavaliere', tagline: 'Armatura d’acciaio con elmo a visiera.' },
    mage: { name: 'Mago', tagline: 'Tunica con cappuccio e mantello.' },
    runner: { name: 'Runner', tagline: 'Visore al neon e giacca aperta.' },
  },
  studio: {
    title: 'Studio',
    viewerNotice:
      'Modalità visualizzazione: esamina le skin in 2D e 3D. La modifica non è ancora disponibile.',
    character: 'Personaggio',
    panels: {
      view: 'Vista',
      texture: 'Texture 2D',
      preview: 'Anteprima 3D',
    },
    bodyPart: 'Parte del corpo',
    parts: {
      all: 'Skin completa',
      head: 'Testa',
      body: 'Busto',
      rightArm: 'Braccio destro',
      leftArm: 'Braccio sinistro',
      rightLeg: 'Gamba destra',
      leftLeg: 'Gamba sinistra',
    },
    layers: 'Livelli della skin',
    inner: 'Livello interno',
    innerHint: 'Testa, busto, braccia e gambe',
    outer: 'Livello esterno',
    outerHint: 'Cappello, giacca, maniche e pantaloni',
    canvas: 'Tela',
    grid: 'Griglia dei pixel',
    outlines: 'Contorni delle facce',
    model: 'Modello',
    classic: 'Classico',
    slim: 'Sottile',
    modelHint: 'Le braccia classiche (Steve) sono larghe 4 pixel, quelle sottili (Alex) 3.',
    modelMismatch: 'Questa skin è stata disegnata per braccia {model}.',
    zoomIn: 'Ingrandisci',
    zoomOut: 'Riduci',
    fit: 'Adatta alla vista',
    zoomLevel: '{zoom}×',
    textureLabel: 'Texture 64×64 della skin di {name}. Usa le frecce per esaminare i pixel.',
    previewLabel: 'Anteprima 3D di {name}',
    camera: 'Inquadratura',
    views: {
      front: 'Fronte',
      back: 'Retro',
      left: 'Lato sinistro',
      right: 'Lato destro',
      top: 'Dall’alto',
      reset: 'Ripristina vista',
    },
    animation: 'Animazione',
    animations: {
      idle: 'A riposo',
      walk: 'Camminata',
      none: 'Spenta',
    },
    pause: 'Metti in pausa l’animazione',
    play: 'Avvia l’animazione',
    fullscreen: 'Schermo intero',
    exitFullscreen: 'Esci da schermo intero',
    fullscreenFailed:
      'Lo schermo intero non è disponibile ora. L’anteprima continua a funzionare qui.',
    flatPreviewLabel: 'Vista frontale piatta di {name}',
    flatPreviewNote:
      'Viene mostrata una vista frontale piatta che segue le impostazioni di livelli e parti del corpo.',
    status: {
      none: 'Passa sulla texture o usa le frecce per esaminare un pixel',
      pixel: 'Pixel {x}, {y}',
      unused: 'Area non usata',
      transparent: 'Trasparente',
      layerInner: 'Interno',
      layerOuter: 'Esterno',
      faces: {
        top: 'Sopra',
        bottom: 'Sotto',
        right: 'Destra',
        front: 'Fronte',
        left: 'Sinistra',
        back: 'Retro',
      },
    },
  },
  settings: {
    title: 'Impostazioni',
    intro: 'Le preferenze vengono salvate automaticamente su questo dispositivo.',
    notSaved:
      'Al momento non è possibile salvare le preferenze su questo dispositivo. Le modifiche restano valide finché non chiudi o ricarichi la pagina.',
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
