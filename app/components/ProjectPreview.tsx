import { useEffect, useRef, useState, type CSSProperties } from 'react'
import type { LinkItem } from '../data/profile'

export type ProjectWindowSize = 'peek' | 'open' | 'wide'

export default function ProjectPreview({
    link,
    size,
    onSizeChange,
    onClose,
    onInteract,
}: {
    link: LinkItem
    size: ProjectWindowSize
    onSizeChange: (size: ProjectWindowSize) => void
    onClose: () => void
    onInteract: () => void
}) {
    const [running, setRunning] = useState(false)
    const [loading, setLoading] = useState(false)
    const [slowLoad, setSlowLoad] = useState(false)
    const [canIsolate, setCanIsolate] = useState(false)
    const [videoIndex, setVideoIndex] = useState(0)
    const launchRef = useRef<HTMLButtonElement>(null)
    const preview = link.preview

    useEffect(() => {
        setCanIsolate('credentialless' in HTMLIFrameElement.prototype)
    }, [])

    useEffect(() => {
        if (!loading) return
        const timer = window.setTimeout(() => setSlowLoad(true), 15000)
        return () => window.clearTimeout(timer)
    }, [loading])

    if (!preview || !link.href) return null
    const video = preview.videos?.[videoIndex]
    const source = video
        ? `https://www.youtube-nocookie.com/embed/${video.id}?autoplay=1&playsinline=1&rel=0`
        : preview.embedUrl
    const canEmbed = Boolean(source && (video || canIsolate))
    const fullUrl = video ? `https://www.youtube.com/watch?v=${video.id}` : link.href
    const launch = () => {
        onInteract()
        setLoading(true)
        setSlowLoad(false)
        setRunning(true)
        onSizeChange('open')
    }
    const back = () => {
        setRunning(false)
        setLoading(false)
        setSlowLoad(false)
        onSizeChange('peek')
        window.requestAnimationFrame(() => launchRef.current?.focus({ preventScroll: true }))
    }
    const selectVideo = (index: number) => {
        onInteract()
        setVideoIndex(index)
        if (running) {
            setLoading(true)
            setSlowLoad(false)
        }
    }

    return (
        <div
            className="project-preview relative isolate rounded-2xl bg-white text-left shadow-2xl ring-1 ring-slate-900/10 dark:bg-slate-900 dark:ring-white/15"
            data-size={size}
            style={{ '--preview-accent': link.colorDark ?? link.color } as CSSProperties}
            onPointerDownCapture={onInteract}
            onKeyDownCapture={onInteract}
        >
            <div className="project-window-bar">
                <span
                    aria-hidden
                    className="link-icon h-3.5 w-3.5 shrink-0"
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
                {running ? (
                    <button
                        type="button"
                        className="project-window-control"
                        onClick={() => onSizeChange(size === 'wide' ? 'open' : 'wide')}
                        aria-label={`${size === 'wide' ? 'Compact' : 'Expand'} ${link.label} window`}
                    >
                        <span aria-hidden>{size === 'wide' ? '↙' : '↗'}</span>
                        <span>{size === 'wide' ? 'Compact' : 'Expand'}</span>
                    </button>
                ) : (
                    <span className="project-window-kind">{preview.kind}</span>
                )}
                <button
                    type="button"
                    className="project-window-close"
                    onClick={onClose}
                    aria-label={`Close ${link.label} preview`}
                >
                    ×
                </button>
            </div>
            {running && source ? (
                <div className={`project-frame-stage ${video ? 'project-frame-video' : ''}`}>
                    <iframe
                        key={source}
                        src={source}
                        title={video ? video.title : `${link.label} — interactive preview`}
                        // Set at creation, before navigation. Unsupported browsers use the
                        // full-project link instead so previews never share saved-game storage.
                        {...{ credentialless: true }}
                        sandbox="allow-scripts allow-same-origin allow-pointer-lock allow-forms"
                        allow="autoplay; fullscreen; gamepad; encrypted-media; picture-in-picture"
                        allowFullScreen
                        referrerPolicy="strict-origin-when-cross-origin"
                        onLoad={() => setLoading(false)}
                    />
                    {loading && (
                        <div className="project-frame-loading" role="status">
                            <span className="project-loading-dot" aria-hidden />
                            {slowLoad
                                ? 'Still loading. You can also open the full project below.'
                                : `Opening ${link.label}…`}
                        </div>
                    )}
                </div>
            ) : (
                <div className={`project-cover ${video ? 'project-cover-video' : ''}`}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src={video?.image ?? preview.image}
                        alt={video?.title ?? preview.alt}
                        width={840}
                        height={525}
                    />
                    <div className="project-cover-action">
                        {canEmbed ? (
                            <button ref={launchRef} type="button" className="project-launch" onClick={launch}>
                                <span aria-hidden>{video ? '▶' : '↗'}</span>
                                {preview.launchLabel}
                            </button>
                        ) : (
                            <a className="project-launch" href={fullUrl} target="_blank" rel="noopener noreferrer">
                                Open project <span aria-hidden>↗</span>
                            </a>
                        )}
                    </div>
                </div>
            )}
            {preview.videos && video && (
                <div className="project-video-picker">
                    <div className="project-video-title">
                        <span>{String(videoIndex + 1).padStart(2, '0')}</span>
                        <p>{video.title}</p>
                    </div>
                    <div className="project-video-options" aria-label="Choose an explainer video">
                        {preview.videos.map((item, index) => (
                            <button
                                key={item.id}
                                type="button"
                                aria-label={`Select ${item.title}`}
                                aria-pressed={index === videoIndex}
                                onClick={() => selectVideo(index)}
                            >
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={item.image} alt="" width={160} height={90} />
                            </button>
                        ))}
                    </div>
                </div>
            )}
            <div className="project-window-footer">
                {running ? (
                    <button type="button" onClick={back}>
                        <span aria-hidden>←</span> Back to preview
                    </button>
                ) : (
                    <span>{video ? 'Visual explainers' : canEmbed ? 'Try it here' : 'Opens in a new tab'}</span>
                )}
                <a href={fullUrl} target="_blank" rel="noopener noreferrer">
                    {video ? 'Watch on YouTube' : 'Open full project'} <span aria-hidden>↗</span>
                </a>
            </div>
        </div>
    )
}
