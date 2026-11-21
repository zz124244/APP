/** Display reward amounts as whole units without changing their ledger value. */
export function cycleRewardInteger(value: string): string {
  const match = /^(0|[1-9][0-9]*)(?:\.[0-9]+)?$/.exec(value)
  return match?.[1] ?? value
}
