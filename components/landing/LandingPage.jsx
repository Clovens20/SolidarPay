'use client'

import Navbar from './Navbar'
import HeroSection from './HeroSection'
import WhatIsSection from './WhatIsSection'
import FeaturesSection from './FeaturesSection'
import HowItWorksSection from './HowItWorksSection'
import TargetAudienceSection from './TargetAudienceSection'
import TestimonialsSection from './TestimonialsSection'
import CTASection from './CTASection'
import Footer from './Footer'

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main>
        <HeroSection />
        <WhatIsSection />
        <FeaturesSection />
        <HowItWorksSection />
        <TargetAudienceSection />
        <TestimonialsSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  )
}

