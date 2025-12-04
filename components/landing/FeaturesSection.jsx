'use client'

import { 
  Shield, 
  Clock, 
  Bell, 
  FileText, 
  Globe, 
  TrendingUp 
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

const features = [
  {
    icon: Shield,
    title: 'Sécurité maximale',
    description: 'Vérification KYC pour garantir la sécurité de votre tontine familiale'
  },
  {
    icon: Clock,
    title: 'Suivi en temps réel',
    description: 'Consultez les contributions et paiements en temps réel, où que vous soyez'
  },
  {
    icon: Bell,
    title: 'Notifications automatiques',
    description: 'Recevez des alertes pour ne jamais manquer une contribution ou un paiement'
  },
  {
    icon: FileText,
    title: 'Historique complet',
    description: 'Accédez à l\'historique détaillé de toutes vos transactions avec transparence'
  },
  {
    icon: Globe,
    title: 'Multidevise',
    description: 'Gérez vos tontines en XAF, USD, EUR, CAD et plus encore'
  },
  {
    icon: TrendingUp,
    title: 'Gestion simplifiée',
    description: 'Interface intuitive pour organiser et gérer votre tontine familiale facilement'
  }
]

export default function FeaturesSection() {
  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-solidarpay-text mb-4">
            Pourquoi SolidarPay ?
          </h2>
          <p className="text-xl text-solidarpay-text/70 max-w-2xl mx-auto">
            Découvrez les avantages qui font de SolidarPay la solution idéale pour votre tontine
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon
            return (
              <Card 
                key={index} 
                className="border-solidarpay-border hover:border-solidarpay-primary transition-all duration-300 hover:shadow-lg"
              >
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-12 h-12 bg-solidarpay-primary/10 rounded-lg flex items-center justify-center">
                      <Icon className="w-6 h-6 text-solidarpay-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-solidarpay-text mb-2">
                        {feature.title}
                      </h3>
                      <p className="text-sm text-solidarpay-text/70">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </section>
  )
}

