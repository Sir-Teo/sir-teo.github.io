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
    icon: string // monochrome silhouette in /public/icons; tinted to `color` via CSS mask
    color: string // brand color for the icon
    colorDark?: string // override for dark mode when the brand color is too dark to read
    qrcode?: string // for QR-only links like WeChat
    handle?: string // for copy-on-click handles with no URL (e.g. Discord)
    category: LinkCategory // which grouped section the chip lives in
    meta?: string // short subtitle (handle / id) shown in the hover card
    description?: string // project introduction shown in the hover/focus/tap preview
    tags?: string[] // a few useful features or topics for project previews
    preview?: {
        embedUrl?: string // the real deployed application, opened in an isolated frame
        launchLabel: string
        videos?: { id: string; title: string; image: string }[]
        image: string // locally hosted, compressed screenshot or original video thumbnail
        alt: string
        kind: string
        action: string
        status?: string
    }
    stats?: LinkStat[] // optional metrics revealed on hover/focus
    statsId?: StatsId // public browser refresh, or a dated snapshot when CORS is unavailable
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
        stats: [
            { label: 'Solved', value: '186' },
            { label: 'Easy', value: '70' },
            { label: 'Medium', value: '100' },
            { label: 'Hard', value: '16' },
        ],
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
        meta: 'Boston runner profile',
        stats: [
            { label: 'Activities', value: '124' },
            { label: 'Distance', value: '340.5 mi' },
            { label: 'Time', value: '60h 17m' },
            { label: 'Followers', value: '5' },
        ],
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
        label: 'Genshin Impact',
        href: 'https://dak.gg/genshin/profile/646322102?hl=en',
        icon: '/icons/genshin-impact.svg',
        color: '#C9A86A',
        colorDark: '#F2DFA7',
        category: 'Play & Hobbies',
        meta: 'Teo · America · UID 646322102',
        statsId: 'genshin',
        stats: statsSnapshots.genshin.stats,
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
        icon: '/icons/duolingo.svg',
        color: '#58CC02',
        category: 'Play & Hobbies',
        meta: '@sirteo',
        stats: [
            { label: 'Streak', value: '894 days' },
            { label: 'XP', value: '127,034' },
            { label: 'Courses', value: '5' },
        ],
    },
    {
        label: 'AllTrails',
        href: 'https://www.alltrails.com/members/teo-zeng',
        icon: '/icons/alltrails.svg',
        color: '#428813',
        colorDark: '#8CC63F',
        category: 'Play & Hobbies',
        meta: 'Hiking & trails',
    },
    {
        label: 'PlayStation',
        href: 'https://profile.playstation.com/masterteo1205',
        icon: '/icons/playstation.svg',
        color: '#0070D1',
        colorDark: '#4DA3E4',
        category: 'Play & Hobbies',
        meta: 'PSN: masterteo1205',
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
        label: 'Explainer videos',
        href: 'https://www.youtube.com/@teozeng3999/videos',
        icon: '/icons/youtube.svg',
        color: '#FF0000',
        category: 'Projects',
        meta: 'Animated explainers',
        description:
            'Visual deep dives into math, physics, machine learning and markets. Follow animated derivations and worked examples, built entirely from code.',
        tags: ['Math & physics', 'AI & ML', 'English & 中文'],
        preview: {
            launchLabel: 'Watch here',
            videos: [
                { id: 'o0ENWGEVJm0', title: 'How Large Language Models Work', image: '/previews/video-llm.webp' },
                { id: 'aaPbLBw0ZYc', title: 'Quantum Mechanics, Visualized', image: '/previews/video-quantum.webp' },
                { id: 'vdroXP5hjjQ', title: 'General Relativity, Derived', image: '/previews/video-relativity.webp' },
            ],
            image: '/previews/video-llm.webp',
            alt: 'Original thumbnail for How Large Language Models Work: The Transformer, Visualized',
            kind: 'Animated explainers',
            action: 'Watch on YouTube',
        },
    },
    {
        label: 'Crown & Clan',
        href: 'https://coc.teozeng.dev/',
        icon: '/icons/clashofclans.svg',
        color: '#E9A409',
        category: 'Projects',
        meta: 'Village-building strategy',
        description:
            'Build a village, train an army, and raid campaign maps. Upgrade your base and replay battles, with progress saved in your browser.',
        tags: ['Build a village', 'Campaign raids', 'Battle replays'],
        preview: {
            launchLabel: 'Explore the village',
            embedUrl: 'https://coc.teozeng.dev/',
            image: '/previews/crown-clan.webp',
            alt: 'An isometric village with a town hall, defenses, resource collectors and an army camp',
            kind: 'Village-building strategy',
            action: 'Build your village',
        },
    },
    {
        label: 'Summoner’s Rift',
        href: 'https://teozeng.dev/web-lol/',
        icon: '/icons/swords.svg',
        color: '#B68B3C',
        colorDark: '#E4BF72',
        category: 'Projects',
        meta: 'Browser MOBA · in progress',
        description:
            'Practice with Ashe or Lux, then play a lane match alongside bots. Fight through minion waves and towers on a recreation of Summoner’s Rift.',
        tags: ['Ashe & Lux', 'Practice mode', 'Lane matches'],
        preview: {
            launchLabel: 'Enter the Rift',
            embedUrl: 'https://teozeng.dev/web-lol/',
            image: '/previews/summoners-rift.webp',
            alt: 'Ashe at the blue fountain on the 3D Summoner’s Rift battlefield',
            kind: 'Browser MOBA',
            action: 'Enter the Rift',
            status: 'In progress',
        },
    },
    {
        label: 'San Andreas',
        href: 'https://teozeng.dev/web-gta/',
        icon: '/icons/car.svg',
        color: '#16A34A',
        colorDark: '#4ADE80',
        category: 'Projects',
        meta: 'Open-world recreation · in progress',
        description:
            'Explore San Andreas from Grove Street. Walk, drive, and fly through a continuous world that streams as you travel, right in your browser.',
        tags: ['Open world', 'Driving & flying', 'Grove Street'],
        preview: {
            launchLabel: 'Explore San Andreas',
            embedUrl: 'https://teozeng.dev/web-gta/',
            image: '/previews/san-andreas.webp',
            alt: 'Palm-lined Los Santos streets rendered in the browser recreation of San Andreas',
            kind: 'Open-world recreation',
            action: 'Explore San Andreas',
            status: 'In progress',
        },
    },
    {
        label: 'Web Chess',
        href: 'https://teozeng.dev/web-chess/',
        icon: '/icons/chess.svg',
        color: '#81B64C',
        category: 'Projects',
        meta: 'Chess · Stockfish analysis',
        description:
            'Play against Stockfish, import games, and review your moves with engine analysis. Explore alternative lines or pick up a saved game.',
        tags: ['Play the engine', 'Import games', 'Move review'],
        preview: {
            launchLabel: 'Explore the board',
            embedUrl:
                'https://teozeng.dev/web-chess/#game=cm5icWtibnIvcHBwcHBwcHAvOC84LzgvOC9QUFBQUFBQUC9STkJRS0JOUiB3IEtRa3EgLSAwIDF8ZDJkNCBkN2Q1IGMyYzQgZTdlNiBiMWMzIGc4ZjYgYzFnNSBmOGU3IGUyZTMgZThnOCBnMWYzIGg3aDYgZzVoNCBiN2I2IGYxZDMgYzhiNw',
            image: '/previews/chess.webp',
            alt: 'A Queen’s Gambit position with move arrows and Stockfish analysis',
            kind: 'Chess · Stockfish',
            action: 'Open the chessboard',
        },
    },
    {
        label: 'Web Xiangqi',
        href: 'https://teozeng.dev/web-xiangqi/',
        icon: '/icons/xiangqi.svg',
        color: '#DC2626',
        colorDark: '#F87171',
        category: 'Projects',
        meta: 'Chinese chess · Pikafish analysis',
        description:
            'Review annotated Xiangqi games, compare candidate moves, and play on from any position. Pikafish analysis helps you explore what could happen next.',
        tags: ['Chinese chess', 'Move comparisons', 'Game library'],
        preview: {
            launchLabel: 'Explore the board',
            embedUrl: 'https://teozeng.dev/web-xiangqi/#share=1&moves=h2e2%20h9g7%20h0g2%20b9c7',
            image: '/previews/xiangqi.webp',
            alt: 'A wooden Xiangqi board showing the Central Cannon opening and its move tree',
            kind: 'Xiangqi · Pikafish',
            action: 'Explore the board',
        },
    },
    {
        label: 'Web KaTrain',
        href: 'https://teozeng.dev/web-katrain/',
        icon: '/icons/go-board.svg',
        color: '#7C3AED',
        colorDark: '#A78BFA',
        category: 'Projects',
        meta: 'Go / Weiqi study',
        description:
            'Study Go with neural-network analysis, move-quality reviews, and ownership maps. Play against the engine or revisit mistakes from a game.',
        tags: ['Game analysis', 'Ownership maps', 'Practice mistakes'],
        preview: {
            launchLabel: 'Study this game',
            embedUrl:
                'https://teozeng.dev/web-katrain/#sgf=eJxNkr1u2zAYRXc_Bce2sA0paFok3pwGHuoigVPEA8FBEilbEv8kO04fv9EhEHk7ujjkd0nxy-rxVebZ-Si2G_HwFufiZFyzqBtfWDX79VfeZNntIs8W-Z2aPa_l5k1sG7XeyZ_x43svt8aIF6ODVfudvPvIfv-RP5a3avcov6nZy5PchO-bsPTmrB7k82AujXkX5l9lhni-Fy5czEnki_wmWwq2FpeT-NxzLq6aXRWbi6nVUq3WstdqtZe6GjlGOI5cmZGrBvawHflQjWz0yC1r637kklzX-DV8ID-OXJbkOBVsShy4bMhbuMXv8OlTpf17OMCpJ1wN-LDGsZwlMKuFG7hLnZnbMbcjL3BKPfm6Y1Y3Odow6zA5HffTkjdpLWe35JZZHvb4DselbnBz1SHALRxhS0-XnGLknrUDzkA-sE_knk_4kT6R3NMh0MGRO_6Lrac-BY7DKZKTZnH23rEP9x-4k8gbCLyHAEfuPHp8cg97_pHjLfkA8488ezqckJhZ3rIWDrwBz9uz5I5ZDt865sId-ZEOXa--_gd_PDLb',
            image: '/previews/katrain.webp',
            alt: 'Move 120 of Gu Li versus Lee Sedol, with a populated Go board and study tools',
            kind: 'Go / Weiqi study',
            action: 'Study a game',
        },
    },
]
