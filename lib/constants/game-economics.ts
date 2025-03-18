/**
 * Константы для экономической модели покерной платформы
 */
export const RAKE_PERCENTAGE = 10 // Процент комиссии от банка
export const TREASURY_POOL_PERCENTAGE = 5 // Процент, идущий в Treasury Pool
export const WINNER_PERCENTAGE = 85 // Процент, получаемый победителем

// Минимальная сумма банка для взятия рейка
export const MIN_POT_FOR_RAKE = 100

// Максимальный рейк с одного банка
export const MAX_RAKE_PER_POT = 10000

// Процент от рейка, идущий на джекпот (из доли системы)
export const JACKPOT_PERCENTAGE_FROM_RAKE = 10

// Процент от Treasury Pool на различные бонусные программы
export const DAILY_BONUS_ALLOCATION = 20 // На ежедневные бонусы
export const TOURNAMENT_ALLOCATION = 40 // На турниры
export const PROMOTION_ALLOCATION = 20 // На акции
export const LEADERBOARD_ALLOCATION = 20 // На лидерборды

