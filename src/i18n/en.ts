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
  },
  settings: {
    title: 'Settings',
    intro: 'Preferences are saved on this device automatically.',
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
