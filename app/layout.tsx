import type { Metadata, Viewport } from "next"
import { Archivo, Inter } from "next/font/google"
import ChatWidget from "@/components/ChatWidget"
import Script from "next/script"
import Footer from "@/components/Footer"
import Header from "@/components/Header"
import Providers from "@/components/Providers"
import { services, supportHours } from "@/lib/content"
import { site } from "@/lib/site"
import { GoogleAnalytics } from '@next/third-parties/google'
import "./globals.css"

const display = Archivo({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  variable: "--font-display",
  display: "swap",
})

const sans = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
})

const title = `${site.name} — ${site.tagline}`

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: title, template: `%s | ${site.name}` },
  description: site.description,
  applicationName: site.name,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "en_CA",
    siteName: site.name,
    title,
    description: site.description,
    url: "/",
  },
  twitter: {
    card: "summary_large_image",
    title,
    description: site.description,
  },
  robots: { index: true, follow: true },
}

export const viewport: Viewport = {
  themeColor: "#0d0d0d",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
}

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "ProfessionalService",
  "@id": `${site.url}/#organization`,
  name: site.name,
  slogan: site.tagline,
  description: site.description,
  url: site.url,
  logo: `${site.url}/crimson-security-logo.png`,
  image: `${site.url}/opengraph-image.png`,
  email: site.emails.info,
  address: {
    "@type": "PostalAddress",
    streetAddress: site.address.street,
    addressLocality: site.address.locality,
    addressRegion: site.address.regionCode,
    postalCode: site.address.postalCode,
    addressCountry: site.address.countryCode,
  },
  areaServed: [site.address.country, ...site.locations],
  /**
   * DERIVED, NOT STATED. lib/content.ts publishes these as technical SUPPORT
   * hours; schema.org reads openingHoursSpecification as when the business is
   * open, which is a different claim the site never makes. Nobody has confirmed
   * Crimson's actual office hours.
   *
   * Kept because support hours are the only hours published anywhere and local
   * results surface them, but this is the one property here that is an
   * inference. If the real opening hours differ, correct the values in
   * lib/content.ts or delete this block outright — nothing else depends on it.
   */
  openingHoursSpecification: {
    "@type": "OpeningHoursSpecification",
    dayOfWeek: [...supportHours.days],
    opens: supportHours.opens,
    closes: supportHours.closes,
  },
  hasOfferCatalog: {
    "@type": "OfferCatalog",
    name: "Cybersecurity Services",
    itemListElement: services.map((service) => ({
      "@type": "Offer",
      itemOffered: {
        "@type": "Service",
        name: service.title,
        description: service.summary,
      },
    })),
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en-CA" className={`${display.variable} ${sans.variable}`}>
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
          }}
        />
        {/* Scroll reveals start hidden; without JS, show everything. */}
        <noscript>
          <style>{`[style*="opacity:0"]{opacity:1!important;transform:none!important}`}</style>
        </noscript>

        <Script id="meta-pixel" strategy="afterInteractive">
          {`
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '996967106762716');
            fbq('track', 'PageView');
          `}
        </Script>
        <GoogleAnalytics gaId="G-3QQZXH42SV" />
        <noscript>
          <img
            height="1"
            width="1"
            style={{ display: "none" }}
            src="https://www.facebook.com/tr?id=996967106762716&ev=PageView&noscript=1"
            alt=""
          />
        </noscript>

        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-crimson-500 focus:px-4 focus:py-2 focus:font-display focus:font-semibold focus:text-white"
        >
          Skip to content
        </a>

        <Providers>
          <Header />
          <main id="main">{children}</main>
          <Footer />
          <ChatWidget />
        </Providers>
      </body>
    </html>
  )
}