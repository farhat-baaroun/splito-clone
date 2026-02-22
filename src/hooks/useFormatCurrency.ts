import { useMemo } from 'react'

export function useFormatCurrency(currency = 'USD') {
  return useMemo(() => {
    const locale = typeof navigator !== 'undefined' ? navigator.language : 'en-US'
    return (amount: number) =>
      new Intl.NumberFormat(locale, {
        style: 'currency',
        currency,
        minimumFractionDigits: 2,
      }).format(amount)
  }, [currency])
}
