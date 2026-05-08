export function getExtraData(): Record<string, any> {
  if (document.getElementById('app-root')) {
    return {}
  }
  const jsonElement = document.querySelector('#blessing-extra')
  /* istanbul ignore next */
  if (jsonElement) {
    return JSON.parse(jsonElement.textContent ?? '{}')
  } else {
    return {}
  }
}

blessing.extra = getExtraData()
