/** Carte des sections footer (même forme que le mapping client depuis `footer_content`). */
export function getDefaultFooterContentMap() {
  return {
    brand: {
      title: 'SolidarPay',
      content: {
        description:
          'La plateforme digitale qui modernise les tontines familiales africaines',
      },
    },
    navigation: {
      content: {
        links: [
          { label: 'Comment ça marche', href: '/#how-it-works' },
          { label: 'Inscription', href: '/register' },
          { label: 'Connexion', href: '/login' },
        ],
      },
    },
    legal: {
      content: {
        links: [
          { label: 'À propos', href: '/about' },
          { label: 'Contact', href: '/contact' },
          { label: 'CGU', href: '/terms' },
          { label: 'Confidentialité', href: '/privacy' },
        ],
      },
    },
    contact: {
      content: { email: 'support@solidarpay.com', phone: '+1 (555) 123-4567' },
    },
    social: {
      content: {
        links: [{ platform: 'tiktok', url: '#' }],
      },
    },
  }
}
