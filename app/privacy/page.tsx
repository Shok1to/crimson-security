import type { Metadata } from 'next';
import Link from 'next/link';
import LeafDivider from '@/components/LeafDivider';
import { addressCityLine, site } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description:
    'How Crimson Security collects, uses and protects personal information submitted through this website.',
  alternates: { canonical: '/privacy' },
};

/*
 * DRAFT policy text. It describes only what this site actually does today: a contact form,
 * a chat assistant powered by Anthropic's Claude, transactional email through Resend, and no
 * advertising or tracking cookies. Every one of those processors is outside Canada, which the
 * "Who we share it with" section discloses. Have counsel review it, and update it if you add
 * analytics, a CRM, or any other processing.
 */
const LAST_UPDATED = 'September 28, 2026';

const h2 = 'mt-12 font-display text-2xl font-bold text-silver-50';
const p = 'mt-4 leading-relaxed text-silver-300';
const li = 'leading-relaxed text-silver-300';

export default function PrivacyPage() {
  return (
    <div className="theme-light bg-ink-900">
      <article className="mx-auto max-w-3xl px-5 pb-24 pt-36 sm:px-8">
        <p className="section-label">Legal</p>
        <h1 className="mt-4 font-display text-4xl font-bold tracking-tight text-silver-50 sm:text-5xl">
          Privacy Policy
        </h1>
        <p className="mt-4 text-sm text-silver-500">Last updated: {LAST_UPDATED}</p>
        <LeafDivider className="mt-8" />

        <p className={p}>
          Crimson Security (&ldquo;Crimson Security&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;) respects your
          privacy. This policy explains what personal information we collect through this website, how we use
          it, and the choices you have. We handle personal information in accordance with Canada&apos;s{' '}
          <em>Personal Information Protection and Electronic Documents Act</em> (PIPEDA) and applicable
          provincial privacy law.
        </p>

        <h2 className={h2}>Information we collect</h2>
        <ul className="mt-4 list-disc space-y-2 pl-6 marker:text-crimson-400">
          <li className={li}>
            <strong className="text-silver-100">Information you give us.</strong> When you use our contact
            form we collect your name, email address, and message, along with your company, phone number and
            the service you&apos;re interested in if you choose to provide them.
          </li>
          <li className={li}>
            <strong className="text-silver-100">Technical information.</strong> Like most websites, our
            hosting provider may automatically record technical data such as IP address, browser type, and
            pages requested in standard server logs.
          </li>
          <li className={li}>
            <strong className="text-silver-100">Chat assistant.</strong> If you use the assistant on
            this site, we process the messages you send it, along with any name, email address or
            company you choose to give it.
          </li>
        </ul>
        <p className={p}>This website does not use advertising or cross-site tracking cookies.</p>

        <h2 className={h2}>How we use it</h2>
        <p className={p}>
          We use the information you send us to respond to your enquiry and to discuss potential services with
          you. Technical logs are used to keep the site secure and working properly. We do not sell your
          personal information.
        </p>

        <h2 className={h2}>Who we share it with</h2>
        <p className={p}>
          We share personal information only with service providers who help us operate this website and
          handle enquiries (for example, website hosting, email delivery, and the provider behind our chat
          assistant), and only as needed for those purposes. We may also disclose information where required
          by law.
        </p>
        <p className={p}>
          These service providers are located outside Canada &mdash; primarily in the United States. Personal
          information processed or stored there is subject to the laws of that country, and may be accessible
          to its courts, law enforcement, and government authorities under those laws. By sending us an
          enquiry or using the chat assistant, you consent to your information being handled this way.
        </p>

        <h2 className={h2}>Chat assistant</h2>
        <p className={p}>
          The assistant on this site is powered by Anthropic&apos;s Claude. Messages you send are
          transmitted to Anthropic as our service provider solely to generate a reply, and are not
          used to train their models. We do not store conversations on our servers; a conversation
          exists only in your browser while it is open.
        </p>
        <p className={p}>
          If you give the assistant your contact details, they are emailed to us together with the
          conversation, exactly as a contact-form submission would be, and are handled the same way.
          You never have to use the assistant &mdash; the{' '}
          <Link
            href="/#contact"
            className="text-crimson-300 underline underline-offset-4 hover:text-silver-50"
          >
            contact form
          </Link>{' '}
          does the same job.
        </p>

        <h2 className={h2}>Retention and safeguards</h2>
        <p className={p}>
          We keep enquiry information only as long as needed to respond and to maintain our business records,
          and we use reasonable administrative and technical safeguards to protect it.
        </p>

        <h2 className={h2}>Your rights</h2>
        <p className={p}>
          You may ask to access the personal information we hold about you, ask us to correct it, or withdraw
          your consent to our use of it, subject to legal and contractual restrictions. To make a request,
          email{' '}
          <a
            href={`mailto:${site.emails.info}`}
            className="text-crimson-300 underline underline-offset-4 hover:text-silver-50"
          >
            {site.emails.info}
          </a>{' '}
          or use the{' '}
          <Link
            href="/#contact"
            className="text-crimson-300 underline underline-offset-4 hover:text-silver-50"
          >
            contact form
          </Link>
          . If you are not satisfied with our response, you can contact the{' '}
          <a
            href="https://www.priv.gc.ca"
            target="_blank"
            rel="noopener noreferrer"
            className="text-crimson-300 underline underline-offset-4 hover:text-silver-50"
          >
            Office of the Privacy Commissioner of Canada
          </a>
          .
        </p>

        <h2 className={h2}>Contact us</h2>
        <address className={`${p} not-italic`}>
          {site.name}
          <br />
          {site.address.street}
          <br />
          {addressCityLine}
          <br />
          <a
            href={site.phone.href}
            className="text-crimson-300 underline underline-offset-4 hover:text-silver-50"
          >
            {site.phone.display}
          </a>
          {' · '}
          <a
            href={`mailto:${site.emails.info}`}
            className="text-crimson-300 underline underline-offset-4 hover:text-silver-50"
          >
            {site.emails.info}
          </a>
        </address>

        <h2 className={h2}>Changes to this policy</h2>
        <p className={p}>
          We may update this policy from time to time. The &ldquo;Last updated&rdquo; date above shows when it
          was last changed.
        </p>
      </article>
    </div>
  );
}
