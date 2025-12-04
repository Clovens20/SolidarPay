'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Menu, X, LogIn, UserPlus } from 'lucide-react'

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const router = useRouter()

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-solidarpay-border">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <img 
              src="/logo.png.jpg" 
              alt="SolidarPay" 
              className="h-8 w-8 object-contain"
              onError={(e) => {
                e.target.style.display = 'none'
                e.target.nextElementSibling.style.display = 'flex'
              }}
            />
            <div className="w-8 h-8 bg-gradient-to-br from-solidarpay-primary to-solidarpay-secondary rounded-lg flex items-center justify-center hidden">
              <span className="text-white font-bold text-lg">S</span>
            </div>
            <span className="text-xl font-bold text-solidarpay-text">SolidarPay</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <Link 
              href="/#how-it-works" 
              className="text-sm font-medium text-solidarpay-text/70 hover:text-solidarpay-primary transition-colors"
            >
              Comment ça marche
            </Link>
            <Button
              variant="ghost"
              className="text-solidarpay-text"
              onClick={() => router.push('/login')}
            >
              <LogIn className="w-4 h-4 mr-2" />
              Connexion
            </Button>
            <Button
              className="bg-solidarpay-primary hover:bg-solidarpay-secondary text-white"
              onClick={() => router.push('/register')}
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Inscription
            </Button>
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 text-solidarpay-text"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-solidarpay-border bg-white">
          <div className="container mx-auto px-4 py-4 space-y-3">
            <Link 
              href="/#how-it-works"
              className="block text-sm font-medium text-solidarpay-text/70 hover:text-solidarpay-primary transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Comment ça marche
            </Link>
            <Button
              variant="ghost"
              className="w-full justify-start text-solidarpay-text"
              onClick={() => {
                router.push('/login')
                setMobileMenuOpen(false)
              }}
            >
              <LogIn className="w-4 h-4 mr-2" />
              Connexion
            </Button>
            <Button
              className="w-full bg-solidarpay-primary hover:bg-solidarpay-secondary text-white"
              onClick={() => {
                router.push('/register')
                setMobileMenuOpen(false)
              }}
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Inscription
            </Button>
          </div>
        </div>
      )}
    </nav>
  )
}

