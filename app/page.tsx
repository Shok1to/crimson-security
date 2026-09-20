import CapabilityTabs from '@/components/CapabilityTabs';
import ContactSection from '@/components/ContactSection';
import Differentiators from '@/components/Differentiators';
import Hero from '@/components/Hero';
import ServicesGrid from '@/components/ServicesGrid';
import StatsBand from '@/components/StatsBand';
import StorySection from '@/components/StorySection';

export default function HomePage() {
  return (
    <>
      <Hero />
      <StorySection />
      <ServicesGrid />
      <CapabilityTabs />
      <StatsBand />
      <Differentiators />
      <ContactSection />
    </>
  );
}
