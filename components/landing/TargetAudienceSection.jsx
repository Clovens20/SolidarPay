'use client'

import { Users, Globe, Heart, TrendingUp } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

const audiences = [
  {
    icon: Users,
    title: 'Familles',
    description: 'Modernisez vos tontines traditionnelles avec une solution digitale fiable et transparente'
  },
  {
    icon: Globe,
    title: 'Diaspora',
    description: 'Restez connecté financièrement avec votre famille, peu importe où vous vous trouvez'
  },
  {
    icon: TrendingUp,
    title: 'Organisateurs de tontines',
    description: 'Offrez plus de transparence et de facilité dans la gestion de votre groupe'
  },
  {
    icon: Heart,
    title: 'Tous ceux qui croient en l\'entraide',
    description: 'Rejoignez une communauté qui valorise la solidarité et la collaboration financière'
  }
]

export default function TargetAudienceSection() {
  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-solidarpay-text mb-4">
            À qui s'adresse SolidarPay ?
          </h2>
          <p className="text-xl text-solidarpay-text/70 max-w-2xl mx-auto">
            SolidarPay est fait pour toutes les communautés qui croient en la solidarité
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {audiences.map((audience, index) => {
            const Icon = audience.icon
            return (
              <Card 
                key={index}
                className="border-solidarpay-border hover:border-solidarpay-primary transition-all duration-300 hover:shadow-lg"
              >
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-14 h-14 bg-gradient-to-br from-solidarpay-primary to-solidarpay-secondary rounded-lg flex items-center justify-center">
                      <Icon className="w-7 h-7 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-solidarpay-text mb-2">
                        {audience.title}
                      </h3>
                      <p className="text-sm text-solidarpay-text/70">
                        {audience.description}
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

