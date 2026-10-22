// Single source of truth for the site's content.
// Edit this file to update anything shown on the page.

import snapshots from './stats.json'

// The few buckets the chips are grouped into on the homepage. Order here is the
// order the sections render in.
export const categories = ['Work & Research', 'Social', 'Play & Hobbies', 'Photography', 'Projects'] as const
export type LinkCategory = (typeof categories)[number]

// A single metric shown in a chip's hover/focus card (e.g. { label: 'Streak', value: '794 days' }).
export type LinkStat = { label: string; value: string }
export type StatsId = keyof typeof snapshots
export type StatsSnapshot = { checkedAt: string; stats: LinkStat[] }
export const statsSnapshots: Record<StatsId, StatsSnapshot> = snapshots

export type LinkItem = {
    label: string
    href?: string // omit/empty to hide the link
    icon: string // local icon asset, tinted through a mask unless iconStyle is original
    iconStyle?: 'original' // preserve a brand asset's own colors
    color: string // brand color for the icon
    colorDark?: string // override for dark mode when the brand color is too dark to read
    qrcode?: string // for QR-only links like WeChat
    handle?: string // for copy-on-click handles with no URL (e.g. Discord)
    category: LinkCategory // which grouped section the chip lives in
    meta?: string // short subtitle (handle / id) shown in the hover card
    description?: string // project introduction shown in the hover/focus/tap preview
    tags?: string[] // a few useful features or topics for project previews
    preview?: {
        mode: 'crown' | 'rift' | 'postcard' | 'chess' | 'xiangqi' | 'go' | 'videos' | 'finos'
        hint: string
        action: string
        videos?: {
            id: string
            title: string
            topic: string
            image: string
            clip: string
            start: number
        }[]
    }
    stats?: LinkStat[] // optional metrics revealed on hover/focus
    statsId?: StatsId // public browser refresh, or a dated snapshot when CORS is unavailable
    statsSource?: string // community provider attribution, when the platform has no public browser API
    stravaSummary?: string // official, public weekly-summary iframe copied from the athlete profile
}

export const profile = {
    name: 'Teo Zeng',
    // Canonical origin, used for the canonical link, Open Graph URLs and the sitemap.
    url: 'https://teozeng.dev',
    // Third-person summary for search results and link previews. The first-person
    // `tagline` below is what the page itself renders.
    description: 'Teo Zeng — data scientist and machine-learning researcher in New York.',
    jobTitle: 'Data Scientist',
    location: 'New York',
    tagline:
        'I am Teo Zeng. I like traveling, running, any sports with an emphasis on basketball, researching, and playing video games.',
    avatar: '/user/shifu.webp',
    // Attribution for the avatar image (shown on hover).
    avatarCredit: 'Master Shifu — Kung Fu Panda © DreamWorks Animation',
}

export const links: LinkItem[] = [
    // ── Work & Research ──────────────────────────────────────────────
    {
        label: 'LeetCode',
        href: 'https://leetcode.com/u/user5137/',
        icon: '/icons/leetcode.svg',
        color: '#FFA116',
        category: 'Work & Research',
        meta: '@user5137',
        statsId: 'leetcode',
        statsSource: 'LeetCard',
        stats: statsSnapshots.leetcode.stats,
    },
    {
        label: 'Kaggle',
        href: 'https://www.kaggle.com/sirteo',
        icon: '/icons/kaggle.svg',
        color: '#20BEFF',
        category: 'Work & Research',
        meta: '@sirteo',
        stats: [
            { label: 'Competitions', value: '19' },
            { label: 'Code', value: '3' },
            { label: 'Writeups', value: '2' },
            { label: 'Joined', value: '6y ago' },
        ],
    },
    {
        label: 'Devpost',
        href: 'https://devpost.com/zengwc-teo2016',
        icon: '/icons/devpost.svg',
        color: '#003E54',
        colorDark: '#7dd3fc',
        category: 'Work & Research',
        meta: '@zengwc-teo2016',
        stats: [
            { label: 'Projects', value: '1' },
            { label: 'Hackathons', value: '1' },
            { label: 'Achievements', value: '1' },
            { label: 'Likes', value: '1' },
        ],
    },
    {
        label: 'Blog',
        href: 'https://teozeng.dev/blogs/',
        icon: '/icons/blog.svg',
        color: '#0EA5E9',
        category: 'Work & Research',
        meta: 'Research notebook',
        statsId: 'blog',
        stats: statsSnapshots.blog.stats,
    },
    {
        label: 'Email',
        href: 'mailto:zengwc.teo2016@outlook.com',
        icon: '/icons/email.svg',
        color: '#0078D4',
        colorDark: '#3FA3F0',
        category: 'Work & Research',
        meta: 'zengwc.teo2016@outlook.com',
    },
    {
        label: 'LinkedIn',
        href: 'https://www.linkedin.com/in/teozeng/',
        icon: '/icons/linkedin.svg',
        color: '#0A66C2',
        colorDark: '#4DA3E4',
        category: 'Work & Research',
        meta: 'in/teozeng',
        stats: [
            { label: 'Connections', value: '500+' },
            { label: 'Role', value: 'Data Scientist' },
            { label: 'Location', value: 'New York' },
        ],
    },
    {
        label: 'Google Scholar',
        href: 'https://scholar.google.com/citations?user=lLhU3igAAAAJ&hl=en',
        icon: '/icons/googlescholar.svg',
        color: '#4285F4',
        category: 'Work & Research',
        meta: 'Publications',
        stats: [
            { label: 'Articles', value: '5' },
            { label: 'Citations', value: '7' },
            { label: 'h-index', value: '1' },
            { label: 'i10-index', value: '0' },
        ],
    },
    {
        label: 'GitHub',
        href: 'https://github.com/Sir-Teo',
        icon: '/icons/github.svg',
        color: '#181717',
        colorDark: '#f0f6fc',
        category: 'Work & Research',
        meta: '@Sir-Teo',
        statsId: 'github',
        stats: statsSnapshots.github.stats,
    },

    // ── Social ───────────────────────────────────────────────────────
    {
        label: 'YouTube',
        href: 'https://www.youtube.com/@teozeng3999',
        icon: '/icons/youtube.svg',
        color: '#FF0000',
        category: 'Social',
        meta: '@teozeng3999',
        stats: [
            { label: 'Videos', value: '44' },
            { label: 'Subscribers', value: '24' },
        ],
    },
    {
        label: 'Reddit',
        href: 'https://www.reddit.com/user/Puzzleheaded_Bid_178/',
        icon: '/icons/reddit.svg',
        color: '#FF4500',
        category: 'Social',
        meta: 'u/Puzzleheaded_Bid_178',
        stats: [
            { label: 'Karma', value: '23' },
            { label: 'Post', value: '22' },
            { label: 'Comment', value: '1' },
            { label: 'Cake day', value: 'Aug 2021' },
        ],
    },
    {
        label: 'WeChat',
        qrcode: '/user/wechat_qrcode.jpg',
        icon: '/icons/wechat.svg',
        color: '#07C160',
        category: 'Social',
        meta: 'Scan to add',
    },
    {
        label: 'Discord',
        handle: 'teozeng',
        icon: '/icons/discord.svg',
        color: '#5865F2',
        colorDark: '#8b93f8',
        category: 'Social',
        meta: 'Click to copy',
    },
    {
        label: 'Bilibili',
        href: 'https://space.bilibili.com/299736746',
        icon: '/icons/bilibili.svg',
        color: '#FB7299',
        category: 'Social',
        meta: 'space/299736746',
        stats: [
            { label: 'Videos', value: '51' },
            { label: 'Followers', value: '78' },
            { label: 'Likes', value: '1,053' },
            { label: 'Level', value: '5' },
        ],
    },
    {
        label: 'Instagram',
        href: 'https://www.instagram.com/sir_teo',
        icon: '/icons/instagram.svg',
        color: '#E4405F',
        category: 'Social',
        meta: '@sir_teo',
        stats: [
            { label: 'Posts', value: '78' },
            { label: 'Followers', value: '535' },
            { label: 'Following', value: '577' },
        ],
    },

    // ── Play & Hobbies ───────────────────────────────────────────────
    {
        label: 'Strava',
        href: 'https://www.strava.com/athletes/206183585',
        icon: '/icons/strava.svg',
        color: '#FC4C02',
        category: 'Play & Hobbies',
        meta: 'This week in motion',
        stravaSummary:
            'https://www.strava.com/athletes/206183585/activity-summary/9ff06a679bccbf2e555dc5c4088ade021db852c0',
    },
    {
        // Clash of Clans has no official public player page; ClashOfStats hosts
        // the profile by tag.
        label: 'Clash of Clans',
        href: 'https://www.clashofstats.com/players/sir_teo-QP8UV90/summary',
        icon: '/icons/clashofclans.svg',
        color: '#E9A409',
        category: 'Play & Hobbies',
        meta: 'Tag #QP8UV90',
        stats: [
            { label: 'Town Hall', value: '18' },
            { label: 'XP', value: '241' },
            { label: 'Trophies', value: '1,724' },
            { label: 'Best', value: '5,561' },
        ],
    },

    {
        label: 'Chess.com',
        href: 'https://www.chess.com/member/masterteo1205',
        icon: '/icons/chess.svg',
        color: '#81B64C',
        category: 'Play & Hobbies',
        meta: '@masterteo1205',
        statsId: 'chess',
        stats: statsSnapshots.chess.stats,
    },
    {
        label: 'Duolingo',
        href: 'https://www.duolingo.com/profile/sirteo',
        icon: '/icons/duolingo.webp',
        iconStyle: 'original',
        color: '#58CC02',
        category: 'Play & Hobbies',
        meta: '@sirteo',
        statsId: 'duolingo',
        statsSource: 'Duo Streak Tracker',
        stats: statsSnapshots.duolingo.stats,
    },

    {
        label: 'OGS',
        href: 'https://online-go.com/user/view/622443',
        icon: '/icons/online-go.svg',
        color: '#1F2937',
        colorDark: '#cbd5e1',
        category: 'Play & Hobbies',
        meta: 'Go (Weiqi)',
        statsId: 'ogs',
        stats: statsSnapshots.ogs.stats,
    },
    {
        label: 'Steam',
        href: 'https://steamcommunity.com/profiles/76561198413328513/',
        icon: '/icons/steam.svg',
        color: '#1B2838',
        colorDark: '#66C0F4',
        category: 'Play & Hobbies',
        meta: 'Master Teo',
        stats: [
            { label: 'Level', value: '47' },
            { label: 'Games', value: '57' },
            { label: 'Badges', value: '11' },
            { label: 'Reviews', value: '17' },
        ],
    },

    // ── Photography ──────────────────────────────────────────────────
    {
        label: 'Gallery',
        href: 'https://teozeng.dev/sir-teo.github.io-archive/gallery/index.html',
        icon: '/icons/gallery.svg',
        color: '#7C3AED',
        colorDark: '#a78bfa',
        category: 'Photography',
        meta: 'Personal photo gallery',
        statsId: 'gallery',
        stats: statsSnapshots.gallery.stats,
    },
]

// Kept separate from identity/profile links so projects do not become Person.sameAs URLs.
export const projects: LinkItem[] = [
    {
        label: 'FinOS AgentLab',
        href: 'https://finos.teozeng.dev/',
        icon: '/icons/finos.svg',
        color: '#0284C7',
        colorDark: '#38BDF8',
        category: 'Projects',
        meta: 'Financial research workspace',
        preview: {
            mode: 'finos',
            hint: 'Workflow illustration',
            action: 'Open FinOS',
        },
    },
    {
        label: 'Explainer videos',
        href: 'https://www.youtube.com/@teozeng3999/videos',
        icon: '/icons/youtube.svg',
        color: '#FF0000',
        category: 'Projects',
        meta: 'Animated explainers',
        preview: {
            mode: 'videos',
            hint: 'Ideas, made visible.',
            action: 'All videos',
            videos: [
                {
                    id: 'o0ENWGEVJm0',
                    title: 'How Large Language Models Work',
                    topic: 'AI · attention & transformers',
                    image: '/previews/clip-llm.webp',
                    clip: '/previews/clip-llm.mp4',
                    start: 620,
                },
                {
                    id: 'aaPbLBw0ZYc',
                    title: 'Quantum Mechanics, Visualized',
                    topic: 'Physics · waves & interference',
                    image: '/previews/clip-quantum.webp',
                    clip: '/previews/clip-quantum.mp4',
                    start: 1370,
                },
                {
                    id: 'vdroXP5hjjQ',
                    title: 'General Relativity, Derived',
                    topic: 'Physics · spacetime & curvature',
                    image: '/previews/clip-relativity.webp',
                    clip: '/previews/clip-relativity.mp4',
                    start: 1145,
                },
            ],
        },
    },
    {
        label: 'Crown & Clan',
        href: 'https://coc.teozeng.dev/',
        icon: '/icons/clashofclans.svg',
        color: '#E9A409',
        category: 'Projects',
        meta: 'Village-building strategy',
        preview: { mode: 'crown', hint: 'Build. Raid. Repeat.', action: 'Open game' },
    },
    {
        label: 'Summoner’s Rift',
        href: 'https://teozeng.dev/web-lol/',
        icon: '/icons/swords.svg',
        color: '#B68B3C',
        colorDark: '#E4BF72',
        category: 'Projects',
        meta: 'Browser MOBA',
        preview: { mode: 'rift', hint: 'Ashe · Lux · Browser practice', action: 'Open game' },
    },
    {
        label: 'San Andreas',
        href: 'https://teozeng.dev/web-gta/',
        icon: '/icons/car.svg',
        color: '#16A34A',
        colorDark: '#4ADE80',
        category: 'Projects',
        meta: 'Open-world recreation',
        preview: { mode: 'postcard', hint: 'Los Santos, in the browser', action: 'Open game' },
    },
    {
        label: 'Web Chess',
        href: 'https://teozeng.dev/web-chess/',
        icon: '/icons/chess.svg',
        color: '#81B64C',
        category: 'Projects',
        meta: 'Chess · play & analyze',
        preview: { mode: 'chess', hint: 'Recorded game review', action: 'Open app' },
    },
    {
        label: 'Web Xiangqi',
        href: 'https://teozeng.dev/web-xiangqi/',
        icon: '/icons/xiangqi.svg',
        color: '#DC2626',
        colorDark: '#F87171',
        category: 'Projects',
        meta: 'Chinese chess · play & analyze',
        preview: { mode: 'xiangqi', hint: 'Recorded game review', action: 'Open app' },
    },
    {
        label: 'Web KaTrain',
        href: 'https://teozeng.dev/web-katrain/',
        icon: '/icons/go-board.svg',
        color: '#7C3AED',
        colorDark: '#A78BFA',
        category: 'Projects',
        meta: 'Go / Weiqi · play & analyze',
        preview: { mode: 'go', hint: 'Recorded game review', action: 'Open app' },
    },
]
