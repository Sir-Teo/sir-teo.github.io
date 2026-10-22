'use client'

import { useEffect, useRef, useState, type CSSProperties } from 'react'
import type { LinkItem } from '../data/profile'
import dynamic from 'next/dynamic'
import PreviewFilm from './PreviewFilm'
import { ExternalArrow, PreviewClose, PreviewLink } from './PreviewControls'

const GamePreview = dynamic(() => import('./GamePreview'), {
    loading: () => (
        <div className="film-loading" role="status">
            <span className="sr-only">Loading preview</span>
        </div>
    ),
})

const ReviewPreview = dynamic(() => import('./ReviewPreview'), {
    loading: () => (
        <div className="preview-loading review-loading" role="status">
            <span className="sr-only">Loading game</span>
        </div>
    ),
})

type Video = NonNullable<NonNullable<LinkItem['preview']>['videos']>[number]

export default function ProjectPreview({ link, onClose }: { link: LinkItem; onClose: () => void }) {
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
            style={
                {
                    '--preview-accent-light': link.color,
                    '--preview-accent-dark': link.colorDark ?? link.color,
                } as CSSProperties
            }
        >
            <header className="preview-header">
                <h3>
                    <span className="preview-title-dot" aria-hidden="true" />
                    {link.label}
                </h3>
                <div className="preview-actions">
                    {link.href && <PreviewLink href={link.href} label={`Open ${link.label}`} />}
                    <PreviewClose onClose={onClose} label={`Close ${link.label} preview`} />
                </div>
            </header>
            {preview.mode === 'videos' ? (
                <VideoGallery videos={preview.videos ?? []} reducedMotion={reducedMotion} />
            ) : preview.mode === 'chess' || preview.mode === 'xiangqi' || preview.mode === 'go' ? (
                <ReviewPreview key={preview.mode} scene={preview.mode} />
            ) : (
                <GamePreview key={preview.mode} scene={preview.mode} reducedMotion={reducedMotion} />
            )}
        </div>
    )
}

function VideoGallery({ videos, reducedMotion }: { videos: Video[]; reducedMotion: boolean }) {
    const [selected, setSelected] = useState(0)
    const hoverTimer = useRef<number | null>(null)
    const cancelHover = () => {
        if (hoverTimer.current !== null) window.clearTimeout(hoverTimer.current)
        hoverTimer.current = null
    }
    const video = videos[selected]
    const choose = (index: number) => {
        cancelHover()
        setSelected(index)
    }
    useEffect(
        () => () => {
            if (hoverTimer.current !== null) window.clearTimeout(hoverTimer.current)
        },
        []
    )
    if (!video) return null

    return (
        <div className="preview-video-gallery">
            <PreviewFilm clip={video.clip} image={video.image} title={video.title} reducedMotion={reducedMotion} />
            <ul className="preview-video-list" aria-label="Explainer videos">
                {videos.map((item, index) => (
                    <li key={item.id} data-selected={selected === index}>
                        <button
                            type="button"
                            className="video-preview-choice"
                            aria-label={`Preview ${item.title}`}
                            aria-pressed={selected === index}
                            onPointerEnter={event => {
                                if (event.pointerType !== 'touch' && selected !== index) {
                                    cancelHover()
                                    hoverTimer.current = window.setTimeout(() => choose(index), 120)
                                }
                            }}
                            onPointerLeave={cancelHover}
                            onFocus={() => choose(index)}
                            onClick={() => choose(index)}
                            onKeyDown={event => {
                                if (!['ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key)) return
                                event.preventDefault()
                                const next =
                                    event.key === 'Home'
                                        ? 0
                                        : event.key === 'End'
                                        ? videos.length - 1
                                        : Math.max(
                                              0,
                                              Math.min(videos.length - 1, index + (event.key === 'ArrowUp' ? -1 : 1))
                                          )
                                event.currentTarget
                                    .closest('ul')
                                    ?.querySelectorAll<HTMLButtonElement>('.video-preview-choice')
                                    [next]?.focus()
                            }}
                        >
                            <span className="video-thumbnail">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={item.image} alt="" width={80} height={45} />
                            </span>
                            <span className="video-row-text">
                                <strong>{item.shortTitle}</strong>
                            </span>
                        </button>
                        <a
                            href={`https://www.youtube.com/watch?v=${item.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="video-watch"
                            aria-label={`Watch ${item.title} on YouTube`}
                            title="Watch on YouTube"
                        >
                            <ExternalArrow />
                        </a>
                    </li>
                ))}
            </ul>
        </div>
    )
}
