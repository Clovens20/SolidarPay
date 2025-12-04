'use client'

import { Button } from '@/components/ui/button'
import { ArrowRight, Play } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function HeroSection() {
  const router = useRouter()

  return (
    <section className="relative min-h-[90vh] flex items-center justify-center bg-gradient-to-br from-solidarpay-bg via-white to-solidarpay-bg overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-10 w-72 h-72 bg-solidarpay-primary/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-solidarpay-secondary/10 rounded-full blur-3xl"></div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left side - Text content */}
          <div className="text-center lg:text-left space-y-8 animate-fade-in">
            <div className="space-y-4">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-solidarpay-text leading-tight">
                SolidarPay
                <br />
                <span className="text-solidarpay-primary">La Tontine Simplifiée</span>
              </h1>
              <p className="text-xl sm:text-2xl text-solidarpay-text/70 max-w-2xl mx-auto lg:mx-0">
                Simplifiez la gestion de vos tontines grâce à la technologie
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Button
                size="lg"
                className="bg-solidarpay-primary hover:bg-solidarpay-secondary text-white px-8 py-6 text-lg"
                onClick={() => router.push('/register')}
              >
                Commencer gratuitement
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-solidarpay-primary text-solidarpay-primary hover:bg-solidarpay-bg px-8 py-6 text-lg"
                onClick={() => {
                  document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })
                }}
              >
                <Play className="mr-2 w-5 h-5" />
                En savoir plus
              </Button>
            </div>

            <div className="flex items-center justify-center lg:justify-start gap-8 text-sm text-solidarpay-text/60">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Gratuit</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Sans engagement</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>100% Sécurisé</span>
              </div>
            </div>
          </div>

          {/* Right side - Illustration */}
          <div className="relative animate-slide-in-right">
            <div className="relative w-full h-[500px] flex items-center justify-center">
              {/* Illustration SVG */}
              <svg
                viewBox="0 0 400 400"
                className="w-full h-full"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                {/* Circle background */}
                <circle
                  cx="200"
                  cy="200"
                  r="180"
                  fill="url(#gradient1)"
                  opacity="0.1"
                />
                
                {/* Family illustration */}
                <g transform="translate(100, 50)">
                  {/* Person 1 */}
                  <circle cx="80" cy="80" r="30" fill="#0891B2" opacity="0.8" />
                  <rect x="65" y="110" width="30" height="60" rx="15" fill="#0891B2" opacity="0.8" />
                  
                  {/* Person 2 */}
                  <circle cx="200" cy="60" r="35" fill="#0E7490" opacity="0.8" />
                  <rect x="182" y="95" width="36" height="70" rx="18" fill="#0E7490" opacity="0.8" />
                  
                  {/* Person 3 */}
                  <circle cx="120" cy="200" r="28" fill="#0891B2" opacity="0.8" />
                  <rect x="108" y="228" width="28" height="55" rx="14" fill="#0891B2" opacity="0.8" />
                  
                  {/* Connection lines */}
                  <line x1="110" y1="110" x2="185" y2="95" stroke="#0891B2" strokeWidth="3" opacity="0.3" />
                  <line x1="80" y1="170" x2="120" y2="228" stroke="#0891B2" strokeWidth="3" opacity="0.3" />
                  
                  {/* Money symbol */}
                  <circle cx="200" cy="250" r="40" fill="#10B981" opacity="0.2" />
                  <text x="200" y="260" fontSize="40" fill="#10B981" textAnchor="middle" fontWeight="bold">$</text>
                </g>
                
                <defs>
                  <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#0891B2" />
                    <stop offset="100%" stopColor="#0E7490" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

