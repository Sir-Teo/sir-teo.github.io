import { profile, links } from './data/profile'
import Links from './components/Links'
import Image from 'next/image'

// schema.org Person, derived from the same link data the page renders, so the
// structured description can never drift from what is on screen. Invisible to
// readers; it is what lets search engines tie all these profiles to one person.
function personJsonLd() {
    const email = links.find(l => l.href?.startsWith('mailto:'))?.href?.slice('mailto:'.length)
    return {
        '@context': 'https://schema.org',
        '@type': 'Person',
        name: profile.name,
        url: profile.url,
        image: `${profile.url}${profile.avatar}`,
        description: profile.description,
        jobTitle: profile.jobTitle,
        homeLocation: { '@type': 'Place', name: profile.location },
        ...(email ? { email } : {}),
        sameAs: links.filter(l => l.href?.startsWith('http')).map(l => l.href),
    }
}

// The underlined inline link used by the project rows. No-wrap keeps a
// two-word name like "Web Xiangqi" from splitting across lines on a phone.
function TextLink({ href, children }: { href: string; children: React.ReactNode }) {
    return (
        <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="whitespace-nowrap font-medium text-slate-700 underline decoration-slate-300 underline-offset-2 transition hover:decoration-slate-500 dark:text-slate-200 dark:decoration-slate-600 dark:hover:decoration-slate-400"
        >
            {children}
        </a>
    )
}

export default function Home() {
    return (
        <main className="mx-auto max-w-2xl px-5 py-8 sm:px-6 sm:py-10 lg:max-w-3xl lg:py-12">
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd()) }} />
            <header className="flex flex-row items-center gap-4 sm:gap-5">
                <span className="avatar-ring shrink-0">
                    <Image
                        src={profile.avatar}
                        alt={`${profile.name} avatar`}
                        title={profile.avatarCredit}
                        width={96}
                        height={96}
                        priority
                        unoptimized
                        className="h-16 w-16 shrink-0 rounded-full object-cover ring-1 ring-slate-200 dark:ring-slate-700 sm:h-24 sm:w-24"
                    />
                </span>
                <div>
                    <h1 className="site-name text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100 sm:text-3xl">
                        {profile.name}
                    </h1>
                    <p className="mt-1.5 max-w-md text-[14px] leading-snug text-slate-500 dark:text-slate-400 sm:mt-2 sm:text-[15px] sm:leading-relaxed">
                        {profile.tagline}
                    </p>
                </div>
            </header>

            <section className="mt-6 sm:mt-7">
                <Links />
            </section>

            <section
                aria-labelledby="projects-heading"
                className="mt-6 border-t border-slate-100 pt-5 dark:border-slate-800"
            >
                <h2
                    id="projects-heading"
                    className="mb-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400"
                >
                    Made by me
                </h2>
                <a
                    href="https://www.youtube.com/@teozeng3999/videos"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-center gap-3 rounded-xl bg-slate-50 p-3 transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 dark:bg-slate-900 dark:hover:bg-slate-800"
                >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400">
                        <svg viewBox="0 0 24 24" aria-hidden className="h-5 w-5" fill="currentColor">
                            <path d="M9 5.5a1 1 0 0 0-1.5.87v11.26A1 1 0 0 0 9 18.5l9.75-5.63a1 1 0 0 0 0-1.74Z" />
                        </svg>
                    </span>
                    <span className="min-w-0 flex-1">
                        <span className="block text-sm font-medium text-slate-800 dark:text-slate-100">
                            Explainer videos
                        </span>
                        <span className="mt-0.5 block text-xs text-slate-500 dark:text-slate-400">
                            Math, physics &amp; machine learning, animated.
                        </span>
                    </span>
                    <span className="shrink-0 text-xs text-slate-500 transition group-hover:text-red-600 dark:text-slate-400 dark:group-hover:text-red-400">
                        YouTube <span aria-hidden>↗</span>
                    </span>
                </a>
                <dl className="mt-3 space-y-2.5 text-[13px] leading-relaxed sm:text-sm">
                    <div className="sm:grid sm:grid-cols-[7rem_1fr] sm:gap-3">
                        <dt className="text-xs text-slate-500 dark:text-slate-400 sm:pt-0.5">Browser games</dt>
                        <dd className="flex flex-wrap gap-x-3 gap-y-1">
                            <TextLink href="https://coc.teozeng.dev/">Crown &amp; Clan</TextLink>
                            <TextLink href="https://teozeng.dev/web-lol/">Summoner&apos;s Rift</TextLink>
                            <TextLink href="https://teozeng.dev/web-gta/">San Andreas</TextLink>
                        </dd>
                    </div>
                    <div className="sm:grid sm:grid-cols-[7rem_1fr] sm:gap-3">
                        <dt className="text-xs text-slate-500 dark:text-slate-400 sm:pt-0.5">Board games</dt>
                        <dd className="flex flex-wrap gap-x-3 gap-y-1">
                            <TextLink href="https://teozeng.dev/web-chess/">Chess</TextLink>
                            <TextLink href="https://teozeng.dev/web-xiangqi/">Xiangqi</TextLink>
                            <TextLink href="https://teozeng.dev/web-katrain/">KaTrain</TextLink>
                        </dd>
                    </div>
                </dl>
            </section>
        </main>
    )
}
