import { habitRepository, settingsRepository, wellbeingRepository, workoutSessionRepository } from '@/database/repositories'
import { today } from '@/utils/date'

/**
 * The local rule engine (§24): plain, transparent conditions computed from
 * the local DB — no hidden model, no auto-tuning. Rules never change data on
 * their own; they only surface a message the user can dismiss.
 */
export interface Rule {
  id: string
  priority: number
  /** How long a dismissal sticks: 'day' resets tomorrow, 'once' is permanent. */
  period: 'day' | 'once'
  text: string
}

async function dismissedIds(): Promise<Set<string>> {
  const dismissed = await settingsRepository.getValue<Record<string, string>>('dismissedRules', {})
  const list = Object.entries(dismissed)
    // A 'day'-period dismissal is keyed by the date it was dismissed on, so
    // it naturally stops applying once that date is no longer today.
    .filter(([, dismissedOn]) => dismissedOn === 'once' || dismissedOn === today())
    .map(([id]) => id)
  return new Set(list)
}

export async function dismissRule(rule: Pick<Rule, 'id' | 'period'>): Promise<void> {
  const dismissed = await settingsRepository.getValue<Record<string, string>>('dismissedRules', {})
  dismissed[rule.id] = rule.period === 'once' ? 'once' : today()
  await settingsRepository.setValue('dismissedRules', dismissed)
}

export async function evaluateRules(): Promise<Rule[]> {
  const date = today()
  const [wellbeingToday, activeSession, activeHabits, hidden] = await Promise.all([
    wellbeingRepository.getByDate(date),
    workoutSessionRepository.getActive(),
    habitRepository.getActive(),
    dismissedIds(),
  ])

  const rules: Rule[] = []

  // Safety rule (§3, §16): never suggest more load when discomfort is marked.
  if (wellbeingToday?.discomfort) {
    rules.push({
      id: 'discomfort-no-progression',
      priority: 100,
      period: 'day',
      text: 'Отмечен дискомфорт — не увеличивайте нагрузку, при необходимости снизьте её или отдохните.',
    })
  }

  if (activeSession) {
    rules.push({
      id: 'resume-workout',
      priority: 80,
      period: 'day',
      text: 'У вас есть незавершённая тренировка.',
    })
  }

  const dailyHabits = activeHabits.filter((h) => h.schedule === 'daily')
  if (dailyHabits.length) {
    const doneStates = await Promise.all(
      dailyHabits.map((h) => habitRepository.getLogForDate(h.id, date)),
    )
    const remaining = dailyHabits.filter((_, i) => !doneStates[i]?.completed).length
    if (remaining > 0) {
      rules.push({
        id: 'daily-habits-remaining',
        priority: 10,
        period: 'day',
        text: `Осталось привычек на сегодня: ${remaining}`,
      })
    }
  }

  return rules.filter((r) => !hidden.has(r.id)).sort((a, b) => b.priority - a.priority)
}
