export function onlyDigits(s: string): string {
  return s.replace(/\D/g, '')
}

export function maskCep(s: string): string {
  const d = onlyDigits(s).slice(0, 8)
  if (d.length <= 5) return d
  return `${d.slice(0, 5)}-${d.slice(5)}`
}

export function maskBRL(s: string): string {
  const d = onlyDigits(s)
  const noLeading = d.replace(/^0+(?=\d)/, '')
  const cents = (noLeading || '').padStart(3, '0')
  const intPart = cents.slice(0, -2)
  const decPart = cents.slice(-2)
  const intFormatted = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  return `R$ ${intFormatted},${decPart}`
}

export function parseBRL(s: string): number {
  const d = onlyDigits(s)
  if (!d) return 0
  const cents = Number(d)
  return cents / 100
}

export function formatBRL(n: number | null | undefined): string {
  const v = typeof n === 'number' ? n : 0
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)
}

export function formatDateBR(iso: string | null | undefined): string {
  if (!iso) return '-'
  return isoToDateBR(iso)
}

export function maskDateBR(s: string): string {
  const d = onlyDigits(s).slice(0, 8)
  const dd = d.slice(0, 2)
  const mm = d.slice(2, 4)
  const yyyy = d.slice(4, 8)
  let out = dd
  if (mm) out += `/${mm}`
  if (yyyy) out += `/${yyyy}`
  return out
}

export function parseDateBR(s: string): string | null {
  const d = onlyDigits(s)
  if (d.length !== 8) return null
  const dd = d.slice(0, 2)
  const mm = d.slice(2, 4)
  const yyyy = d.slice(4, 8)
  return `${yyyy}-${mm}-${dd}`
}

export function isoToDateBR(iso: string): string {
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!m) return ''
  const [, yyyy, mm, dd] = m
  return `${dd}/${mm}/${yyyy}`
}
