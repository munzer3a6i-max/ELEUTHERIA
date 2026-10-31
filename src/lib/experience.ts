/*
  How long she was somewhere.

  The office types the years she was there -- 2024 to 2038 -- because that is
  what a passport, a contract and her own memory say. Everything downstream
  wants a number of years instead: the CV's period column, the total on her
  record, the website's cards. So the range is what is kept and shown, and the
  number is worked out from it rather than typed a second time and disagreed
  with.
*/

import type { ExperienceEntry } from '../types'

type Span = Pick<ExperienceEntry, 'fromYear' | 'toYear' | 'years'>

/** A year somebody could plausibly have worked in, and not a typo. */
export function isYear(value: number): boolean {
  return Number.isInteger(value) && value >= 1950 && value <= 2100
}

/** How many years a range covers, or 0 when it is not a range at all. */
export function spanYears(fromYear: number, toYear: number): number {
  if (!isYear(fromYear) || !isYear(toYear) || toYear < fromYear) return 0
  return toYear - fromYear
}

/** The range as the office typed it, or nothing when it never gave one. */
export function experienceSpan(entry: Span): string {
  return isYear(entry.fromYear) && isYear(entry.toYear) ? `${entry.fromYear} - ${entry.toYear}` : ''
}

/**
 * What to show for a period: the range when there is one, and the old count of
 * years when there is not, so an entry typed before this still reads properly.
 */
export function experiencePeriod(entry: Span, language: 'en' | 'ar' = 'en'): string {
  const span = experienceSpan(entry)
  if (span) return span
  if (entry.years > 0) return language === 'ar' ? `${entry.years} سنوات` : `${entry.years} ${entry.years === 1 ? 'year' : 'years'}`
  return ''
}
