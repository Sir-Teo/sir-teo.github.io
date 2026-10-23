'use client'

import { useEffect, useRef, useState } from 'react'

export default function PreviewFilm({
    clip,
    image,
    title,
    reducedMotion,
    height = 360,
}: {
    clip: string
    image: string
    title: string
    reducedMotion: boolean
    height?: number
}) {
    const [playIntent, setPlayIntent] = useState<boolean | null>(null)
    const [playingClip, setPlayingClip] = useState<string | null>(null)
    const [readyClip, setReadyClip] = useState<string | null>(null)
    const [failedClip, setFailedClip] = useState<string | null>(null)
    const videoRef = useRef<HTMLVideoElement>(null)
    const progressRef = useRef<HTMLSpanElement>(null)
    const playing = playingClip === clip
    const mediaError = failedClip === clip
    const shouldPlay = playIntent ?? !reducedMotion

    useEffect(() => {
        const element = videoRef.current
        if (!element) return
        let active = true
        const update = () => {
            if (shouldPlay && !document.hidden) {
                void element.play().catch(() => {
                    if (active) setPlayingClip(null)
                })
            } else element.pause()
        }
        update()
        document.addEventListener('visibilitychange', update)
        return () => {
            active = false
            element.pause()
            document.removeEventListener('visibilitychange', update)
        }
    }, [clip, shouldPlay])

    return (
        <div className="preview-film">
            {/* The poster stays visible while a newly selected clip prepares its first frame. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={image} alt={mediaError ? title : ''} width={640} height={height} decoding="async" />
            {!mediaError && (
                <video
                    ref={videoRef}
                    src={clip}
                    poster={image}
                    muted
                    loop
                    playsInline
                    preload="none"
                    data-ready={readyClip === clip}
                    aria-label={`Silent preview: ${title}`}
                    onLoadedData={() => setReadyClip(clip)}
                    onPlay={() => setPlayingClip(clip)}
                    onPlaying={() => {
                        setReadyClip(clip)
                        setPlayingClip(clip)
                    }}
                    onPause={() => setPlayingClip(null)}
                    onTimeUpdate={event => {
                        const { currentTime, duration } = event.currentTarget
                        const progress =
                            Number.isFinite(duration) && duration > 0 ? Math.min(1, currentTime / duration) : 0
                        if (progressRef.current) progressRef.current.style.transform = `scaleX(${progress})`
                    }}
                    onError={() => {
                        setFailedClip(clip)
                        setPlayingClip(null)
                    }}
                />
            )}
            {mediaError && <span className="film-badge">Preview image</span>}
            {!mediaError && (
                <>
                    <button
                        type="button"
                        className="film-playback"
                        onClick={() => {
                            setPlayIntent(!playing)
                            if (playing) videoRef.current?.pause()
                            // Play directly in the gesture as well, so a blocked autoplay can be retried.
                            else void videoRef.current?.play().catch(() => setPlayingClip(null))
                        }}
                        aria-label={playing ? 'Pause preview' : 'Play preview'}
                        title={playing ? 'Pause preview' : 'Play preview'}
                    >
                        <svg viewBox="0 0 16 16" width="13" height="13" aria-hidden="true" fill="currentColor">
                            {playing ? <path d="M4 3h3v10H4zm5 0h3v10H9z" /> : <path d="m5 2 8 6-8 6Z" />}
                        </svg>
                    </button>
                    <div className="film-progress" aria-hidden="true">
                        <span key={clip} ref={progressRef} style={{ transform: 'scaleX(0)' }} />
                    </div>
                </>
            )}
        </div>
    )
}
