import Link from 'next/link';

/** Breadcrumb, title and intro shared by the Resources pages. */
export default function ResourcesHeader({
  title,
  intro,
  section,
}: {
  title: string;
  intro: string;
  /** Set on pages below /resources to add the Resources breadcrumb step. */
  section?: boolean;
}) {
  return (
    <header className="mx-auto max-w-7xl px-5 pb-10 pt-36 sm:px-8">
      <nav aria-label="Breadcrumb" className="text-base text-silver-400">
        <Link href="/" className="transition-colors hover:text-silver-50">
          Home
        </Link>
        <span aria-hidden="true" className="mx-2.5">
          ›
        </span>
        {section ? (
          <>
            <Link href="/resources" className="transition-colors hover:text-silver-50">
              Resources
            </Link>
            <span aria-hidden="true" className="mx-2.5">
              ›
            </span>
          </>
        ) : null}
        <span aria-current="page" className="font-medium text-silver-100">
          {title}
        </span>
      </nav>
      <h1 className="mt-6 font-display text-4xl font-bold tracking-tight text-silver-50 sm:text-5xl lg:text-6xl">
        {title}
      </h1>
      <p className="mt-4 max-w-2xl text-base text-silver-300 sm:text-lg">{intro}</p>
    </header>
  );
}
