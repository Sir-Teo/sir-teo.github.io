'use client'

import { useEffect, useRef, useState, type CSSProperties } from 'react'
import type { LinkItem } from '../data/profile'

export default function ProjectPreview({ link, onClose }: { link: LinkItem; onClose: () => void }) {
    const preview = link.preview!
    const [selected, setSelected] = useState(0)
    const [reducedMotion, setReducedMotion] = useState(true)
    const [playIntent, setPlayIntent] = useState<boolean | null>(null)
    const [playing, setPlaying] = useState(false)
    const [mediaError, setMediaError] = useState(false)
    const videoRef = useRef<HTMLVideoElement>(null)
    const detail = preview.details?.[selected]
    const video = preview.videos?.[selected]
    const shouldPlay = playIntent ?? !reducedMotion

    useEffect(() => {
        const query = window.matchMedia('(prefers-reduced-motion: reduce)')
        const update = () => setReducedMotion(query.matches)
        update()
        query.addEventListener('change', update)
        return () => query.removeEventListener('change', update)
    }, [])

    useEffect(() => {
        const element = videoRef.current
        if (!element) return
        const update = () => {
            if (shouldPlay && !document.hidden) void element.play().catch(() => setPlaying(false))
            else element.pause()
        }
        update()
        document.addEventListener('visibilitychange', update)
        return () => {
            element.pause()
            document.removeEventListener('visibilitychange', update)
        }
    }, [video?.clip, shouldPlay])

    const choose = (index: number) => {
        if (selected === index) return
        setSelected(index)
        setMediaError(false)
    }
    const items = preview.videos?.map(item => item.topic) ?? preview.details?.map(item => item.label) ?? []
    const destination = video ? `https://www.youtube.com/watch?v=${video.id}&t=${video.start}s` : link.href

    return (
        <div className="project-preview" style={{ '--preview-accent': link.colorDark ?? link.color } as CSSProperties}>
            <header className="preview-header">
                <div>
                    <h3>{link.label}</h3>
                    <p>{preview.kind}</p>
                </div>
                <button
                    type="button"
                    className="preview-close"
                    onClick={onClose}
                    aria-label={`Close ${link.label} preview`}
                >
                    <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
                        <path d="m4 4 8 8M12 4l-8 8" fill="none" stroke="currentColor" strokeWidth="1.5" />
                    </svg>
                </button>
            </header>
            <div className={`preview-stage preview-stage-${preview.mode}`}>
                {/* These are captures of the real projects. Only the selected clip loads. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    className="preview-image"
                    src={video?.image ?? detail?.image ?? preview.image}
                    alt={video ? video.title : detail?.image ? `${link.label}: ${detail.title}` : preview.alt}
                    width={840}
                    height={525}
                    style={
                        preview.mode === 'lenses'
                            ? {
                                  transform: `scale(${detail?.scale ?? 1})`,
                                  transformOrigin: `${detail?.x ?? 50}% ${detail?.y ?? 50}%`,
                              }
                            : undefined
                    }
                />
                {video && !mediaError && (
                    <video
                        key={video.clip}
                        ref={videoRef}
                        src={video.clip}
                        poster={video.image}
                        muted
                        loop
                        playsInline
                        preload="metadata"
                        aria-label={`Silent excerpt: ${video.title}`}
                        onPlay={() => setPlaying(true)}
                        onPause={() => setPlaying(false)}
                        onError={() => {
                            setMediaError(true)
                            setPlaying(false)
                        }}
                    />
                )}
                {video && !mediaError && (
                    <button
                        type="button"
                        className="preview-playback"
                        onClick={() => setPlayIntent(!playing)}
                        aria-label={playing ? 'Pause excerpt' : 'Play excerpt'}
                    >
                        <span aria-hidden="true">{playing ? 'Ⅱ' : '▶'}</span>
                        {playing ? 'Pause' : 'Play'}
                    </button>
                )}
                {preview.mode === 'hotspots' &&
                    preview.details?.map((point, index) => (
                        <button
                            key={point.label}
                            type="button"
                            className="preview-hotspot"
                            style={{ left: `${point.x}%`, top: `${point.y}%` }}
                            aria-label={`Explore ${point.label.toLowerCase()}`}
                            aria-pressed={selected === index}
                            onPointerEnter={() => choose(index)}
                            onFocus={() => choose(index)}
                            onClick={() => choose(index)}
                        >
                            <span aria-hidden="true">{index + 1}</span>
                        </button>
                    ))}
                {preview.mode === 'abilities' && (
                    <span className="preview-scene-label">
                        Ashe <span>the Frost Archer</span>
                    </span>
                )}
                {preview.mode === 'lenses' && (
                    <span className="preview-lens-label" aria-hidden="true">
                        ⌕ {detail?.label}
                    </span>
                )}
            </div>
            <div className="preview-content">
                <div className="preview-controls-heading">
                    <span>{preview.hint}</span>
                    <span className="preview-counter" aria-hidden="true">
                        {String(selected + 1).padStart(2, '0')} / {String(items.length).padStart(2, '0')}
                    </span>
                </div>
                <div
                    className={`preview-choices ${preview.mode === 'abilities' ? 'preview-keys' : ''}`}
                    role="group"
                    aria-label={preview.hint}
                >
                    {items.map((label, index) => (
                        <button
                            key={label}
                            type="button"
                            aria-pressed={selected === index}
                            onPointerEnter={() => choose(index)}
                            onFocus={() => choose(index)}
                            onClick={() => choose(index)}
                        >
                            {label}
                        </button>
                    ))}
                </div>
                <div className="preview-caption" aria-live="polite" aria-atomic="true">
                    <h4>{video?.title ?? detail?.title}</h4>
                    <p>{video?.caption ?? detail?.caption}</p>
                </div>
            </div>
            <footer className="preview-footer">
                <span>
                    {video
                        ? 'From my explainers'
                        : preview.mode === 'lenses'
                        ? 'A look inside the app'
                        : 'Made for the browser'}
                </span>
                <a href={destination} target="_blank" rel="noopener noreferrer">
                    {preview.action}
                    <span aria-hidden="true"> ↗</span>
                </a>
            </footer>
        </div>
    )
}
