'use client'
import {
    forwardRef,
    useCallback,
    useEffect,
    useId,
    useLayoutEffect,
    useRef,
    useState,
    type CSSProperties,
    type Dispatch,
    type FocusEvent,
    type PointerEvent as ReactPointerEvent,
    type RefCallback,
    type RefObject,
    type SetStateAction,
} from 'react'
import dynamic from 'next/dynamic'
import QRCodePopover from './QRCodePopover'
import ProjectPreview from './ProjectPreview'
import useProfileStats from './useProfileStats'
import StravaSummary from './StravaSummary'
import { categories, links, projects, type LinkItem } from '../data/profile'

const allLinks = [...links, ...projects]

// The terminal is roughly two thirds of this page's client code and hardly anyone
// opens it. Split it into its own chunk and pull that chunk in once the page has
// gone idle (or right away if someone clicks first), so it stays off the initial
// load without changing how the panel itself behaves.
const Terminal = dynamic(() => import('./Terminal'), { ssr: false })

// Keyboard focus ring shared by every chip so tab-navigation is clearly visible
// without affecting the resting (mouse) look.
const FOCUS_RING =
    'rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-slate-500 dark:focus-visible:ring-offset-slate-950'

// True when the primary pointer can hover (a desktop mouse). On touch devices it
// is false, so the stat cards switch from hover-reveal to tap-reveal.
function useCanHover() {
    const [canHover, setCanHover] = useState(true)
    useEffect(() => {
        const mq = window.matchMedia('(hover: hover)')
        const update = () => setCanHover(mq.matches)
        update()
        mq.addEventListener('change', update)
        return () => mq.removeEventListener('change', update)
    }, [])
    return canHover
}

export default function Links() {
    const [activeCard, setActiveCard] = useState<string | null>(null)
    const [termOpen, setTermOpen] = useState(false)
    const [termLoaded, setTermLoaded] = useState(false)
    const termChipRef = useRef<HTMLButtonElement>(null)

    // Warm the terminal chunk during idle time so the first open is instant.
    useEffect(() => {
        if (typeof window.requestIdleCallback !== 'function') {
            const id = window.setTimeout(() => setTermLoaded(true), 1500)
            return () => window.clearTimeout(id)
        }
        const id = window.requestIdleCallback(() => setTermLoaded(true), { timeout: 3000 })
        return () => window.cancelIdleCallback(id)
    }, [])

    // Return focus to the launcher when the panel closes (keyboard accessibility).
    const closeTerm = () => {
        setTermOpen(false)
        termChipRef.current?.focus()
    }
    return (
        <>
            <div className="space-y-5 sm:space-y-6">
                {/* Profile links and projects share the same pills and preview behavior. */}
                {categories.map(category => {
                    const items = allLinks.filter(
                        link => link.category === category && (link.href || link.qrcode || link.handle)
                    )
                    if (items.length === 0) return null
                    return (
                        <section key={category} aria-label={category}>
                            <h2 className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
                                {category}
                            </h2>
                            <ul className="flex flex-wrap gap-2">
                                {items.map(link => (
                                    <li key={link.label}>
                                        <LinkChip link={link} activeCard={activeCard} setActiveCard={setActiveCard} />
                                    </li>
                                ))}
                            </ul>
                        </section>
                    )
                })}
                {/* Terminal launcher — opens an in-page panel. */}
                <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-4 dark:border-slate-800">
                    <TerminalChip
                        ref={termChipRef}
                        active={termOpen}
                        onClick={() => {
                            setTermLoaded(true) // in case the click beats the idle warm-up
                            setTermOpen(o => !o)
                        }}
                    />
                </div>
            </div>
            {termLoaded && <Terminal open={termOpen} onClose={closeTerm} />}
        </>
    )
}

const TerminalChip = forwardRef<HTMLButtonElement, { active: boolean; onClick: () => void }>(function TerminalChip(
    { active, onClick },
    ref
) {
    return (
        <button
            ref={ref}
            type="button"
            onClick={onClick}
            aria-expanded={active}
            aria-label={active ? 'Close terminal' : 'Open terminal'}
            title="Toggle interactive terminal"
            className={`group inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] ring-1 transition active:scale-[0.97] motion-safe:hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-slate-500 dark:focus-visible:ring-offset-slate-950 sm:gap-2 sm:text-sm ${
                active
                    ? 'bg-slate-900 text-slate-100 ring-slate-700 dark:bg-slate-100 dark:text-slate-900 dark:ring-slate-300'
                    : 'bg-white text-slate-700 ring-slate-200 hover:ring-slate-300 dark:bg-slate-800 dark:text-slate-200 dark:ring-slate-700 dark:hover:ring-slate-600'
            }`}
        >
            <svg
                viewBox="0 0 24 24"
                aria-hidden
                className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            >
                <rect x="3" y="4" width="18" height="16" rx="2" />
                <path d="m7 9 3 3-3 3" />
                <path d="M13 15h4" />
            </svg>
            <span>Terminal</span>
        </button>
    )
})

// Most icons are tinted silhouettes; original brand assets preserve their colors.
function IconMask({ link, className = 'h-4 w-4' }: { link: LinkItem; className?: string }) {
    if (link.iconStyle === 'original') {
        return (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={link.icon} alt="" width={18} height={18} className="h-[18px] w-[18px] shrink-0 rounded-[4px]" />
        )
    }
    return (
        <span
            aria-hidden
            className={`link-icon shrink-0 ${className}`}
            style={
                {
                    '--ic': link.color,
                    '--icd': link.colorDark,
                    maskImage: `url(${link.icon})`,
                    WebkitMaskImage: `url(${link.icon})`,
                    maskRepeat: 'no-repeat',
                    WebkitMaskRepeat: 'no-repeat',
                    maskPosition: 'center',
                    WebkitMaskPosition: 'center',
                    maskSize: 'contain',
                    WebkitMaskSize: 'contain',
                } as CSSProperties
            }
        />
    )
}

function ChipInner({ link }: { link: LinkItem }) {
    return (
        <span className="link-chip group inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-[13px] ring-1 ring-slate-200 transition active:scale-[0.97] hover:ring-slate-300 motion-safe:hover:-translate-y-0.5 dark:bg-slate-800 dark:ring-slate-700 dark:hover:ring-slate-600 sm:gap-2 sm:text-sm">
            <IconMask link={link} className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span className="text-slate-700 dark:text-slate-200">{link.label}</span>
        </span>
    )
}

type TooltipPosition = {
    left: number
    top: number
}

// Compact project previews and profile stats share the same anchored surface.
// Padding bridges the pointer's path from the chip to the visible surface.
function StatCard({
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
        const updatePosition = () => {
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
            setPosition({ left, top: Math.max(margin, Math.min(top, window.innerHeight - cardHeight - margin)) })
        }

        updatePosition()
        const frame = window.requestAnimationFrame(updatePosition)
        const observer = new ResizeObserver(updatePosition)
        if (cardRef.current) observer.observe(cardRef.current)
        window.addEventListener('resize', updatePosition)
        window.addEventListener('scroll', updatePosition, true)

        return () => {
            window.cancelAnimationFrame(frame)
            observer.disconnect()
            window.removeEventListener('resize', updatePosition)
            window.removeEventListener('scroll', updatePosition, true)
        }
    }, [triggerRef, stats, freshness, unavailable])

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
                    : '20rem',
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
                        <div className="profile-card-identity">
                            <div className="profile-card-title">
                                <IconMask link={link} />
                                <h3>{link.label}</h3>
                            </div>
                            {(link.handle || link.meta) && (
                                <p className="profile-card-meta">{link.handle ?? link.meta}</p>
                            )}
                        </div>
                        <button
                            type="button"
                            className="preview-close"
                            onClick={onClose}
                            aria-label={`Close ${link.label} details`}
                        >
                            <svg viewBox="0 0 16 16" width="13" height="13" aria-hidden="true">
                                <path d="m4 4 8 8M12 4l-8 8" fill="none" stroke="currentColor" strokeWidth="1.5" />
                            </svg>
                        </button>
                    </header>
                    {link.description && <p className="profile-card-description">{link.description}</p>}
                    {link.stravaSummary && <StravaSummary src={link.stravaSummary} />}
                    {link.tags && link.tags.length > 0 && (
                        <ul className="profile-card-tags" aria-label="Features">
                            {link.tags.map(tag => (
                                <li key={tag}>{tag}</li>
                            ))}
                        </ul>
                    )}
                    {stats && stats.length > 0 && (
                        <dl className="profile-card-stats" aria-label={`${link.label} stats`}>
                            {stats.map(stat => (
                                <div key={stat.label}>
                                    <dt>{stat.label}</dt>
                                    <dd data-numeric={/^[\d,.+−%-]+$/.test(stat.value)}>{stat.value}</dd>
                                </div>
                            ))}
                        </dl>
                    )}
                    <footer className="profile-card-footer">
                        <div className="profile-card-status" role="status">
                            {stats && stats.length > 0 && (
                                <>
                                    <span title={checkedAt ? new Date(checkedAt).toLocaleString() : undefined}>
                                        {current && <i aria-hidden="true" />}
                                        {freshness}
                                    </span>
                                    {unavailable && <span>Refresh unavailable</span>}
                                    {link.statsSource && <span>via {link.statsSource}</span>}
                                </>
                            )}
                            {link.stravaSummary && <span>Official weekly summary</span>}
                            {copyStatus === 'copied' && <span>Handle copied</span>}
                            {copyStatus === 'showing' && <span>Select the handle above to copy.</span>}
                        </div>
                        {onCopy ? (
                            <button type="button" className="profile-card-action" onClick={onCopy}>
                                {copyStatus === 'copied' ? 'Copied' : 'Copy handle'}
                                <svg
                                    viewBox="0 0 20 20"
                                    width="15"
                                    height="15"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="1.4"
                                    aria-hidden="true"
                                >
                                    <rect x="7" y="7" width="9" height="10" rx="2" />
                                    <path d="M12 7V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h2" />
                                </svg>
                            </button>
                        ) : (
                            link.href && (
                                <a
                                    className="profile-card-action"
                                    href={link.href}
                                    target={link.href.startsWith('mailto:') ? undefined : '_blank'}
                                    rel="noopener noreferrer"
                                    aria-label={`Open ${link.label}`}
                                >
                                    {link.href.startsWith('mailto:')
                                        ? 'Write email'
                                        : link.label === 'Blog'
                                        ? 'Read blog'
                                        : link.label === 'Gallery'
                                        ? 'View gallery'
                                        : 'Open profile'}
                                    <svg
                                        viewBox="0 0 20 20"
                                        width="15"
                                        height="15"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="1.4"
                                        aria-hidden="true"
                                    >
                                        <path d="M5 15 15 5M5 5h10v10" />
                                    </svg>
                                </a>
                            )
                        )}
                    </footer>
                </div>
            )}
        </div>
    )
}

function LinkChip({
    link,
    activeCard,
    setActiveCard,
}: {
    link: LinkItem
    activeCard: string | null
    setActiveCard: Dispatch<SetStateAction<string | null>>
}) {
    const cardOpen = activeCard === link.label
    const setCardOpen = useCallback(
        (open: boolean) => setActiveCard(current => (open ? link.label : current === link.label ? null : current)),
        [link.label, setActiveCard]
    )
    const qrOpen = Boolean(link.qrcode && cardOpen)
    const pointerTypeRef = useRef('')
    const [copyStatus, setCopyStatus] = useState<'idle' | 'copied' | 'showing'>('idle')
    const qrPopoverId = useId()
    const statCardId = useId()
    const qrWrapRef = useRef<HTMLDivElement>(null)
    const wrapRef = useRef<HTMLDivElement>(null)
    const triggerRef = useRef<HTMLElement | null>(null)
    const copyResetRef = useRef<number | null>(null)
    const enterTimerRef = useRef<number | null>(null)
    const leaveTimerRef = useRef<number | null>(null)
    const canHover = useCanHover()
    const cancelLeave = () => {
        if (leaveTimerRef.current !== null) window.clearTimeout(leaveTimerRef.current)
        leaveTimerRef.current = null
    }
    const cancelEnter = () => {
        if (enterTimerRef.current !== null) window.clearTimeout(enterTimerRef.current)
        enterTimerRef.current = null
    }
    // Standard links get a hover/focus stats card; QR chips own their click popover instead.
    const showCard = !link.qrcode && Boolean(link.meta || link.description || link.stats?.length)
    const closeCard = () => {
        cancelEnter()
        cancelLeave()
        // Focus first: its focus handler runs before the explicit dismissal.
        // This returns keyboard users from the card without reopening it.
        triggerRef.current?.focus({ preventScroll: true })
        setCardOpen(false)
    }
    const setTriggerRef: RefCallback<HTMLElement> = node => {
        triggerRef.current = node
    }
    // Focus opens the card everywhere so keyboard users get it too. Touch devices
    // are tap-to-open (handled in onClick below), closed by an outside tap / Escape.
    const triggerCardProps = showCard
        ? {
              'aria-haspopup': 'dialog' as const,
              'aria-expanded': cardOpen,
              'aria-controls': cardOpen ? statCardId : undefined,
              onPointerDown: (event: ReactPointerEvent<HTMLElement>) => {
                  pointerTypeRef.current = event.pointerType
              },
              onKeyDown: () => {
                  pointerTypeRef.current = ''
              },
              onFocus: (event: FocusEvent<HTMLElement>) => {
                  // Pointer focus on a phone precedes click: let the first tap open
                  // the preview, while keyboard focus still reveals it immediately.
                  if (pointerTypeRef.current !== 'touch' && event.currentTarget.matches(':focus-visible')) {
                      cancelEnter()
                      setCardOpen(true)
                  }
              },
              onBlur: (event: FocusEvent<HTMLElement>) => {
                  pointerTypeRef.current = ''
                  if (wrapRef.current?.contains(event.relatedTarget as Node)) return
                  // Selecting a stat has no focusable related target. Outside
                  // pointer presses are handled separately, so keep the card open.
                  if (event.relatedTarget) setCardOpen(false)
              },
          }
        : {}
    // Hover lives on the wrapper, not the chip: the card renders inside the wrapper,
    // so pointerleave holds off while the pointer is on the card. Without that you
    // could never reach the card to click it.
    const wrapHoverProps =
        showCard && canHover
            ? {
                  onPointerEnter: (event: ReactPointerEvent<HTMLElement>) => {
                      if (event.pointerType === 'touch') return
                      cancelLeave()
                      cancelEnter()
                      if (!cardOpen) enterTimerRef.current = window.setTimeout(() => setCardOpen(true), 90)
                  },
                  onPointerLeave: (event: ReactPointerEvent<HTMLElement>) => {
                      if (event.pointerType === 'touch') return
                      cancelEnter()
                      const focused = document.activeElement
                      if (focused?.matches(':focus-visible') && wrapRef.current?.contains(focused)) return
                      cancelLeave()
                      leaveTimerRef.current = window.setTimeout(() => setCardOpen(false), 220)
                  },
              }
            : {}

    useEffect(() => {
        return () => {
            if (enterTimerRef.current !== null) window.clearTimeout(enterTimerRef.current)
            if (copyResetRef.current !== null) window.clearTimeout(copyResetRef.current)
            if (leaveTimerRef.current !== null) window.clearTimeout(leaveTimerRef.current)
        }
    }, [])

    // Escape dismisses previews everywhere; touch previews also close on an outside tap.
    useEffect(() => {
        if (!cardOpen || link.qrcode) return
        const closeOnOutsidePress = (event: PointerEvent) => {
            if (!wrapRef.current?.contains(event.target as Node)) setCardOpen(false)
        }
        const closeOnEscape = (event: KeyboardEvent) => {
            if (event.key !== 'Escape') return
            if (wrapRef.current?.contains(document.activeElement)) {
                triggerRef.current?.focus({ preventScroll: true })
            }
            setCardOpen(false)
        }
        document.addEventListener('pointerdown', closeOnOutsidePress)
        document.addEventListener('keydown', closeOnEscape)
        return () => {
            document.removeEventListener('pointerdown', closeOnOutsidePress)
            document.removeEventListener('keydown', closeOnEscape)
        }
    }, [cardOpen, link.qrcode, setCardOpen])

    useEffect(() => {
        if (!qrOpen || !link.qrcode) return
        const closeOnOutsidePress = (event: PointerEvent) => {
            if (!qrWrapRef.current?.contains(event.target as Node)) setCardOpen(false)
        }
        const closeOnEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                triggerRef.current?.focus({ preventScroll: true })
                setCardOpen(false)
            }
        }
        document.addEventListener('pointerdown', closeOnOutsidePress)
        document.addEventListener('keydown', closeOnEscape)
        return () => {
            document.removeEventListener('pointerdown', closeOnOutsidePress)
            document.removeEventListener('keydown', closeOnEscape)
        }
    }, [qrOpen, link.qrcode, setCardOpen])

    // QR-only link (WeChat): click/tap toggles the code; outside click or Escape closes it.
    if (link.qrcode) {
        return (
            <div
                ref={qrWrapRef}
                className="relative inline-block"
                onBlur={event => {
                    if (event.relatedTarget && !event.currentTarget.contains(event.relatedTarget as Node))
                        setCardOpen(false)
                }}
            >
                <button
                    type="button"
                    ref={setTriggerRef}
                    onClick={() => setCardOpen(!qrOpen)}
                    aria-haspopup="dialog"
                    aria-expanded={qrOpen}
                    aria-controls={qrOpen ? qrPopoverId : undefined}
                    aria-label={`Show ${link.label} QR code`}
                    title={`${link.label} QR code`}
                    className={`inline-flex cursor-pointer ${FOCUS_RING}`}
                >
                    <ChipInner link={link} />
                </button>
                <QRCodePopover
                    id={qrPopoverId}
                    isOpen={qrOpen}
                    qrCodeImg={link.qrcode}
                    label={link.label}
                    onClose={closeCard}
                />
            </div>
        )
    }

    // Handle-only link (Discord): copy to clipboard on click.
    if (link.handle) {
        const handle = link.handle
        const copy = async () => {
            if (copyResetRef.current !== null) window.clearTimeout(copyResetRef.current)
            try {
                if (!navigator.clipboard) throw new Error('Clipboard API unavailable')
                await navigator.clipboard.writeText(handle)
                setCopyStatus('copied')
            } catch {
                setCopyStatus('showing')
            }
            copyResetRef.current = window.setTimeout(() => setCopyStatus('idle'), 1800)
        }
        const visibleLink =
            copyStatus === 'copied'
                ? { ...link, label: 'Copied!' }
                : copyStatus === 'showing'
                ? { ...link, label: handle }
                : link
        return (
            <div
                ref={wrapRef}
                className="relative inline-block"
                {...wrapHoverProps}
                onBlur={event => {
                    if (event.relatedTarget && !event.currentTarget.contains(event.relatedTarget as Node))
                        setCardOpen(false)
                }}
            >
                <button
                    ref={setTriggerRef}
                    type="button"
                    onClick={event => {
                        if (event.detail !== 0 && (!canHover || pointerTypeRef.current === 'touch'))
                            setCardOpen(!cardOpen)
                        else void copy()
                    }}
                    aria-label={`Copy ${link.label} handle ${handle}`}
                    title={`${handle} - click to copy`}
                    className={`inline-flex cursor-pointer ${FOCUS_RING}`}
                    {...triggerCardProps}
                >
                    <ChipInner link={visibleLink} />
                </button>
                {showCard && cardOpen && (
                    <StatCard
                        id={statCardId}
                        triggerRef={triggerRef}
                        link={link}
                        onCopy={copy}
                        copyStatus={copyStatus}
                        onClose={closeCard}
                    />
                )}
            </div>
        )
    }

    return (
        <div
            ref={wrapRef}
            className="relative inline-block"
            {...wrapHoverProps}
            onBlur={event => {
                if (event.relatedTarget && !event.currentTarget.contains(event.relatedTarget as Node)) {
                    setCardOpen(false)
                }
            }}
        >
            <a
                ref={setTriggerRef}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className={`inline-flex ${FOCUS_RING}`}
                // On touch, the first tap reveals the stat card instead of navigating;
                // tapping the chip again dismisses it. The card has an explicit Open action.
                onClick={event => {
                    if (event.detail !== 0 && showCard && (!canHover || pointerTypeRef.current === 'touch')) {
                        event.preventDefault()
                        setCardOpen(!cardOpen)
                    }
                }}
                {...triggerCardProps}
            >
                <ChipInner link={link} />
            </a>
            {showCard && cardOpen && (
                <StatCard id={statCardId} triggerRef={triggerRef} link={link} onClose={closeCard} />
            )}
        </div>
    )
}
