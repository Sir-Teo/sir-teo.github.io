'use client'

import { useEffect, useRef, useState } from 'react'

export default function PreviewFilm({
    clip,
    image,
    title,
    reducedMotion,
    onPlayingChange,
}: {
    clip: string
    image: string
    title: string
    reducedMotion: boolean
    onPlayingChange?: (playing: boolean) => void
}) {
    const [playIntent, setPlayIntent] = useState<boolean | null>(null)
    const [playing, setPlaying] = useState(false)
    const [mediaError, setMediaError] = useState(false)
    const videoRef = useRef<HTMLVideoElement>(null)
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
    }, [clip, shouldPlay])

    useEffect(() => onPlayingChange?.(playing), [playing, onPlayingChange])

    return (
        <div className="preview-film">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={image} alt={title} width={640} height={360} />
            {!mediaError && (
                <video
                    ref={videoRef}
                    src={clip}
                    poster={image}
                    muted
                    loop
                    playsInline
                    preload="none"
                    aria-label={`Silent preview: ${title}`}
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
    )
}
