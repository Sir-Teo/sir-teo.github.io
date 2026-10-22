'use client'

import Image from 'next/image'
import { PreviewClose } from './PreviewControls'

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
                </div>
                <PreviewClose onClose={onClose} label={`Close ${label} QR code`} />
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
