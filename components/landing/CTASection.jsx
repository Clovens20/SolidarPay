'use client'

import { Button } from '@/components/ui/button'
import { ArrowRight, LogIn } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'

export default function CTASection() {
  const router = useRouter()

  return (
    <section className="py-20 bg-gradient-to-br from-solidarpay-primary to-solidarpay-secondary">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <Card className="border-0 shadow-2xl bg-white/95 backdrop-blur-sm">
          <CardContent className="p-12 text-center">
            <h2 className="text-3xl sm:text-4xl font-bold text-solidarpay-text mb-4">
              Prêt à commencer ?
            </h2>
            <p className="text-xl text-solidarpay-text/70 mb-8 max-w-2xl mx-auto">
              Rejoignez SolidarPay aujourd'hui et simplifiez la gestion de votre tontine
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button
                size="lg"
                className="bg-solidarpay-primary hover:bg-solidarpay-secondary text-white px-8 py-6 text-lg"
                onClick={() => router.push('/register')}
              >
                Créer mon compte gratuitement
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
              
              <Button
                size="lg"
                variant="outline"
                className="border-solidarpay-primary text-solidarpay-primary hover:bg-solidarpay-bg px-8 py-6 text-lg"
                onClick={() => router.push('/login')}
              >
                <LogIn className="mr-2 w-5 h-5" />
                Déjà membre ? Connexion
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  )
}

