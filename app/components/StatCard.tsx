'use client'

import { useLayoutEffect, useRef, useState, type RefObject } from 'react'
import type { LinkItem } from '../data/profile'
import IconMask from './LinkIcon'
import ProjectPreview from './ProjectPreview'
import useProfileStats from './useProfileStats'
import StravaSummary from './StravaSummary'
import { PreviewClose, PreviewLink } from './PreviewControls'

type TooltipPosition = {
    left: number
    top: number
}

// Compact project previews and profile stats share the same anchored surface.
// Padding bridges the pointer's path from the chip to the visible surface.
export default function StatCard({
    link,
    triggerRef,
    id,
    onCopy,
    copyStatus,
    onClose,
}: {
    link: LinkItem
    triggerRef: RefObject<HTMLElement | null>
    id: string
    onCopy?: () => void
    copyStatus?: 'idle' | 'copied' | 'showing'
    onClose: () => void
}) {
    const cardRef = useRef<HTMLDivElement>(null)
    const [position, setPosition] = useState<TooltipPosition | null>(null)
    const { stats: refreshedStats, freshness, checkedAt, current, unavailable } = useProfileStats(link.statsId)
    const stats = refreshedStats ?? link.stats

    useLayoutEffect(() => {
        let frame: number | null = null
        const updatePosition = () => {
            frame = null
            const trigger = triggerRef.current
            const card = cardRef.current
            if (!trigger || !card) return

            const triggerRect = trigger.getBoundingClientRect()
            const cardRect = card.getBoundingClientRect()
            const margin = 12
            const availableWidth = Math.max(0, window.innerWidth - margin * 2)
            const cardWidth = Math.min(cardRect.width || 240, availableWidth)
            // Includes the padding that bridges the gap between chip and card.
            const cardHeight = cardRect.height || 120
            const preferredTop = triggerRect.top - cardHeight
            const opensAbove = preferredTop >= margin
            const top = opensAbove
                ? preferredTop
                : Math.min(triggerRect.bottom, window.innerHeight - cardHeight - margin)
            const centeredLeft = triggerRect.left + triggerRect.width / 2 - cardWidth / 2
            const left = Math.min(Math.max(centeredLeft, margin), window.innerWidth - cardWidth - margin)

            // Keep every control reachable near the viewport edges.
            const next = { left, top: Math.max(margin, Math.min(top, window.innerHeight - cardHeight - margin)) }
            setPosition(current => (current?.left === next.left && current.top === next.top ? current : next))
        }

        // A scroll can dispatch repeatedly within one frame. Measure only once,
        // and keep React idle when the anchored position has not changed.
        const schedulePosition = () => {
            if (frame === null) frame = window.requestAnimationFrame(updatePosition)
        }
        updatePosition()
        const observer = new ResizeObserver(schedulePosition)
        if (cardRef.current) observer.observe(cardRef.current)
        window.addEventListener('resize', schedulePosition)
        window.addEventListener('scroll', schedulePosition, { capture: true, passive: true })

        return () => {
            if (frame !== null) window.cancelAnimationFrame(frame)
            observer.disconnect()
            window.removeEventListener('resize', schedulePosition)
            window.removeEventListener('scroll', schedulePosition, true)
        }
    }, [triggerRef])

    return (
        <div
            id={id}
            ref={cardRef}
            role="dialog"
            data-preview={link.preview?.mode}
            aria-label={`${link.label} ${link.preview ? 'preview' : 'details'}`}
            style={{
                left: position?.left ?? 0,
                top: position?.top ?? 0,
                width: link.preview
                    ? link.preview.mode === 'videos'
                        ? 'var(--video-preview-width, 26rem)'
                        : ['chess', 'xiangqi', 'go'].includes(link.preview.mode)
                        ? 'var(--review-preview-width, 22rem)'
                        : '24rem'
                    : link.stravaSummary
                    ? '20rem'
                    : '18rem',
                maxWidth: 'calc(100vw - 1.5rem)',
                visibility: position ? 'visible' : 'hidden',
            }}
            // py-2 keeps the visible surface clear of the chip while leaving the box
            // flush against it, so crossing the gap never counts as leaving.
            className={`fixed z-50 py-2 motion-safe:transition motion-safe:duration-150 motion-safe:ease-out ${
                position ? 'translate-y-0 opacity-100' : 'translate-y-1 opacity-0'
            }`}
        >
            {link.preview ? (
                <ProjectPreview link={link} onClose={onClose} />
            ) : (
                <div className="project-preview profile-card">
                    <header className="profile-card-header">
                        <div className="profile-card-title">
                            <IconMask link={link} />
                            <h3>{link.label}</h3>
                        </div>
                        <div className="preview-actions">
                            {onCopy ? (
                                <button
                                    type="button"
                                    className="preview-icon-action"
                                    onClick={onCopy}
                                    aria-label={copyStatus === 'copied' ? 'Handle copied' : 'Copy handle'}
                                    title={copyStatus === 'copied' ? 'Copied' : 'Copy handle'}
                                >
                                    <svg
                                        viewBox="0 0 20 20"
                                        width="14"
                                        height="14"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="1.4"
                                        aria-hidden="true"
                                    >
                                        {copyStatus === 'copied' ? (
                                            <path d="m4 10 4 4 8-9" />
                                        ) : (
                                            <>
                                                <rect x="7" y="7" width="9" height="10" rx="2" />
                                                <path d="M12 7V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h2" />
                                            </>
                                        )}
                                    </svg>
                                </button>
                            ) : (
                                link.href && <PreviewLink href={link.href} label={`Open ${link.label}`} />
                            )}
                            <PreviewClose onClose={onClose} label={`Close ${link.label} details`} />
                        </div>
                    </header>
                    {(link.handle || (!stats?.length && !link.stravaSummary && link.meta)) && (
                        <p className="profile-card-meta">{link.handle ?? link.meta}</p>
                    )}
                    {link.stravaSummary && <StravaSummary src={link.stravaSummary} />}
                    {stats && stats.length > 0 && (
                        <>
                            <dl className="profile-card-stats" aria-label={`${link.label} stats`}>
                                {stats.map(stat => (
                                    <div key={stat.label}>
                                        <dt>{stat.label}</dt>
                                        <dd data-numeric={/^[\d,.+−%-]+$/.test(stat.value)}>{stat.value}</dd>
                                    </div>
                                ))}
                            </dl>
                            <footer
                                className="profile-card-status"
                                role="status"
                                title={[
                                    checkedAt ? new Date(checkedAt).toLocaleString() : 'Saved profile snapshot',
                                    unavailable ? 'Refresh unavailable' : '',
                                    link.statsSource ? `Source: ${link.statsSource}` : '',
                                ]
                                    .filter(Boolean)
                                    .join(' · ')}
                            >
                                <span>
                                    {current && <i aria-hidden="true" />}
                                    {freshness}
                                </span>
                                {link.statsSource && <span>{link.statsSource}</span>}
                                {unavailable && <span className="sr-only">Refresh unavailable</span>}
                            </footer>
                        </>
                    )}
                    <span className="sr-only" role="status">
                        {copyStatus === 'copied'
                            ? 'Handle copied'
                            : copyStatus === 'showing'
                            ? 'Select the handle to copy.'
                            : ''}
                    </span>
                </div>
            )}
        </div>
    )
}
