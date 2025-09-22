import { nanoid } from 'nanoid'

export type NodeKind = 'start' | 'text' | 'input' | 'choice' | 'connector' | 'end'

export interface ScriptNodeData {
  label: string
  kind: NodeKind
  [key: string]: unknown
}

export interface ScriptNode {
  id: string
  position: { x: number; y: number }
  data: ScriptNodeData
}

export interface ScriptEdge {
  id: string
  source: string
  target: string
  label?: string
}

export type Scalar = string | number | boolean | Date

export type ClauseValue = string | number | boolean | string[] | number[]

export type ClauseType = 'string' | 'number' | 'date' | 'array' | 'boolean'

export type ClauseOperator =
  | 'equals' | 'notEquals' | 'contains' | 'notContains' | 'startsWith' | 'endsWith'
  | '>' | '>=' | '<' | '<=' | '=' | '!='
  | 'includes' | 'notIncludes' | 'intersects' | 'notIntersects'
  | 'isTrue' | 'isFalse'

export type Clause = {
  id: string
  variable: string
  type: ClauseType
  operator: ClauseOperator
  value: ClauseValue
}

export type Rule = {
  id: string
  name?: string
  target?: string | null
  clauses: Clause[]
}

export type Group = {
  id: string
  title?: string
  rules: Rule[]
}

export type ChoiceConfig = {
  description?: string
  groups: Group[]
  defaultTarget?: string | null
}

export function migrateSimpleChoice(varName: string, options: { label: string; value: string }[]): ChoiceConfig {
  return {
    description: undefined,
    groups: [
      {
        id: nanoid(),
        title: 'Group 1',
        rules: options.map((opt, index) => ({
          id: nanoid(),
          name: `Rule 1.${index + 1}`,
          target: undefined,
          clauses: [
            {
              id: nanoid(),
              variable: varName,
              type: 'string',
              operator: 'equals',
              value: opt.value,
            },
          ],
        })),
      },
    ],
    defaultTarget: null,
  }
}

export function createClause(partial?: Partial<Clause>): Clause {
  return {
    id: nanoid(),
    variable: '',
    type: 'string',
    operator: 'equals',
    value: '',
    ...partial,
  }
}

export function createRule(partial?: Partial<Rule>): Rule {
  return {
    id: nanoid(),
    name: 'Rule',
    target: null,
    clauses: [createClause()],
    ...partial,
  }
}

export function createGroup(partial?: Partial<Group>): Group {
  return {
    id: nanoid(),
    title: 'Group',
    rules: [createRule({ name: 'Rule 1.1' })],
    ...partial,
  }
}

export function createChoiceConfig(): ChoiceConfig {
  return {
    description: undefined,
    groups: [
      {
        id: nanoid(),
        title: 'Group 1',
        rules: [
          {
            id: nanoid(),
            name: 'Rule 1',
            target: null,
            clauses: [createClause()],
          },
        ],
      },
    ],
    defaultTarget: null,
  }
}

export function ensureChoiceConfig(input: any): ChoiceConfig {
  if (!input || typeof input !== 'object') return createChoiceConfig()

  const maybeGroups = Array.isArray((input as any).groups) ? (input as any).groups : null
  if (maybeGroups) {
    const groups: Group[] = maybeGroups.map((group: any, gIdx: number) => ({
      id: typeof group?.id === 'string' ? group.id : nanoid(),
      title: typeof group?.title === 'string' ? group.title : `Group ${gIdx + 1}`,
      rules: Array.isArray(group?.rules)
        ? group.rules.map((rule: any, rIdx: number) => ({
            id: typeof rule?.id === 'string' ? rule.id : nanoid(),
            name: typeof rule?.name === 'string' ? rule.name : `Rule ${rIdx + 1}`,
            target:
              typeof rule?.target === 'string'
                ? rule.target
                : rule?.target === null
                  ? null
                  : undefined,
            clauses: Array.isArray(rule?.clauses) && rule.clauses.length > 0
              ? rule.clauses.map((clause: any) => ({
                  id: typeof clause?.id === 'string' ? clause.id : nanoid(),
                  variable: typeof clause?.variable === 'string' ? clause.variable : '',
                  type: clause?.type === 'number' || clause?.type === 'date' || clause?.type === 'array' || clause?.type === 'boolean' ? clause.type : 'string',
                  operator: clause?.operator ?? 'equals',
                  value: clause?.value ?? '',
                }))
              : [createClause()],
          }))
        : [createRule()],
    }))

    return {
      description: typeof input.description === 'string' ? input.description : undefined,
      groups,
      defaultTarget:
        typeof input.defaultTarget === 'string'
          ? input.defaultTarget
          : input.defaultTarget === null
            ? null
            : undefined,
    }
  }

  // Legacy shape where rules lived at root
  if (Array.isArray((input as any).rules)) {
    const legacyRules = (input as any).rules
    const group: Group = {
      id: nanoid(),
      title: typeof input.title === 'string' ? input.title : 'Group 1',
      rules: legacyRules.map((legacy: any, idx: number) => {
        const clauses: Clause[] = Array.isArray(legacy?.groups)
          ? legacy.groups.flatMap((legacyGroup: any) =>
              Array.isArray(legacyGroup?.clauses)
                ? legacyGroup.clauses.map((c: any) => ({
                    id: nanoid(),
                    variable: typeof c?.var === 'string' ? c.var : '',
                    type: legacyVarTypeToClauseType(c?.varType),
                    operator: legacyOpToOperator(c?.op, legacyVarTypeToClauseType(c?.varType)),
                    value: normalizeClauseValue(c?.value, legacyVarTypeToClauseType(c?.varType)),
                  }))
                : []
            )
          : [createClause()]
        return {
          id: typeof legacy?.id === 'string' ? legacy.id : nanoid(),
          name: typeof legacy?.label === 'string' ? legacy.label : `Rule ${idx + 1}`,
          target: typeof legacy?.target === 'string' ? legacy.target : null,
          clauses: clauses.length > 0 ? clauses : [createClause()],
        }
      }),
    }

    return {
      description: typeof input.description === 'string' ? input.description : undefined,
      groups: [group],
      defaultTarget: typeof input.defaultTarget === 'string' ? input.defaultTarget : null,
    }
  }

  return createChoiceConfig()
}

function legacyVarTypeToClauseType(legacy: any): ClauseType {
  switch (legacy) {
    case 'number':
    case 'date':
      return legacy
    case 'boolean':
      return 'boolean'
    case 'singleSelect':
    case 'multiSelect':
    case 'string[]':
    case 'number[]':
      return 'array'
    default:
      return 'string'
  }
}

function legacyOpToOperator(op: any, type: ClauseType): ClauseOperator {
  switch (type) {
    case 'string':
      if (op === 'neq') return 'notEquals'
      if (op === 'contains') return 'contains'
      if (op === 'notContains') return 'notContains'
      if (op === 'startsWith') return 'startsWith'
      if (op === 'endsWith') return 'endsWith'
      return 'equals'
    case 'number':
    case 'date':
      if (op === 'gt') return '>'
      if (op === 'gte') return '>='
      if (op === 'lt') return '<'
      if (op === 'lte') return '<='
      if (op === 'neq') return '!='
      return '='
    case 'array':
      if (op === 'notIn' || op === 'excludesAll') return 'notIncludes'
      if (op === 'includesAny') return 'intersects'
      if (op === 'includesAll' || op === 'in') return 'includes'
      if (op === 'notIntersects') return 'notIntersects'
      return 'includes'
    case 'boolean':
      if (op === 'neq') return 'isFalse'
      return 'isTrue'
    default:
      return 'equals'
  }
}

function normalizeClauseValue(value: any, type: ClauseType): ClauseValue {
  if (type === 'array') {
    if (Array.isArray(value)) return value
    if (typeof value === 'string') return value.split(',').map((v) => v.trim()).filter(Boolean)
    return value !== undefined && value !== null ? [value] : []
  }
  return value
}
