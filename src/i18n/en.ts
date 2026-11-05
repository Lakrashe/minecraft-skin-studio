/**
 * English — the reference dictionary. Every other language must provide every
 * key (enforced by the `Dictionary` type in ./types.ts).
 *
 * Use `{name}` placeholders for interpolation.
 */
export const en = {
  common: {
    close: 'Close',
    cancel: 'Cancel',
    loading: 'Loading…',
    dismiss: 'Dismiss notification',
    skipToContent: 'Skip to content',
    notifications: 'Notifications',
  },
  nav: {
    home: 'Home',
    studio: 'Studio',
    settings: 'Settings',
    main: 'Main navigation',
    openMenu: 'Open menu',
    closeMenu: 'Close menu',
    menu: 'Menu',
  },
  theme: {
    switchToLight: 'Switch to light theme',
    switchToDark: 'Switch to dark theme',
  },
  home: {
    title: 'Home',
    eyebrow: 'Minecraft skin creation studio',
    headline: 'Create Your Own Minecraft Identity.',
    subtitle: 'Design every pixel. Customize every detail. Bring your character to life.',
    ctaStudio: 'Open the Studio',
    ctaCharacters: 'Meet the sample characters',
    heroViewerLabel: 'Interactive 3D preview of the {name} sample character. Drag to rotate.',
    dragHint: 'Drag to rotate',
    features: {
      title: 'Everything for your Minecraft look',
      intro:
        'The studio is being built in stages. Here is what each part does, and where it stands today.',
      status: {
        available: 'Available now',
        inProgress: 'In development',
        planned: 'Planned',
      },
      pixelEditor: {
        title: 'Advanced Pixel Editor',
        body: 'Paint every pixel of the 64×64 texture with precise tools, layers and mirror drawing.',
      },
      preview3d: {
        title: 'Real-Time 3D Preview',
        body: 'Rotate, zoom and animate an accurate Minecraft character, with both skin layers.',
      },
      ai: {
        title: 'AI Skin Generator',
        body: 'Describe a character and get editable, correctly mapped Minecraft skins.',
      },
      outfits: {
        title: 'Outfit Creator',
        body: 'Mix and match clothing on the outer layer without losing your original skin.',
      },
      showcase: {
        title: 'Cinematic Showcase',
        body: 'Pose your character and export high-resolution renders for social media.',
      },
      marketplace: {
        title: 'Community Marketplace',
        body: 'Share and discover skins from other creators. Optional: the editor stays free.',
      },
    },
    characters: {
      title: 'Sample characters',
      intro:
        'Original characters designed for this studio. Each one is a real 64×64 skin you can inspect in 2D and 3D.',
      choose: 'Choose a character',
      openInStudio: 'Open in Studio',
      viewerLabel: '3D preview of {name}. Drag to rotate.',
      classic: 'Classic arms',
      slim: 'Slim arms',
      outerLayer: 'Outer layer',
    },
    accuracy: {
      title: 'Built for Minecraft accuracy',
      intro: 'What you see in the studio is exactly what Minecraft will show.',
      format: {
        title: '64×64 skin format',
        body: 'The standard texture used by Java Edition and Bedrock Edition custom skins.',
      },
      models: {
        title: 'Classic and slim models',
        body: 'Both arm widths, with the exact texture regions for each.',
      },
      layers: {
        title: 'Inner and outer layers',
        body: 'Hat, jacket, sleeves and pants render as a separate shell, with transparency.',
      },
      uv: {
        title: 'Tested UV mapping',
        body: 'Every face of every body part is mapped from one tested region table.',
      },
    },
    faq: {
      title: 'Frequently asked questions',
      free: {
        q: 'Is it free?',
        a: 'Yes. The skin studio is free to use. A future marketplace will be optional and separate from the editor.',
      },
      account: {
        q: 'Do I need an account?',
        a: 'No. Everything available today works without an account. Accounts will only be needed for cloud saving and community features.',
      },
      editions: {
        q: 'Which Minecraft editions are supported?',
        a: 'Skins use the standard 64×64 format with classic or slim arms, which works for Java Edition and for custom skins in Bedrock Edition.',
      },
      edit: {
        q: 'Can I edit skins yet?',
        a: 'Not yet. Right now you can inspect skins in 2D and 3D in the studio. Drawing tools, import and export are the next milestones.',
      },
      affiliated: {
        q: 'Is this an official Minecraft product?',
        a: 'No. It is an independent project, not approved by or associated with Mojang or Microsoft.',
      },
    },
    finalCta: {
      title: 'See every pixel from every angle',
      body: 'Open the studio to explore the sample characters in 2D and 3D.',
    },
  },
  samples: {
    explorer: { name: 'Explorer', tagline: 'Trail jacket, backpack and boots.' },
    knight: { name: 'Knight', tagline: 'Steel armor with a visored helmet.' },
    mage: { name: 'Mage', tagline: 'Hooded robe with a flowing cape.' },
    runner: { name: 'Runner', tagline: 'Neon visor and an open street jacket.' },
  },
  studio: {
    title: 'Studio',
    viewerNotice: "Viewer mode: inspect skins in 2D and 3D. Editing isn't available yet.",
    character: 'Character',
    panels: {
      view: 'View',
      texture: '2D texture',
      preview: '3D preview',
    },
    bodyPart: 'Body part',
    parts: {
      all: 'Full skin',
      head: 'Head',
      body: 'Body',
      rightArm: 'Right arm',
      leftArm: 'Left arm',
      rightLeg: 'Right leg',
      leftLeg: 'Left leg',
    },
    layers: 'Skin layers',
    inner: 'Inner layer',
    innerHint: 'Head, body, arms and legs',
    outer: 'Outer layer',
    outerHint: 'Hat, jacket, sleeves and pants',
    canvas: 'Canvas',
    grid: 'Pixel grid',
    outlines: 'Face outlines',
    model: 'Model',
    classic: 'Classic',
    slim: 'Slim',
    modelHint: 'Classic (Steve) arms are 4 pixels wide, slim (Alex) arms 3.',
    modelMismatch: 'This skin was designed for {model} arms.',
    zoomIn: 'Zoom in',
    zoomOut: 'Zoom out',
    fit: 'Fit to view',
    zoomLevel: '{zoom}×',
    textureLabel: '64×64 skin texture of {name}. Use the arrow keys to inspect pixels.',
    previewLabel: '3D preview of {name}',
    camera: 'Camera',
    views: {
      front: 'Front',
      back: 'Back',
      left: 'Left side',
      right: 'Right side',
      top: 'Top',
      reset: 'Reset view',
    },
    animation: 'Animation',
    animations: {
      idle: 'Idle',
      walk: 'Walk',
      none: 'Off',
    },
    pause: 'Pause animation',
    play: 'Play animation',
    fullscreen: 'Full screen',
    exitFullscreen: 'Exit full screen',
    status: {
      none: 'Hover the texture or use the arrow keys to inspect a pixel',
      pixel: 'Pixel {x}, {y}',
      unused: 'Unused area',
      transparent: 'Transparent',
      layerInner: 'Inner',
      layerOuter: 'Outer',
      faces: {
        top: 'Top',
        bottom: 'Bottom',
        right: 'Right',
        front: 'Front',
        left: 'Left',
        back: 'Back',
      },
    },
  },
  settings: {
    title: 'Settings',
    intro: 'Preferences are saved on this device automatically.',
    notSaved:
      "Preferences can't be saved on this device right now. Changes apply until you close or reload the page.",
    appearance: 'Appearance',
    theme: 'Theme',
    themeDark: 'Dark',
    themeLight: 'Light',
    themeSystem: 'System',
    accent: 'Accent color',
    accentHint: 'Used for highlights, focus rings and active controls.',
    accentCustom: 'Custom accent color',
    accentNames: {
      emerald: 'Emerald',
      diamond: 'Diamond',
      lapis: 'Lapis',
      amethyst: 'Amethyst',
      redstone: 'Redstone',
      copper: 'Copper',
      gold: 'Gold',
    },
    language: 'Language',
    languageHint: 'More languages can be added later.',
    motion: 'Animations',
    motionHint: 'Reduce motion for transitions and background effects.',
    motionSystem: 'Follow system',
    motionReduced: 'Reduced',
    motionFull: 'Full',
    reset: 'Reset settings',
    resetTitle: 'Reset all settings?',
    resetDescription:
      'Theme, accent color, language and animation preferences return to their defaults.',
    resetConfirm: 'Reset',
    resetDone: 'Settings reset to defaults.',
  },
  languages: {
    en: 'English',
    it: 'Italiano',
  },
  notFound: {
    title: 'Page not found',
    message: 'The page you are looking for does not exist or has moved.',
    backHome: 'Back to home',
  },
  error: {
    title: 'Something went wrong',
    message: 'An unexpected error occurred. Reloading the page usually fixes it.',
    reload: 'Reload page',
  },
  footer: {
    notAffiliated:
      'Not an official Minecraft product. Not approved by or associated with Mojang or Microsoft.',
    rights: '© {year} {brand}',
  },
  webgl: {
    unavailable: '3D preview is not available: your browser or device does not support WebGL.',
  },
  devUi: {
    title: 'Design system',
  },
} as const;
