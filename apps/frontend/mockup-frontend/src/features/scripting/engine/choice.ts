import type { ChoiceConfig, Clause, Group, Rule } from '../types'

export type Vars = Record<string, unknown>

function ensureArray(value: unknown): any[] {
  if (Array.isArray(value)) return value
  if (value === null || value === undefined) return []
  return [value]
}

export function evalClause(vars: Vars, clause: Clause): boolean {
  const left = (vars ?? {})[clause.variable]
  const operator = clause.operator

  switch (clause.type) {
    case 'string': {
      if (typeof left !== 'string') return false
      const cmp = String(clause.value ?? '')
      switch (operator) {
        case 'equals': return left === cmp
        case 'notEquals': return left !== cmp
        case 'contains': return left.includes(cmp)
        case 'notContains': return !left.includes(cmp)
        case 'startsWith': return left.startsWith(cmp)
        case 'endsWith': return left.endsWith(cmp)
        default: return false
      }
    }
    case 'number':
    case 'date': {
      const leftNum = Number(left)
      const rightNum = Number(clause.value)
      if (!Number.isFinite(leftNum) || !Number.isFinite(rightNum)) return false
      switch (operator) {
        case '>': return leftNum > rightNum
        case '>=': return leftNum >= rightNum
        case '<': return leftNum < rightNum
        case '<=': return leftNum <= rightNum
        case '=': return leftNum === rightNum
        case '!=': return leftNum !== rightNum
        default: return false
      }
    }
    case 'boolean': {
      const boolVal = Boolean(left)
      if (operator === 'isTrue') return boolVal === true
      if (operator === 'isFalse') return boolVal === false
      return false
    }
    case 'array': {
      const leftArr = Array.isArray(left) ? left : ensureArray(left)
      const rightArr = ensureArray(clause.value)
      switch (operator) {
        case 'includes':
          return rightArr.every((item) => leftArr.includes(item))
        case 'notIncludes':
          return rightArr.every((item) => !leftArr.includes(item))
        case 'intersects':
          return leftArr.some((item) => rightArr.includes(item))
        case 'notIntersects':
          return !leftArr.some((item) => rightArr.includes(item))
        default:
          return false
      }
    }
    default:
      return false
  }
}

function evalRule(vars: Vars, rule: Rule): boolean {
  if (!Array.isArray(rule.clauses) || rule.clauses.length === 0) return false
  return rule.clauses.every((clause) => evalClause(vars, clause))
}

function evalGroup(vars: Vars, group: Group): boolean {
  if (!Array.isArray(group.rules) || group.rules.length === 0) return false
  return group.rules.every((rule) => evalRule(vars, rule))
}

export function routeChoice(vars: Vars, cfg: ChoiceConfig): { groupId?: string; ruleId?: string; target?: string | null } {
  for (const group of cfg.groups ?? []) {
    if (!evalGroup(vars, group)) continue

    const firstRuleWithTarget = (group.rules ?? []).find((rule) => rule.target)
    if (firstRuleWithTarget) {
      return { groupId: group.id, ruleId: firstRuleWithTarget.id, target: firstRuleWithTarget.target ?? null }
    }

    const firstRule = (group.rules ?? [])[0]
    if (firstRule) {
      return { groupId: group.id, ruleId: firstRule.id, target: firstRule.target ?? null }
    }
  }

  return { target: cfg.defaultTarget ?? null }
}
