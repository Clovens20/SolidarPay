'use client'

import { Sparkles, Shield, Eye, Smartphone } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

const benefits = [
  {
    icon: Smartphone,
    title: 'Facilité',
    description: 'Interface intuitive accessible depuis votre téléphone ou ordinateur'
  },
  {
    icon: Shield,
    title: 'Sécurité',
    description: 'Vérification KYC et protection des données pour une tranquillité d\'esprit'
  },
  {
    icon: Eye,
    title: 'Transparence',
    description: 'Suivez toutes les transactions en temps réel avec un historique complet'
  },
  {
    icon: Sparkles,
    title: 'Accessibilité',
    description: 'Disponible 24/7, où que vous soyez, avec support multidevise'
  }
]

export default function WhatIsSection() {
  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-solidarpay-text mb-4">
              Qu'est-ce que SolidarPay ?
            </h2>
            <p className="text-xl text-solidarpay-text/70 leading-relaxed">
              SolidarPay est une plateforme digitale qui modernise les tontines traditionnelles. 
              Nous combinons l'esprit de solidarité avec la technologie moderne pour vous offrir 
              une expérience simple, sécurisée et transparente.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12">
            {benefits.map((benefit, index) => {
              const Icon = benefit.icon
              return (
                <Card 
                  key={index}
                  className="border-solidarpay-border hover:border-solidarpay-primary transition-all duration-300"
                >
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-12 h-12 bg-solidarpay-primary/10 rounded-lg flex items-center justify-center">
                        <Icon className="w-6 h-6 text-solidarpay-primary" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-solidarpay-text mb-2">
                          {benefit.title}
                        </h3>
                        <p className="text-sm text-solidarpay-text/70">
                          {benefit.description}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}

