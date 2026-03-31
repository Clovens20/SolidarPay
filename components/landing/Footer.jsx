'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { getDefaultFooterContentMap } from '@/lib/fallback-footer-content'
import { Mail, Phone } from 'lucide-react'

export default function Footer() {
  const [footerContent, setFooterContent] = useState({
    brand: null,
    navigation: null,
    legal: null,
    contact: null,
    social: null
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadFooterContent()
  }, [])

  const loadFooterContent = async () => {
    try {
      const res = await fetch('/api/footer-content')
      const json = await res.json().catch(() => ({}))
      if (json.sections && typeof json.sections === 'object') {
        setFooterContent(json.sections)
      } else {
        setFooterContent(getDefaultFooterContentMap())
      }
    } catch {
      setFooterContent(getDefaultFooterContentMap())
    } finally {
      setLoading(false)
    }
  }

  const getSocialIcon = (platform) => {
    const normalized = platform?.toLowerCase()
    switch (normalized) {
      case 'tiktok':
        return (
          <svg 
            className="w-5 h-5" 
            viewBox="0 0 24 24" 
            fill="currentColor"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
          </svg>
        )
      default:
        return null
    }
  }

  if (loading) {
    return (
      <footer className="bg-solidarpay-text text-white py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center text-white/70">Chargement...</div>
        </div>
      </footer>
    )
  }

  const brand = footerContent.brand
  const navigation = footerContent.navigation
  const legal = footerContent.legal
  const contact = footerContent.contact
  const social = footerContent.social

  return (
    <footer className="bg-solidarpay-text text-white py-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          {brand && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <img 
                  src="/logo.png.jpg" 
                  alt="SolidarPay" 
                  className="h-8 w-8 object-contain"
                  onError={(e) => {
                    e.target.style.display = 'none'
                    const fallback = e.target.nextElementSibling
                    if (fallback) fallback.style.display = 'flex'
                  }}
                />
                <div className="w-8 h-8 bg-gradient-to-br from-solidarpay-primary to-solidarpay-secondary rounded-lg flex items-center justify-center hidden">
                  <span className="text-white font-bold text-lg">S</span>
                </div>
                <span className="text-xl font-bold">{brand.title || 'SolidarPay'}</span>
              </div>
              {brand.content?.description && (
                <p className="text-white/70 text-sm">
                  {brand.content.description}
                </p>
              )}
            </div>
          )}

          {/* Navigation */}
          {navigation && navigation.content?.links && navigation.content.links.length > 0 && (
            <div>
              <h3 className="font-semibold mb-4">Navigation</h3>
              <ul className="space-y-2 text-sm">
                {navigation.content.links.map((link, index) => (
                  <li key={index}>
                    <Link 
                      href={link.href || '#'} 
                      className="text-white/70 hover:text-white transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Legal */}
          {legal && legal.content?.links && legal.content.links.length > 0 && (
            <div>
              <h3 className="font-semibold mb-4">Légal</h3>
              <ul className="space-y-2 text-sm">
                {legal.content.links.map((link, index) => (
                  <li key={index}>
                    <Link 
                      href={link.href || '#'} 
                      className="text-white/70 hover:text-white transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Contact */}
          {contact && (
            <div>
              <h3 className="font-semibold mb-4">Contact</h3>
              <ul className="space-y-3 text-sm">
                {contact.content?.email && (
                  <li className="flex items-center gap-2 text-white/70">
                    <Mail className="w-4 h-4" />
                    <a 
                      href={`mailto:${contact.content.email}`}
                      className="hover:text-white transition-colors"
                    >
                      {contact.content.email}
                    </a>
                  </li>
                )}
                {contact.content?.phone && (
                  <li className="flex items-center gap-2 text-white/70">
                    <Phone className="w-4 h-4" />
                    <a 
                      href={`tel:${contact.content.phone.replace(/\s/g, '')}`}
                      className="hover:text-white transition-colors"
                    >
                      {contact.content.phone}
                    </a>
                  </li>
                )}
              </ul>
              {social && social.content?.links && social.content.links.length > 0 && (
                <div className="flex gap-4 mt-4">
                  {social.content.links.map((link, index) => (
                    <a 
                      key={index}
                      href={link.url || '#'} 
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-white/70 hover:text-white transition-colors"
                      aria-label={link.platform || 'Réseau social'}
                    >
                      {getSocialIcon(link.platform)}
                    </a>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="border-t border-white/20 pt-8 text-center text-sm text-white/70">
          <p>&copy; {new Date().getFullYear()} SolidarPay. Tous droits réservés.</p>
        </div>
      </div>
    </footer>
  )
}
