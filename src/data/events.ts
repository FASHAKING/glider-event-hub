import type { GlideEvent } from '../types'

const now = Date.now()
const hours = (h: number) => new Date(now + h * 3600_000).toISOString()

export const sampleEvents: GlideEvent[] = [
  {
    id: 'glide-ama-01',
    title: 'Glide Core AMA: Roadmap & Vision',
    description:
      'Meet the Glide core contributors as they walk through the Q2 roadmap, network milestones and answer community questions live.',
    host: 'Glide Core Team',
    category: 'AMA',
    startsAt: hours(-0.25),
    durationMinutes: 90,
    link: 'https://x.com/i/spaces/glide-ama',
    location: 'X Spaces',
    tags: ['official', 'roadmap'],
  },
  {
    id: 'glide-quiz-02',
    title: 'Glide Trivia Night #14',
    description:
      'Weekly community trivia with prizes for top 3 scorers. Test your Glide knowledge across protocol, tooling and history.',
    host: '@glide_community',
    category: 'Quiz',
    startsAt: hours(6),
    durationMinutes: 60,
    link: 'https://discord.gg/glide',
    location: 'Discord',
    tags: ['prizes', 'weekly'],
  },
  {
    id: 'glide-workshop-03',
    title: 'Build on Glide: Your First dApp',
    description:
      'A hands-on workshop walking through scaffolding, deploying and verifying your first dApp on Glide.',
    host: 'Glide DevRel',
    category: 'Workshop',
    startsAt: hours(26),
    durationMinutes: 120,
    link: 'https://lu.ma/glide-workshop',
    location: 'Luma',
    tags: ['dev', 'beginner'],
  },
  {
    id: 'glide-hack-04',
    title: 'Glide Global Hackathon Kickoff',
    description:
      'Kickoff for the 3-week global hackathon with $100k in prizes across DeFi, infra and consumer tracks.',
    host: 'Glide Foundation',
    category: 'Hackathon',
    startsAt: hours(72),
    durationMinutes: 180,
    link: 'https://glide.xyz/hackathon',
    location: 'Online',
    tags: ['hackathon', 'prizes'],
  },
  {
    id: 'glide-meetup-05',
    title: 'Glide Meetup — Lagos',
    description:
      'In-person meetup for Glide builders and community members in Lagos. Lightning talks, networking and swag.',
    host: 'Glide Lagos',
    category: 'Meetup',
    startsAt: hours(120),
    durationMinutes: 240,
    link: 'https://lu.ma/glide-lagos',
    location: 'Lagos, Nigeria',
    tags: ['irl', 'africa'],
  },
  {
    id: 'glide-launch-06',
    title: 'Glide Bridge v2 Launch Stream',
    description:
      'Livestream unveiling Glide Bridge v2 with faster finality and new supported chains.',
    host: 'Glide Labs',
    category: 'Launch',
    startsAt: hours(-48),
    durationMinutes: 60,
    link: 'https://youtube.com/@glide',
    location: 'YouTube',
    tags: ['product', 'launch'],
  },
  {
    id: 'glide-ama-07',
    title: 'Ecosystem Spotlight: Partner AMA',
    description:
      'Monthly partner spotlight featuring projects building on Glide. This month: three featured guests.',
    host: '@glide_ecosystem',
    category: 'AMA',
    startsAt: hours(-120),
    durationMinutes: 75,
    link: 'https://x.com/i/spaces/glide-partner',
    location: 'X Spaces',
    tags: ['ecosystem'],
  },
]
