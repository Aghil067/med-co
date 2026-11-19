export const readingNames = {
  heart_rate: 'Heart rate',
  oxygen_saturation: 'Blood oxygen',
  stress_level: 'Stress score',
  steps: 'Steps',
  fall_detected: 'Fall signal',
}

export function readingCsv(readings) {
  const escape = value => {
    const text = String(value ?? '')
    const safe = typeof value !== 'number' && /^[\s]*[=+@-]|^[\t\r\n]/.test(text) ? `'${text}` : text
    return `"${safe.replaceAll('"', '""')}"`
  }
  return [
    ['timestamp_utc', 'metric', 'value', 'unit', 'source'],
    ...readings.map(row => [row.recordedAt, row.metricType, row.value, row.unit, row.source]),
  ].map(row => row.map(escape).join(',')).join('\r\n')
}

export function downloadCsv(filename, content) {
  const url = URL.createObjectURL(new Blob([content], { type: 'text/csv;charset=utf-8' }))
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
