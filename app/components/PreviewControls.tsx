export function ExternalArrow() {
    return (
        <svg
            viewBox="0 0 20 20"
            width="14"
            height="14"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.4"
            aria-hidden="true"
        >
            <path d="M5 15 15 5M5 5h10v10" />
        </svg>
    )
}

export function PreviewLink({ href, label }: { href: string; label: string }) {
    return (
        <a
            className="preview-icon-action"
            href={href}
            target={href.startsWith('mailto:') ? undefined : '_blank'}
            rel="noopener noreferrer"
            aria-label={label}
            title={label}
        >
            <ExternalArrow />
        </a>
    )
}

export function PreviewClose({ label, onClose }: { label: string; onClose: () => void }) {
    return (
        <button
            type="button"
            className="preview-icon-action preview-close"
            onClick={onClose}
            aria-label={label}
            title="Close"
        >
            <svg viewBox="0 0 16 16" width="12" height="12" aria-hidden="true">
                <path d="m4 4 8 8M12 4l-8 8" fill="none" stroke="currentColor" strokeWidth="1.4" />
            </svg>
        </button>
    )
}
