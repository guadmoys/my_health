import {
  cycleRepository,
  dailyStatsRepository,
  habitRepository,
  settingsRepository,
  wellbeingRepository,
  workoutSessionRepository,
} from '@/database/repositories'
import { computeCycleStats, isWithinFertileWindow } from '@/modules/cycle/cycle-stats'
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
  const [wellbeingToday, activeSession, activeHabits, cycleToday, cycleLogs, hidden] = await Promise.all([
    wellbeingRepository.getByDate(date),
    workoutSessionRepository.getActive(),
    habitRepository.getActive(),
    cycleRepository.getByDate(date),
    cycleRepository.getAll(),
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

  // Cycle pain uses the same safety framing as general discomfort (§3, §16),
  // and is a separate signal — someone may log high cycle pain without
  // toggling the general wellbeing discomfort checkbox.
  if (cycleToday?.pain !== undefined && cycleToday.pain >= 4) {
    rules.push({
      id: 'cycle-pain-no-progression',
      priority: 100,
      period: 'day',
      text: 'Отмечена сильная боль — не увеличивайте нагрузку, при необходимости отдохните.',
    })
  }

  const cycleStats = computeCycleStats(cycleLogs, date)
  if (cycleStats.predictedNextPeriod) {
    const daysUntilPeriod = Math.round(
      (new Date(cycleStats.predictedNextPeriod).getTime() - new Date(date).getTime()) / 86_400_000,
    )
    if (daysUntilPeriod >= 0 && daysUntilPeriod <= 2) {
      rules.push({
        id: 'cycle-period-soon',
        priority: 15,
        period: 'day',
        text: 'По оценке на основе ваших записей, скоро ожидается начало цикла.',
      })
    }
  }
  if (isWithinFertileWindow(cycleStats, date)) {
    rules.push({
      id: 'cycle-fertile-window',
      priority: 15,
      period: 'day',
      text: 'По оценке на основе ваших записей, сейчас возможное фертильное окно.',
    })
  }

  const stepsGoal = await settingsRepository.getValue<number | null>('stepsGoal', null)
  if (stepsGoal) {
    const stats = await dailyStatsRepository.getByDate(date)
    const steps = stats?.steps ?? 0
    if (steps < stepsGoal) {
      rules.push({
        id: 'steps-remaining',
        priority: 5,
        period: 'day',
        text: `До цели по шагам осталось: ${stepsGoal - steps}`,
      })
    }
  }

  return rules.filter((r) => !hidden.has(r.id)).sort((a, b) => b.priority - a.priority)
}
