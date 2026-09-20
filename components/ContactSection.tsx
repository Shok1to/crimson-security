import { site } from '@/lib/site';
import ContactForm from './ContactForm';
import Reveal from './Reveal';
import SectionHeading from './SectionHeading';
import CircuitTexture from './CircuitTexture';

const assurances = [
  'Off-hours and weekend assessments at no extra cost',
  'Owner present on assessments when possible',
  'Client references available in similar verticals',
  'Technical support Monday to Friday, 9am–5pm',
];

export default function ContactSection() {
  return (
    <section id="contact" aria-labelledby="contact-heading" className="theme-light relative overflow-hidden bg-ink-950 py-24 lg:py-32">
      <CircuitTexture side="right" className="top-10 hidden h-[560px] opacity-50 lg:block" />

      <div className="relative mx-auto grid max-w-7xl gap-14 px-5 sm:px-8 lg:grid-cols-[5fr_6fr] lg:gap-20">
        <div>
          <SectionHeading
            label="Get in touch"
            title={
              <span id="contact-heading">
                Let&apos;s talk about <span className="text-crimson-gradient">your security.</span>
              </span>
            }
            description="Tell us about your environment and what you need assessed. We'll follow up by email."
          />

          <Reveal delay={0.15}>
            <ul className="leaf-list mt-10 space-y-3.5 text-base text-silver-200">
              {assurances.map((text) => (
                <li key={text}>{text}</li>
              ))}
              {site.email && (
                <li>
                  <a href={`mailto:${site.email}`} className="underline underline-offset-4 hover:text-silver-50">
                    {site.email}
                  </a>
                </li>
              )}
            </ul>
          </Reveal>
        </div>

        <Reveal delay={0.1}>
          <div className="silver-border card-surface rounded-3xl p-6 shadow-card sm:p-9">
            <ContactForm />
          </div>
        </Reveal>
      </div>
    </section>
  );
}
