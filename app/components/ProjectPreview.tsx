import Image from 'next/image'
import type { CSSProperties } from 'react'
import type { LinkItem } from '../data/profile'

export default function ProjectPreview({ link, onClose }: { link: LinkItem; onClose: () => void }) {
    const preview = link.preview
    if (!preview || !link.href) return null

    return (
        <div
            className="project-preview relative isolate overflow-hidden rounded-2xl bg-white text-left shadow-2xl ring-1 ring-slate-900/10 dark:bg-slate-900 dark:ring-white/15"
            style={{ '--preview-accent': link.colorDark ?? link.color } as CSSProperties}
        >
            <a
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${preview.action} — ${link.label} (opens in a new tab)`}
                className="group/preview block outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-sky-400"
            >
                <div className="project-preview-image relative overflow-hidden bg-slate-950">
                    <Image
                        src={preview.image}
                        alt={preview.alt}
                        width={840}
                        height={525}
                        unoptimized
                        loading="eager"
                        className="h-full w-full object-contain transition-transform duration-500 motion-safe:group-hover/preview:scale-[1.025]"
                    />
                    {preview.status && (
                        <span className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-slate-950/85 px-2.5 py-1 text-[10px] font-medium tracking-wide text-amber-200 ring-1 ring-white/15 backdrop-blur-md">
                            <span aria-hidden className="h-1 w-1 rounded-full bg-amber-300" />
                            {preview.status}
                        </span>
                    )}
                </div>
                <div className="project-preview-copy px-5 pb-4 pt-4">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
                        {preview.kind}
                    </p>
                    <div className="mt-1 flex items-center justify-between gap-3">
                        <h3 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-white">
                            {link.label}
                        </h3>
                        <span
                            aria-hidden
                            className="project-preview-icon flex h-8 w-8 shrink-0 items-center justify-center rounded-xl"
                        >
                            <span
                                className="link-icon h-4 w-4"
                                style={
                                    {
                                        '--ic': link.color,
                                        '--icd': link.colorDark,
                                        mask: `url(${link.icon}) center / contain no-repeat`,
                                        WebkitMask: `url(${link.icon}) center / contain no-repeat`,
                                    } as CSSProperties
                                }
                            />
                        </span>
                    </div>
                    <p className="mt-2 text-[13px] leading-[1.65] text-slate-600 dark:text-slate-300">
                        {link.description}
                    </p>
                    <ul
                        aria-label="Project features"
                        className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-[11px] font-medium text-slate-500 dark:text-slate-400"
                    >
                        {link.tags?.map(tag => (
                            <li key={tag} className="inline-flex items-center gap-1.5">
                                <span aria-hidden className="project-preview-dot h-1 w-1 rounded-full" />
                                {tag}
                            </li>
                        ))}
                    </ul>
                </div>
                <div className="flex items-center justify-between gap-3 border-t border-slate-100 bg-slate-50/80 px-5 py-3 dark:border-white/[0.07] dark:bg-white/[0.025]">
                    <span className="text-xs font-semibold text-slate-900 dark:text-slate-100">{preview.action}</span>
                    <svg
                        aria-hidden
                        viewBox="0 0 20 20"
                        fill="none"
                        className="h-4 w-4 text-slate-500 transition-transform motion-safe:group-hover/preview:-translate-y-0.5 motion-safe:group-hover/preview:translate-x-0.5 dark:text-slate-400"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <path d="M5 15 15 5M5 5h10v10" />
                    </svg>
                </div>
            </a>
            <button
                type="button"
                onClick={onClose}
                aria-label={`Close ${link.label} preview`}
                className="absolute right-2.5 top-2.5 flex h-7 w-7 items-center justify-center rounded-full bg-slate-950/70 text-white shadow-sm ring-1 ring-white/20 backdrop-blur transition hover:bg-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
            >
                <svg
                    aria-hidden
                    viewBox="0 0 16 16"
                    className="h-3.5 w-3.5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                >
                    <path d="m4 4 8 8M12 4l-8 8" />
                </svg>
            </button>
        </div>
    )
}
