import { routeChoice, type Vars } from '../features/scripting/engine/choice'
import type { ChoiceConfig } from '../features/scripting/types'

export type { Vars }

export function resolveChoice(choice: ChoiceConfig, ctx: Vars) {
  return routeChoice(ctx, choice)
}

export function resolveChoiceHandle(choice: ChoiceConfig, ctx: Vars): string | null {
  const { ruleId, target } = routeChoice(ctx, choice)
  if (ruleId) return ruleId
  if (target) return target
  return null
}
