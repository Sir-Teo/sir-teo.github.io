'use client'

import { useEffect, useRef, useState, type CSSProperties } from 'react'
import type { LinkItem } from '../data/profile'
import dynamic from 'next/dynamic'

const GamePreview = dynamic(() => import('./GamePreview'), {
    loading: () => <div className="preview-loading">Opening the preview…</div>,
})
const StudyPreview = dynamic(() => import('./StudyPreview'), {
    loading: () => <div className="preview-loading">Opening the board…</div>,
})

type Video = NonNullable<NonNullable<LinkItem['preview']>['videos']>[number]

function Arrow() {
    return (
        <svg
            viewBox="0 0 20 20"
            width="16"
            height="16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.4"
            aria-hidden="true"
        >
            <path d="M5 15 15 5M5 5h10v10" />
        </svg>
    )
}

export default function ProjectPreview({
    link,
    onClose,
    onPlayGame,
}: {
    link: LinkItem
    onClose: () => void
    onPlayGame: () => void
}) {
    const preview = link.preview!
    const [reducedMotion, setReducedMotion] = useState(true)
    useEffect(() => {
        const query = window.matchMedia('(prefers-reduced-motion: reduce)')
        const update = () => setReducedMotion(query.matches)
        update()
        query.addEventListener('change', update)
        return () => query.removeEventListener('change', update)
    }, [])

    return (
        <div
            className={`project-preview project-preview-${preview.mode}`}
            style={{ '--preview-accent': link.colorDark ?? link.color } as CSSProperties}
        >
            <header className="preview-header">
                <h3>
                    <span className="preview-title-dot" aria-hidden="true" />
                    {link.label}
                </h3>
                <button
                    type="button"
                    className="preview-close"
                    onClick={onClose}
                    aria-label={`Close ${link.label} preview`}
                >
                    <svg viewBox="0 0 16 16" width="13" height="13" aria-hidden="true">
                        <path d="m4 4 8 8M12 4l-8 8" fill="none" stroke="currentColor" strokeWidth="1.5" />
                    </svg>
                </button>
            </header>
            {preview.mode === 'videos' ? (
                <VideoGallery videos={preview.videos ?? []} reducedMotion={reducedMotion} />
            ) : preview.mode === 'chess' || preview.mode === 'xiangqi' || preview.mode === 'go' ? (
                <StudyPreview scene={preview.mode} />
            ) : (
                <GamePreview key={preview.mode} scene={preview.mode} onPlay={onPlayGame} />
            )}
            <footer className="preview-footer">
                <span>{preview.hint}</span>
                <a href={link.href} target="_blank" rel="noopener noreferrer">
                    {preview.action}
                    <Arrow />
                </a>
            </footer>
        </div>
    )
}

function VideoGallery({ videos, reducedMotion }: { videos: Video[]; reducedMotion: boolean }) {
    const [selected, setSelected] = useState(0)
    const [playIntent, setPlayIntent] = useState<boolean | null>(null)
    const [playing, setPlaying] = useState(false)
    const [mediaError, setMediaError] = useState(false)
    const videoRef = useRef<HTMLVideoElement>(null)
    const video = videos[selected]
    const shouldPlay = playIntent ?? !reducedMotion

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
    if (!video) return null

    return (
        <>
            <div className="preview-film">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={video.image} alt={video.title} width={640} height={360} />
                {!mediaError && (
                    <video
                        key={video.clip}
                        ref={videoRef}
                        src={video.clip}
                        poster={video.image}
                        muted
                        loop
                        playsInline
                        preload="metadata"
                        aria-label={`Silent preview: ${video.title}`}
                        onPlay={() => setPlaying(true)}
                        onPause={() => setPlaying(false)}
                        onError={() => {
                            setMediaError(true)
                            setPlaying(false)
                        }}
                    />
                )}
                <span className="film-badge">SILENT PREVIEW</span>
                {!mediaError && (
                    <button
                        type="button"
                        className="film-playback"
                        onClick={() => setPlayIntent(!playing)}
                        aria-label={playing ? 'Pause preview' : 'Play preview'}
                    >
                        <svg viewBox="0 0 16 16" width="12" height="12" aria-hidden="true" fill="currentColor">
                            {playing ? <path d="M4 3h3v10H4zm5 0h3v10H9z" /> : <path d="m5 2 8 6-8 6Z" />}
                        </svg>
                    </button>
                )}
            </div>
            <ul className="preview-video-list" aria-label="Explainer videos">
                {videos.map((item, index) => (
                    <li key={item.id} data-selected={selected === index}>
                        <button
                            type="button"
                            className="video-preview-choice"
                            aria-label={`Preview ${item.title}`}
                            aria-pressed={selected === index}
                            onPointerEnter={event => {
                                if (event.pointerType !== 'touch') choose(index)
                            }}
                            onFocus={() => choose(index)}
                            onClick={() => choose(index)}
                        >
                            <span className="video-thumbnail">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={item.image} alt="" width={80} height={45} />
                                <span
                                    className="video-playing-indicator"
                                    data-playing={selected === index && playing}
                                    aria-hidden="true"
                                >
                                    <i />
                                    <i />
                                    <i />
                                </span>
                            </span>
                            <span className="video-row-text">
                                <strong>{item.title}</strong>
                                <span>{item.topic}</span>
                            </span>
                        </button>
                        <a
                            href={`https://www.youtube.com/watch?v=${item.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="video-watch"
                            aria-label={`Watch ${item.title} on YouTube`}
                        >
                            <Arrow />
                        </a>
                    </li>
                ))}
            </ul>
        </>
    )
}
