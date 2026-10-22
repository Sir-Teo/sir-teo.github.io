import type { CSSProperties } from 'react'
import type { LinkItem } from '../data/profile'

// Most icons are tinted silhouettes; original brand assets preserve their colors.
export default function IconMask({ link, className = 'h-4 w-4' }: { link: LinkItem; className?: string }) {
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
