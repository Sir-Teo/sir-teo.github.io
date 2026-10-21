'use client'

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import type { LinkItem } from '../data/profile'

export default function GameWindow({ link, onClose }: { link: LinkItem; onClose: () => void }) {
    const dialog = useRef<HTMLDialogElement>(null)
    const [reload, setReload] = useState(0)
    const [loaded, setLoaded] = useState(false)
    useEffect(() => {
        const element = dialog.current!
        const previous = document.body.style.overflow
        document.body.style.overflow = 'hidden'
        element.showModal()
        return () => {
            element.close()
            document.body.style.overflow = previous
        }
    }, [])

    return createPortal(
        <dialog
            ref={dialog}
            className="game-window"
            aria-label={`Play ${link.label}`}
            onCancel={event => {
                event.preventDefault()
                onClose()
            }}
        >
            <div className="game-window-toolbar">
                <div className="game-window-title">
                    <span aria-hidden="true" />
                    <strong>{link.label}</strong>
                </div>
                <nav aria-label="Game window controls">
                    <button
                        type="button"
                        onClick={() => {
                            setLoaded(false)
                            setReload(n => n + 1)
                        }}
                        aria-label="Reload game"
                    >
                        ↻
                    </button>
                    <a href={link.href} target="_blank" rel="noopener noreferrer">
                        Open tab ↗
                    </a>
                    <button type="button" autoFocus onClick={onClose} aria-label="Close game">
                        ✕
                    </button>
                </nav>
            </div>
            <div className="game-window-content">
                {!loaded && (
                    <p role="status" className="game-window-loading">
                        Opening {link.label}…
                    </p>
                )}
                <iframe
                    key={reload}
                    src={link.href}
                    title={`${link.label} — full game`}
                    allow="fullscreen; gamepad"
                    allowFullScreen
                    onLoad={() => setLoaded(true)}
                />
            </div>
            <div className="game-window-caption">
                <span>
                    {link.preview?.mode === 'rift'
                        ? 'Mouse + keyboard · Esc pauses'
                        : link.preview?.mode === 'crown'
                        ? 'Drag to look around · Tap to build or deploy'
                        : 'WASD to move · Drag to look · F to enter a car'}
                </span>
                <span>Live from {new URL(link.href!).hostname}</span>
            </div>
        </dialog>,
        document.body
    )
}
