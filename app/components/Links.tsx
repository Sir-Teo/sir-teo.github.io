'use client'
import {
    forwardRef,
    memo,
    useCallback,
    useEffect,
    useId,
    useRef,
    useState,
    type Dispatch,
    type FocusEvent,
    type PointerEvent as ReactPointerEvent,
    type RefCallback,
    type SetStateAction,
} from 'react'
import dynamic from 'next/dynamic'
import QRCodePopover from './QRCodePopover'
import IconMask from './LinkIcon'
import { categories, links, projects, type LinkItem } from '../data/profile'

const allLinks = [...links, ...projects]
const linkGroups = categories.map(category => ({
    category,
    items: allLinks.filter(link => link.category === category && (link.href || link.qrcode || link.handle)),
}))

// Download optional interfaces only when opened. Keep the terminal mounted after
// its first use so closing it preserves the visitor's command history.
const Terminal = dynamic(() => import('./Terminal'), { ssr: false })
const StatCard = dynamic(() => import('./StatCard'), { ssr: false })

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
    const canHover = useCanHover()

    // Return focus to the launcher when the panel closes (keyboard accessibility).
    const closeTerm = () => {
        setTermOpen(false)
        termChipRef.current?.focus()
    }
    return (
        <>
            <div className="space-y-5 sm:space-y-6">
                {/* Profile links and projects share the same pills and preview behavior. */}
                {linkGroups.map(({ category, items }) => {
                    if (items.length === 0) return null
                    return (
                        <section key={category} aria-label={category}>
                            <h2 className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
                                {category}
                            </h2>
                            <ul className="flex flex-wrap gap-2">
                                {items.map(link => (
                                    <li key={link.label}>
                                        <LinkChip
                                            link={link}
                                            cardOpen={activeCard === link.label}
                                            canHover={canHover}
                                            setActiveCard={setActiveCard}
                                        />
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
                            setActiveCard(null)
                            setTermLoaded(true)
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

function ChipInner({ link }: { link: LinkItem }) {
    return (
        <span className="link-chip group inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-[13px] ring-1 ring-slate-200 transition active:scale-[0.97] hover:ring-slate-300 motion-safe:hover:-translate-y-0.5 dark:bg-slate-800 dark:ring-slate-700 dark:hover:ring-slate-600 sm:gap-2 sm:text-sm">
            <IconMask link={link} className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span className="text-slate-700 dark:text-slate-200">{link.label}</span>
        </span>
    )
}

const LinkChip = memo(function LinkChip({
    link,
    cardOpen,
    canHover,
    setActiveCard,
}: {
    link: LinkItem
    cardOpen: boolean
    canHover: boolean
    setActiveCard: Dispatch<SetStateAction<string | null>>
}) {
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
})
