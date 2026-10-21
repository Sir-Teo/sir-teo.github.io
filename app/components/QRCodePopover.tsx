'use client'

import Image from 'next/image'

interface QRCodePopoverProps {
    id: string
    isOpen: boolean
    qrCodeImg: string
    label: string
    onClose: () => void
}

const QRCodePopover = ({ id, isOpen, qrCodeImg, label, onClose }: QRCodePopoverProps) => {
    if (!isOpen) return null
    if (!qrCodeImg) return null
    return (
        <div id={id} role="dialog" aria-label={`${label} QR code`} className="project-preview profile-card profile-qr">
            <header className="profile-card-header">
                <div className="profile-card-identity">
                    <div className="profile-card-title">
                        <h3>{label}</h3>
                    </div>
                    <p className="profile-card-meta">Scan to add</p>
                </div>
                <button type="button" onClick={onClose} aria-label={`Close ${label} QR code`} className="preview-close">
                    <svg
                        viewBox="0 0 24 24"
                        aria-hidden
                        className="h-3.5 w-3.5"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                    >
                        <path d="M6 6l12 12M18 6 6 18" />
                    </svg>
                </button>
            </header>
            <Image
                src={qrCodeImg}
                alt={`${label} QR code`}
                width={224}
                height={224}
                unoptimized
                className="profile-qr-image"
            />
        </div>
    )
}

export default QRCodePopover
