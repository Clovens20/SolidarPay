'use client'

import { UserPlus, Users, DollarSign, CheckCircle } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

const steps = [
  {
    icon: UserPlus,
    number: '1',
    title: 'Créez votre compte',
    description: 'Inscrivez-vous gratuitement et vérifiez votre identité avec notre système KYC sécurisé'
  },
  {
    icon: Users,
    number: '2',
    title: 'Créez ou rejoignez une tontine',
    description: 'Créez votre propre tontine familiale ou rejoignez une tontine existante'
  },
  {
    icon: DollarSign,
    number: '3',
    title: 'Effectuez vos contributions',
    description: 'Respectez le calendrier établi et effectuez vos contributions en toute simplicité'
  },
  {
    icon: CheckCircle,
    number: '4',
    title: 'Recevez vos paiements',
    description: 'À votre tour, recevez automatiquement votre paiement sans complication'
  }
]

export default function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-20 bg-gradient-to-br from-solidarpay-bg to-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-solidarpay-text mb-4">
            Comment ça marche ?
          </h2>
          <p className="text-xl text-solidarpay-text/70 max-w-2xl mx-auto">
            4 étapes simples pour gérer votre tontine en toute sérénité
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative">
          {/* Connection line for desktop */}
          <div className="hidden lg:block absolute top-24 left-0 right-0 h-0.5 bg-gradient-to-r from-solidarpay-primary via-solidarpay-secondary to-solidarpay-primary opacity-20"></div>

          {steps.map((step, index) => {
            const Icon = step.icon
            return (
              <div key={index} className="relative">
                <Card className="border-solidarpay-border hover:border-solidarpay-primary transition-all duration-300 h-full">
                  <CardContent className="p-6 text-center">
                    <div className="relative inline-flex items-center justify-center mb-6">
                      <div className="absolute w-16 h-16 bg-solidarpay-primary/10 rounded-full"></div>
                      <div className="relative w-12 h-12 bg-solidarpay-primary rounded-full flex items-center justify-center">
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <div className="absolute -top-2 -right-2 w-8 h-8 bg-solidarpay-secondary rounded-full flex items-center justify-center text-white font-bold text-sm">
                        {step.number}
                      </div>
                    </div>
                    <h3 className="text-lg font-semibold text-solidarpay-text mb-3">
                      {step.title}
                    </h3>
                    <p className="text-sm text-solidarpay-text/70">
                      {step.description}
                    </p>
                  </CardContent>
                </Card>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

