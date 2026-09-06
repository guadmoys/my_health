import dayjs from 'dayjs'

import type { DateString, DateTimeString } from '@/database/types'

export const DATE_FORMAT = 'YYYY-MM-DD'

export function today(): DateString {
  return dayjs().format(DATE_FORMAT)
}

export function nowIso(): DateTimeString {
  return dayjs().toISOString()
}

export function toDateString(value: dayjs.ConfigType): DateString {
  return dayjs(value).format(DATE_FORMAT)
}
