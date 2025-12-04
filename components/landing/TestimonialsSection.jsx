'use client'

import { Quote, Users, Heart, Sparkles } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

const testimonials = [
  {
    icon: Users,
    message: 'Rejoignez des milliers d\'utilisateurs qui ont simplifié leur gestion de tontine',
    highlight: 'milliers d\'utilisateurs'
  },
  {
    icon: Heart,
    message: 'Votre tontine mérite une gestion moderne et transparente',
    highlight: 'moderne et transparente'
  },
  {
    icon: Sparkles,
    message: 'Commencez dès aujourd\'hui, c\'est simple et gratuit',
    highlight: 'simple et gratuit'
  }
]

export default function TestimonialsSection() {
  return (
    <section className="py-20 bg-gradient-to-br from-solidarpay-bg to-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-solidarpay-text mb-4">
            Rejoignez la communauté
          </h2>
          <p className="text-xl text-solidarpay-text/70 max-w-2xl mx-auto">
            Découvrez pourquoi notre communauté grandit chaque jour
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => {
            const Icon = testimonial.icon
            return (
              <Card 
                key={index}
                className="border-solidarpay-border hover:border-solidarpay-primary transition-all duration-300 hover:shadow-lg bg-white"
              >
                <CardContent className="p-8 text-center">
                  <div className="flex justify-center mb-4">
                    <div className="w-12 h-12 bg-solidarpay-primary/10 rounded-full flex items-center justify-center">
                      <Icon className="w-6 h-6 text-solidarpay-primary" />
                    </div>
                  </div>
                  <Quote className="w-8 h-8 text-solidarpay-primary/30 mx-auto mb-4" />
                  <p className="text-base text-solidarpay-text/80 leading-relaxed">
                    {testimonial.message.split(testimonial.highlight).map((part, i, arr) => (
                      <span key={i}>
                        {part}
                        {i < arr.length - 1 && (
                          <span className="font-semibold text-solidarpay-primary">
                            {testimonial.highlight}
                          </span>
                        )}
                      </span>
                    ))}
                  </p>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </section>
  )
}

