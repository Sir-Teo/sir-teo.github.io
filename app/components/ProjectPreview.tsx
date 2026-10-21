import dynamic from 'next/dynamic'
import { useState, type CSSProperties } from 'react'
import type { LinkItem } from '../data/profile'

// Load the demos only when someone opens a project.
const ProjectDemo = dynamic(() => import('./projectDemos'), {
    ssr: false,
    loading: () => (
        <div className="mini-loading" role="status">
            Opening the playground…
        </div>
    ),
})

export default function ProjectPreview({
    link,
    onClose,
    onInteract,
}: {
    link: LinkItem
    onClose: () => void
    onInteract: () => void
}) {
    const [round, setRound] = useState(0)
    const preview = link.preview
    if (!preview || !link.href) return null
    return (
        <div
            className="project-preview relative isolate rounded-2xl bg-white text-left shadow-2xl ring-1 ring-slate-900/10 dark:bg-slate-900 dark:ring-white/15"
            style={{ '--preview-accent': link.colorDark ?? link.color } as CSSProperties}
        >
            <div className="mini-window-bar">
                <span
                    aria-hidden
                    className="link-icon h-3.5 w-3.5"
                    style={
                        {
                            '--ic': link.color,
                            '--icd': link.colorDark,
                            mask: `url(${link.icon}) center / contain no-repeat`,
                            WebkitMask: `url(${link.icon}) center / contain no-repeat`,
                        } as CSSProperties
                    }
                />
                <h3>{link.label}</h3>
                <span className="mini-window-tag">mini playground</span>
                <button
                    type="button"
                    className="mini-close"
                    onClick={onClose}
                    aria-label={`Close ${link.label} preview`}
                >
                    ×
                </button>
            </div>
            <div onPointerDownCapture={onInteract} onKeyDownCapture={onInteract}>
                <ProjectDemo id={preview.demo} key={round} />
                <div className="mini-window-footer">
                    <button
                        type="button"
                        className="mini-reset"
                        onClick={() => setRound(r => r + 1)}
                        aria-label={`Reset ${link.label} playground`}
                    >
                        <span aria-hidden>↻</span> Reset
                    </button>
                    <a
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`${preview.action} — ${link.label} (opens in a new tab)`}
                    >
                        {preview.demo === 'fourier' ? 'Watch on YouTube' : 'Open full project'}{' '}
                        <span aria-hidden>↗</span>
                    </a>
                </div>
            </div>
        </div>
    )
}
