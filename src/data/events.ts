import type { GliderEvent } from '../types'

const now = Date.now()
const hours = (h: number) => new Date(now + h * 3600_000).toISOString()

export const sampleEvents: GliderEvent[] = [
  {
    id: 'glider-ama-01',
    title: 'Glider Core AMA: Roadmap & Vision',
    description:
      'Meet the Glider core contributors as they walk through the Q2 roadmap, network milestones and answer community questions live.',
    host: 'Glider Core Team',
    category: 'AMA',
    startsAt: hours(-0.25),
    durationMinutes: 90,
    link: 'https://x.com/glider_fi',
    location: 'X Spaces',
    tags: ['official', 'roadmap'],
    accent: 'mint',
  },
  {
    id: 'glider-quiz-02',
    title: 'Glider Trivia Night #14',
    description:
      'Weekly community trivia with prizes for top 3 scorers. Test your Glider knowledge across protocol, tooling and history.',
    host: '@glider_community',
    category: 'Quiz',
    startsAt: hours(6),
    durationMinutes: 60,
    link: 'https://discord.gg/xDy7M6xNPR',
    location: 'Discord',
    tags: ['prizes', 'weekly'],
    accent: 'sky',
  },
  {
    id: 'glider-workshop-03',
    title: 'Build on Glider: Your First dApp',
    description:
      'A hands-on workshop walking through scaffolding, deploying and verifying your first dApp on Glider.',
    host: 'Glider DevRel',
    category: 'Workshop',
    startsAt: hours(26),
    durationMinutes: 120,
    link: 'https://lu.ma/glider-workshop',
    location: 'Luma',
    tags: ['dev', 'beginner'],
    accent: 'olive',
  },
  {
    id: 'glider-hack-04',
    title: 'Glider Global Hackathon Kickoff',
    description:
      'Kickoff for the 3-week global hackathon with $100k in prizes across DeFi, infra and consumer tracks.',
    host: 'Glider Foundation',
    category: 'Hackathon',
    startsAt: hours(72),
    durationMinutes: 180,
    link: 'https://glider.fi/r/v9t1x8jy',
    location: 'Online',
    tags: ['hackathon', 'prizes'],
    accent: 'mint',
  },
  {
    id: 'glider-meetup-05',
    title: 'Glider Meetup — Lagos',
    description:
      'In-person meetup for Glider builders and community members in Lagos. Lightning talks, networking and swag.',
    host: 'Glider Lagos',
    category: 'Meetup',
    startsAt: hours(120),
    durationMinutes: 240,
    link: 'https://lu.ma/glider-lagos',
    location: 'Lagos, Nigeria',
    tags: ['irl', 'africa'],
    accent: 'sky',
  },
  {
    id: 'glider-launch-06',
    title: 'Glider Bridge v2 Launch Stream',
    description:
      'Livestream unveiling Glider Bridge v2 with faster finality and new supported chains.',
    host: 'Glider Labs',
    category: 'Launch',
    startsAt: hours(-48),
    durationMinutes: 60,
    link: 'https://youtube.com/@glider',
    location: 'YouTube',
    tags: ['product', 'launch'],
    accent: 'olive',
  },
  {
    id: 'glider-ama-07',
    title: 'Ecosystem Spotlight: Partner AMA',
    description:
      'Monthly partner spotlight featuring projects building on Glider. This month: three featured guests.',
    host: '@glider_ecosystem',
    category: 'AMA',
    startsAt: hours(-120),
    durationMinutes: 75,
    link: 'https://x.com/glider_fi',
    location: 'X Spaces',
    tags: ['ecosystem'],
    accent: 'mint',
  },
  {
    id: 'glider-workshop-08',
    title: 'Smart Contract Security 101',
    description:
      'Security best practices for builders deploying on Glider. Audit checklists, common pitfalls, and live code review.',
    host: 'Glider Security WG',
    category: 'Workshop',
    startsAt: hours(50),
    durationMinutes: 90,
    link: 'https://lu.ma/glider-sec',
    location: 'Zoom',
    tags: ['security', 'dev'],
    accent: 'sky',
  },
]
