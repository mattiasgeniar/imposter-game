import type { CategoryWord, Round, Settings } from './types'

function randomInt(maxExclusive: number): number {
  return Math.floor(Math.random() * maxExclusive)
}

export function startRound(
  players: string[],
  selectedCategoryIds: string[],
  wordsByCategory: Record<string, CategoryWord[]>,
  settings: Settings,
): Round | null {
  const categoriesWithWords = selectedCategoryIds.filter(
    (id) => (wordsByCategory[id]?.length ?? 0) > 0,
  )
  if (categoriesWithWords.length === 0) return null

  const categoryId = categoriesWithWords[randomInt(categoriesWithWords.length)]
  const categoryWords = wordsByCategory[categoryId]
  const pick = categoryWords[randomInt(categoryWords.length)]

  const indices = [...Array(players.length).keys()]
  for (let i = indices.length - 1; i > 0; i--) {
    const j = randomInt(i + 1)
    ;[indices[i], indices[j]] = [indices[j], indices[i]]
  }
  const imposterCount = Math.max(1, Math.min(settings.imposterCount, players.length - 1))
  const imposterIndices = indices.slice(0, imposterCount).sort((a, b) => a - b)
  const starterIndex = randomInt(players.length)

  return {
    categoryId,
    categoryWords,
    word: pick.word,
    hint: pick.hint,
    imposterIndices,
    starterIndex,
    votes: players.map(() => null),
    tieRevoteAmong: null,
  }
}

export function tallyVotes(votes: (number | null)[], restrictTo: number[] | null): number[] {
  const counts = new Map<number, number>()
  for (const v of votes) {
    if (v === null) continue
    if (restrictTo && !restrictTo.includes(v)) continue
    counts.set(v, (counts.get(v) ?? 0) + 1)
  }
  let max = 0
  for (const n of counts.values()) max = Math.max(max, n)
  if (max === 0) return []
  const winners: number[] = []
  for (const [k, v] of counts.entries()) if (v === max) winners.push(k)
  return winners.sort((a, b) => a - b)
}
