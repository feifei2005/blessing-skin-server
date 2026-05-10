interface I18nTable {
  [key: string]: string | I18nTable | undefined
}

let i18nTable: I18nTable = (blessing.i18n as I18nTable) || {}

export function setI18n(table: I18nTable) {
  i18nTable = table
  blessing.i18n = table
}

export async function loadI18n(locale: string): Promise<void> {
  const baseUrl = process.env.REACT_APP_API_BASE || blessing.base_url || ''
  for (const lang of [locale, 'en']) {
    try {
      const resp = await fetch(`${baseUrl}/api/i18n/${lang}`)
      if (resp.ok) {
        const data = await resp.json()
        setI18n(data)
        return
      }
    } catch {
      // Continue to next fallback
    }
  }
}

export function t(
  key: string,
  parameters = Object.create(null) as Record<string, string>,
): string {
  const segments = key.split('.')
  let temp = i18nTable
  let result = ''

  for (const segment of segments) {
    /* istanbul ignore next */
    const middle = temp?.[segment]
    if (!middle) {
      return key
    }
    if (typeof middle === 'string') {
      result = middle
    } else {
      temp = middle
    }
  }

  Object.keys(parameters).forEach(
    (slot) => (result = result.replace(`:${slot}`, parameters[slot]!)),
  )

  return result
}

Object.assign(window, { trans: t })
Object.assign(blessing, { t })
