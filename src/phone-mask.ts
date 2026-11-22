export function maskRegisteredPhone(value: string): string {
  const phone = value.trim()
  const match = phone.match(/^(\+86)([0-9]{3})([0-9]{4})([0-9]{4})$/)
  return match ? `${match[1]}${match[2]}****${match[4]}` : phone
}
