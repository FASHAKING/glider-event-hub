import { useMemo } from 'react'
import { useAuth } from '../context/AuthContext'
import type { GliderEvent, UserAccount, BadgeId } from '../types'
import { BADGES, computeScore } from '../types'

interface Props {
  events: GliderEvent[]
  onSignUpClick: () => void
}

/* ------------------------------------------------------------------ */
/* Rank helpers                                                        */
/* ------------------------------------------------------------------ */

interface RankedUser {
  user: UserAccount
  score: number
  rank: number
  eventCount: number
  badgeCount: number
}

function rankUsers(users: UserAccount[]): RankedUser[] {
  return users
    .map((u) => ({
      user: u,
      score: computeScore(u),
      rank: 0,
      eventCount: u.attendedEvents?.length || 0,
      badgeCount: u.earnedBadges?.length || 0,
    }))
    .sort((a, b) => b.score - a.score)
    .map((r, i) => ({ ...r, rank: i + 1 }))
}

/* ------------------------------------------------------------------ */
/* Sub-components                                                      */
/* ------------------------------------------------------------------ */

const medalColors: Record<number, { bg: string; border: string; text: string; shadow: string }> = {
  1: {
    bg: 'from-yellow-400/20 via-yellow-300/10 to-transparent dark:from-yellow-500/20 dark:via-yellow-500/5 dark:to-transparent',
    border: 'border-yellow-400/60 dark:border-yellow-500/40',
    text: 'text-yellow-600 dark:text-yellow-400',
    shadow: 'shadow-[0_0_40px_-10px_rgba(234,179,8,0.3)]',
  },
  2: {
    bg: 'from-gray-300/30 via-gray-200/10 to-transparent dark:from-gray-400/15 dark:via-gray-400/5 dark:to-transparent',
    border: 'border-gray-300/60 dark:border-gray-500/40',
    text: 'text-gray-500 dark:text-gray-400',
    shadow: '',
  },
  3: {
    bg: 'from-orange-400/20 via-orange-300/10 to-transparent dark:from-orange-500/15 dark:via-orange-500/5 dark:to-transparent',
    border: 'border-orange-400/50 dark:border-orange-500/30',
    text: 'text-orange-600 dark:text-orange-400',
    shadow: '',
  },
}

const medalEmoji: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' }

function PodiumCard({ ranked, index }: { ranked: RankedUser; index: number }) {
  const colors = medalColors[ranked.rank] || medalColors[3]
  const isFirst = ranked.rank === 1

  return (
    <div
      className={`relative bg-gradient-to-b ${colors.bg} border ${colors.border}
        rounded-2xl p-5 pt-8 text-center transition-all duration-500 ${colors.shadow}
        hover:scale-[1.03] hover:-translate-y-1`}
      style={{ animationDelay: `${index * 120}ms` }}
    >
      {/* Medal */}
      <div className={`absolute -top-4 left-1/2 -translate-x-1/2 text-3xl ${isFirst ? 'text-4xl' : ''}`}>
        {medalEmoji[ranked.rank]}
      </div>

      {/* Rank number */}
      <div className={`text-xs font-bold uppercase tracking-widest ${colors.text} mb-3`}>
        #{ranked.rank}
      </div>

      {/* Avatar */}
      <div
        className={`mx-auto ${isFirst ? 'w-16 h-16 text-xl' : 'w-12 h-12 text-base'}
          rounded-full bg-glider-mint/40 dark:bg-glider-mint/15
          border-2 ${colors.border}
          flex items-center justify-center font-display font-bold
          text-glider-olive dark:text-glider-mint mb-3 overflow-hidden`}
      >
        {ranked.user.avatarUrl ? (
          <img src={ranked.user.avatarUrl} alt={ranked.user.username} className="w-full h-full object-cover" />
        ) : (
          ranked.user.username.slice(0, 1).toUpperCase()
        )}
      </div>

      {/* Username */}
      <div className="font-display font-bold text-glider-black dark:text-glider-darkText text-base mb-1 truncate">
        {ranked.user.username}
      </div>

      {/* Stats */}
      <div className="flex items-center justify-center gap-3 text-xs text-glider-gray dark:text-glider-darkMuted mb-3">
        <span>{ranked.eventCount} event{ranked.eventCount !== 1 ? 's' : ''}</span>
        <span className="w-1 h-1 rounded-full bg-glider-gray/40 dark:bg-glider-darkMuted/40" />
        <span>{ranked.badgeCount} badge{ranked.badgeCount !== 1 ? 's' : ''}</span>
      </div>

      {/* Badges row */}
      {ranked.user.earnedBadges && ranked.user.earnedBadges.length > 0 && (
        <div className="flex justify-center gap-1 flex-wrap mb-3">
          {ranked.user.earnedBadges.slice(0, 5).map((bid) => {
            const badge = BADGES.find((b) => b.id === bid)
            return badge ? (
              <span key={bid} title={badge.label} className="text-sm">
                {badge.emoji}
              </span>
            ) : null
          })}
          {ranked.user.earnedBadges.length > 5 && (
            <span className="text-xs text-glider-gray dark:text-glider-darkMuted">
              +{ranked.user.earnedBadges.length - 5}
            </span>
          )}
        </div>
      )}

      {/* Score */}
      <div className={`font-display font-bold ${isFirst ? 'text-2xl' : 'text-lg'} ${colors.text}`}>
        {ranked.score}
        <span className="text-xs ml-1 font-normal opacity-70">pts</span>
      </div>
    </div>
  )
}

function RankRow({ ranked, isCurrentUser }: { ranked: RankedUser; isCurrentUser: boolean }) {
  return (
    <tr
      className={`transition hover:bg-glider-light/50 dark:hover:bg-glider-darkPanel2/50 ${
        isCurrentUser
          ? 'bg-glider-mint/10 dark:bg-glider-mint/5 ring-1 ring-inset ring-glider-mint/30'
          : ''
      }`}
    >
      <td className="px-4 py-3 text-center">
        <span
          className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${
            ranked.rank <= 3
              ? 'bg-glider-olive/20 text-glider-olive dark:bg-glider-mint/15 dark:text-glider-mint'
              : 'text-glider-gray dark:text-glider-darkMuted'
          }`}
        >
          {ranked.rank <= 3 ? medalEmoji[ranked.rank] : ranked.rank}
        </span>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-glider-mint/30 dark:bg-glider-mint/15 border border-glider-mint/40 dark:border-glider-mint/20 flex items-center justify-center font-display text-xs font-bold text-glider-olive dark:text-glider-mint shrink-0 overflow-hidden">
            {ranked.user.avatarUrl ? (
              <img src={ranked.user.avatarUrl} alt={ranked.user.username} className="w-full h-full object-cover" />
            ) : (
              ranked.user.username.slice(0, 1).toUpperCase()
            )}
          </div>
          <div>
            <span className="font-semibold text-sm text-glider-black dark:text-glider-darkText">
              {ranked.user.username}
            </span>
            {isCurrentUser && (
              <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded-full bg-glider-mint/30 dark:bg-glider-mint/15 text-glider-olive dark:text-glider-mint font-semibold">
                YOU
              </span>
            )}
          </div>
        </div>
      </td>
      <td className="px-4 py-3 text-center text-sm text-glider-black dark:text-glider-darkText tabular-nums">
        {ranked.eventCount}
      </td>
      <td className="px-4 py-3">
        <div className="flex gap-0.5 justify-center flex-wrap">
          {ranked.user.earnedBadges && ranked.user.earnedBadges.length > 0 ? (
            ranked.user.earnedBadges.map((bid) => {
              const badge = BADGES.find((b) => b.id === bid)
              return badge ? (
                <span key={bid} title={badge.label} className="text-sm cursor-default">
                  {badge.emoji}
                </span>
              ) : null
            })
          ) : (
            <span className="text-xs text-glider-gray dark:text-glider-darkMuted">—</span>
          )}
        </div>
      </td>
      <td className="px-4 py-3 text-center">
        <span className="font-display font-bold text-sm text-glider-olive dark:text-glider-mint tabular-nums">
          {ranked.score}
        </span>
      </td>
    </tr>
  )
}

function BadgeCard({ badge, earned }: { badge: (typeof BADGES)[number]; earned: boolean }) {
  return (
    <div
      className={`relative rounded-xl border p-4 text-center transition-all duration-300 ${
        earned
          ? 'bg-glider-mint/10 dark:bg-glider-mint/5 border-glider-mint/40 dark:border-glider-mint/20 hover:scale-[1.04]'
          : 'bg-glider-light/50 dark:bg-glider-darkPanel2/50 border-glider-border dark:border-glider-darkBorder opacity-50 grayscale'
      }`}
    >
      <div className={`text-3xl mb-2 ${earned ? '' : 'grayscale'}`}>{badge.emoji}</div>
      <div className="font-display font-bold text-sm text-glider-black dark:text-glider-darkText mb-0.5">
        {badge.label}
      </div>
      <div className="text-[11px] text-glider-gray dark:text-glider-darkMuted leading-tight">
        {badge.description}
      </div>
      <div
        className={`mt-2 text-[10px] font-bold tracking-wider uppercase ${
          earned
            ? 'text-glider-olive dark:text-glider-mint'
            : 'text-glider-gray/60 dark:text-glider-darkMuted/60'
        }`}
      >
        {earned ? '✓ EARNED' : `+${badge.points} pts`}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Main Component                                                      */
/* ------------------------------------------------------------------ */

export default function LeaderboardPage({ events, onSignUpClick }: Props) {
  const { user, allUsers } = useAuth()

  const ranked = useMemo(() => rankUsers(allUsers), [allUsers])
  const top3 = ranked.slice(0, 3)

  // Event title lookup for activity display
  const eventMap = useMemo(() => {
    const map: Record<string, GliderEvent> = {}
    for (const e of events) map[e.id] = e
    return map
  }, [events])

  const earnedSet = useMemo<Set<BadgeId>>(
    () => new Set(user?.earnedBadges || []),
    [user],
  )

  if (ranked.length === 0) {
    return (
      <section className="px-5 lg:px-10 py-12 text-center">
        <div className="max-w-lg mx-auto card p-10">
          <div className="text-5xl mb-4">🏆</div>
          <h2 className="font-display text-2xl font-bold text-glider-black dark:text-glider-darkText mb-2">
            Leaderboard
          </h2>
          <p className="text-glider-gray dark:text-glider-darkMuted mb-6">
            No one has joined yet. Be the first to sign up, attend events, and earn badges!
          </p>
          <button onClick={onSignUpClick} className="btn-primary text-sm">
            Sign Up & Start Earning
          </button>
        </div>
      </section>
    )
  }

  return (
    <section className="px-5 lg:px-10 py-8 space-y-10">
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-glider-olive/10 dark:bg-glider-mint/10 border border-glider-olive/20 dark:border-glider-mint/20 text-xs font-semibold text-glider-olive dark:text-glider-mint uppercase tracking-wider mb-3">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M8 21h8M12 17v4M7 4h10v4a5 5 0 01-10 0V4z" />
            <path d="M17 6h3v2a3 3 0 01-3 3M7 6H4v2a3 3 0 003 3" />
          </svg>
          Community Leaderboard
        </div>
        <h1 className="font-display text-3xl sm:text-4xl font-bold text-glider-black dark:text-glider-darkText">
          Top Contributors
        </h1>
        <p className="mt-2 text-glider-gray dark:text-glider-darkMuted max-w-md mx-auto">
          Attend events, earn badges, and climb the ranks. Every event attended earns you 5 points plus bonus badge rewards.
        </p>
      </div>

      {/* Podium */}
      {top3.length > 0 && (
        <div className={`grid gap-5 max-w-3xl mx-auto ${
          top3.length === 1 ? 'grid-cols-1 max-w-xs' :
          top3.length === 2 ? 'grid-cols-2 max-w-lg' :
          'grid-cols-1 sm:grid-cols-3'
        }`}>
          {/* On desktop: show in order 2, 1, 3 for visual podium effect */}
          {top3.length >= 3 ? (
            <>
              <div className="sm:mt-8">
                <PodiumCard ranked={top3[1]} index={1} />
              </div>
              <div>
                <PodiumCard ranked={top3[0]} index={0} />
              </div>
              <div className="sm:mt-12">
                <PodiumCard ranked={top3[2]} index={2} />
              </div>
            </>
          ) : (
            top3.map((r, i) => (
              <div key={r.user.id}>
                <PodiumCard ranked={r} index={i} />
              </div>
            ))
          )}
        </div>
      )}

      {/* Your stats (if signed in) */}
      {user && (
        <div className="max-w-3xl mx-auto">
          <div className="card p-5 flex flex-col sm:flex-row items-center gap-5">
            <div className="w-14 h-14 rounded-full bg-glider-mint/40 dark:bg-glider-mint/15 border-2 border-glider-mint dark:border-glider-mint/30 flex items-center justify-center font-display text-xl font-bold text-glider-olive dark:text-glider-mint shrink-0 overflow-hidden">
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.username} className="w-full h-full object-cover" />
              ) : (
                user.username.slice(0, 1).toUpperCase()
              )}
            </div>
            <div className="flex-1 text-center sm:text-left">
              <div className="font-display font-bold text-lg text-glider-black dark:text-glider-darkText">
                {user.username}
              </div>
              <div className="text-xs text-glider-gray dark:text-glider-darkMuted">
                Rank #{ranked.find((r) => r.user.id === user.id)?.rank || '—'} · Joined{' '}
                {new Date(user.createdAt).toLocaleDateString()}
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="font-display font-bold text-lg text-glider-olive dark:text-glider-mint">
                  {user.attendedEvents?.length || 0}
                </div>
                <div className="text-[10px] uppercase tracking-wider text-glider-gray dark:text-glider-darkMuted">
                  Events
                </div>
              </div>
              <div>
                <div className="font-display font-bold text-lg text-glider-olive dark:text-glider-mint">
                  {user.earnedBadges?.length || 0}
                </div>
                <div className="text-[10px] uppercase tracking-wider text-glider-gray dark:text-glider-darkMuted">
                  Badges
                </div>
              </div>
              <div>
                <div className="font-display font-bold text-lg text-glider-olive dark:text-glider-mint">
                  {computeScore(user)}
                </div>
                <div className="text-[10px] uppercase tracking-wider text-glider-gray dark:text-glider-darkMuted">
                  Score
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recent Activity */}
      {user && user.attendedEvents && user.attendedEvents.length > 0 && (
        <div className="max-w-3xl mx-auto">
          <h3 className="font-display font-bold text-lg text-glider-black dark:text-glider-darkText mb-3 flex items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-glider-olive dark:text-glider-mint">
              <circle cx="12" cy="12" r="9" />
              <path d="M12 7v5l3 3" />
            </svg>
            Your Activity
          </h3>
          <div className="space-y-2">
            {user.attendedEvents.slice(-5).reverse().map((eid) => {
              const event = eventMap[eid]
              return (
                <div
                  key={eid}
                  className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-white dark:bg-glider-darkPanel border border-glider-border dark:border-glider-darkBorder"
                >
                  <span className="text-glider-olive dark:text-glider-mint text-sm">✓</span>
                  <span className="flex-1 text-sm text-glider-black dark:text-glider-darkText truncate">
                    {event?.title || eid}
                  </span>
                  {event && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-glider-mint/20 dark:bg-glider-mint/10 text-glider-olive dark:text-glider-mint font-semibold uppercase">
                      {event.category}
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Full ranking table */}
      {ranked.length > 0 && (
        <div className="max-w-3xl mx-auto">
          <h3 className="font-display font-bold text-lg text-glider-black dark:text-glider-darkText mb-3">
            Full Rankings
          </h3>
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-glider-border dark:border-glider-darkBorder bg-glider-light/50 dark:bg-glider-darkPanel2/50">
                    <th className="px-4 py-3 text-[10px] uppercase tracking-wider text-glider-gray dark:text-glider-darkMuted font-semibold text-center w-16">
                      Rank
                    </th>
                    <th className="px-4 py-3 text-[10px] uppercase tracking-wider text-glider-gray dark:text-glider-darkMuted font-semibold text-left">
                      User
                    </th>
                    <th className="px-4 py-3 text-[10px] uppercase tracking-wider text-glider-gray dark:text-glider-darkMuted font-semibold text-center w-20">
                      Events
                    </th>
                    <th className="px-4 py-3 text-[10px] uppercase tracking-wider text-glider-gray dark:text-glider-darkMuted font-semibold text-center">
                      Badges
                    </th>
                    <th className="px-4 py-3 text-[10px] uppercase tracking-wider text-glider-gray dark:text-glider-darkMuted font-semibold text-center w-20">
                      Score
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-glider-border dark:divide-glider-darkBorder">
                  {ranked.map((r) => (
                    <RankRow
                      key={r.user.id}
                      ranked={r}
                      isCurrentUser={r.user.id === user?.id}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Badge Showcase */}
      <div className="max-w-3xl mx-auto">
        <h3 className="font-display font-bold text-lg text-glider-black dark:text-glider-darkText mb-1">
          Badge Collection
        </h3>
        <p className="text-sm text-glider-gray dark:text-glider-darkMuted mb-4">
          {user
            ? `You've earned ${earnedSet.size} of ${BADGES.length} badges. Keep attending events!`
            : 'Sign up and attend events to start earning badges.'}
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {BADGES.map((badge) => (
            <BadgeCard key={badge.id} badge={badge} earned={earnedSet.has(badge.id)} />
          ))}
        </div>
      </div>

      {/* CTA for non-logged-in users */}
      {!user && (
        <div className="max-w-3xl mx-auto text-center">
          <div className="card p-8 bg-gradient-to-br from-glider-mint/10 via-transparent to-glider-olive/5 dark:from-glider-mint/5 dark:to-glider-olive/5">
            <h3 className="font-display font-bold text-xl text-glider-black dark:text-glider-darkText mb-2">
              Ready to join the leaderboard?
            </h3>
            <p className="text-sm text-glider-gray dark:text-glider-darkMuted mb-4">
              Create an account, attend events, and earn badges to climb the ranks.
            </p>
            <button onClick={onSignUpClick} className="btn-primary text-sm">
              Sign Up Now
            </button>
          </div>
        </div>
      )}
    </section>
  )
}
