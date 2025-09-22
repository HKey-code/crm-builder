import * as React from 'react'
import { nanoid } from 'nanoid'

import {
  ensureChoiceConfig,
  createGroup,
  createRule,
  createClause,
  type ChoiceConfig,
  type Group,
  type Rule,
  type Clause,
  type ClauseType,
  type ClauseOperator,
  type ClauseValue,
} from '../../types'

type VariableOption = { name: string; type: ClauseType; nodeId?: string }
type NodeOption = { id: string; label: string; kind: string }

type ChoiceEditorProps = {
  config: ChoiceConfig
  availableVars: VariableOption[]
  nodes: NodeOption[]
  currentNodeId: string
  onChange(next: ChoiceConfig): void
}

const CLAUSE_OPERATORS: Record<ClauseType, { value: ClauseOperator; label: string }[]> = {
  string: [
    { value: 'equals', label: 'equals' },
    { value: 'notEquals', label: 'not equals' },
    { value: 'contains', label: 'contains' },
    { value: 'notContains', label: 'not contains' },
    { value: 'startsWith', label: 'starts with' },
    { value: 'endsWith', label: 'ends with' },
  ],
  number: [
    { value: '>', label: '>' },
    { value: '>=', label: '≥' },
    { value: '<', label: '<' },
    { value: '<=', label: '≤' },
    { value: '=', label: '=' },
    { value: '!=', label: '≠' },
  ],
  date: [
    { value: '>', label: 'after' },
    { value: '>=', label: 'on/after' },
    { value: '<', label: 'before' },
    { value: '<=', label: 'on/before' },
    { value: '=', label: 'on' },
    { value: '!=', label: 'not on' },
  ],
  array: [
    { value: 'includes', label: 'includes all' },
    { value: 'notIncludes', label: 'excludes all' },
    { value: 'intersects', label: 'intersects' },
    { value: 'notIntersects', label: 'not intersects' },
  ],
  boolean: [
    { value: 'isTrue', label: 'is true' },
    { value: 'isFalse', label: 'is false' },
  ],
}

function cloneConfig(cfg: ChoiceConfig): ChoiceConfig {
  return {
    description: cfg.description ?? undefined,
    defaultTarget: cfg.defaultTarget ?? null,
    groups: (cfg.groups ?? []).map((group) => ({
      id: group.id ?? nanoid(),
      title: group.title ?? '',
      rules: (group.rules ?? []).map((rule) => ({
        id: rule.id ?? nanoid(),
        name: rule.name ?? '',
        target: rule.target ?? null,
        clauses: (rule.clauses ?? []).map((clause) => ({
          id: clause.id ?? nanoid(),
          variable: clause.variable ?? '',
          type: clause.type ?? 'string',
          operator: clause.operator ?? 'equals',
          value: normalizeClauseValue(clause.value, clause.type ?? 'string'),
        })),
      })),
    })),
  }
}

function normalizeClauseValue(value: ClauseValue, type: ClauseType): ClauseValue {
  if (type === 'array') {
    if (Array.isArray(value)) return value
    if (typeof value === 'string') return value.split(',').map((item) => item.trim()).filter(Boolean)
    if (value === null || value === undefined) return []
    return [value]
  }
  return value
}

const getRuleDisplayName = (groupIndex: number, ruleIndex: number, rule: Rule) => {
  if (rule.name && rule.name.trim().length > 0) return rule.name
  return `Rule ${groupIndex + 1}.${ruleIndex + 1}`
}

const getGroupDisplayName = (groupIndex: number, group: Group) => {
  if (group.title && group.title.trim().length > 0) return group.title
  return `Group ${groupIndex + 1}`
}

const getDefaultClause = (available: VariableOption[]): Clause => {
  const firstVar = available[0]
  if (firstVar) {
    return createClause({
      variable: firstVar.name,
      type: firstVar.type,
      operator: CLAUSE_OPERATORS[firstVar.type][0]?.value ?? 'equals',
      value: firstVar.type === 'array' ? [] : '',
    })
  }
  return createClause()
}

export default function ChoiceEditor({ config, availableVars, nodes, currentNodeId, onChange }: ChoiceEditorProps) {
  const normalized = React.useMemo(() => ensureChoiceConfig(config), [config])
  const [collapsedGroups, setCollapsedGroups] = React.useState<Record<string, boolean>>({})
  const [collapsedRules, setCollapsedRules] = React.useState<Record<string, boolean>>({})

  React.useEffect(() => {
    setCollapsedGroups({})
    setCollapsedRules({})
  }, [normalized.groups.length])

  const updateConfig = React.useCallback((updater: (draft: ChoiceConfig) => void) => {
    const draft = cloneConfig(normalized)
    updater(draft)
    onChange(draft)
  }, [normalized, onChange])

  const addGroup = () => {
    const newGroupId = nanoid()
    updateConfig((draft) => {
      const idx = draft.groups.length
      const base = createGroup({ id: newGroupId, title: `Group ${idx + 1}` })
      base.rules = base.rules.map((rule, ridx) => ({
        ...rule,
        name: `Rule ${idx + 1}.${ridx + 1}`,
        clauses: rule.clauses.length ? rule.clauses : [getDefaultClause(availableVars)],
      }))
      draft.groups.push(base)
    })
    setCollapsedGroups((prev) => ({ ...prev, [newGroupId]: false }))
  }

  const removeGroup = (groupId: string) => {
    updateConfig((draft) => {
      if (draft.groups.length <= 1) return
      draft.groups = draft.groups.filter((g) => g.id !== groupId)
    })
    setCollapsedGroups((prev) => {
      const next = { ...prev }
      delete next[groupId]
      return next
    })
  }

  const moveGroup = (groupId: string, direction: -1 | 1) => {
    updateConfig((draft) => {
      const idx = draft.groups.findIndex((g) => g.id === groupId)
      if (idx === -1) return
      const target = idx + direction
      if (target < 0 || target >= draft.groups.length) return
      const [group] = draft.groups.splice(idx, 1)
      draft.groups.splice(target, 0, group)
    })
  }

  const updateGroup = (groupId: string, updater: (group: Group) => void) => {
    updateConfig((draft) => {
      const idx = draft.groups.findIndex((g) => g.id === groupId)
      if (idx === -1) return
      const group = cloneGroup(draft.groups[idx])
      updater(group)
      draft.groups[idx] = group
    })
  }

  const addRule = (groupId: string) => {
    const newRuleId = nanoid()
    updateGroup(groupId, (group) => {
      const groupIdx = normalized.groups.findIndex((g) => g.id === groupId)
      const nextRule = createRule({ id: newRuleId, name: `Rule ${groupIdx + 1}.${group.rules.length + 1}` })
      nextRule.clauses = nextRule.clauses.length ? nextRule.clauses : [getDefaultClause(availableVars)]
      group.rules = [...group.rules, nextRule]
    })
    setCollapsedRules((prev) => ({ ...prev, [newRuleId]: false }))
  }

  const moveRule = (groupId: string, ruleId: string, direction: -1 | 1) => {
    updateGroup(groupId, (group) => {
      const idx = group.rules.findIndex((r) => r.id === ruleId)
      if (idx === -1) return
      const target = idx + direction
      if (target < 0 || target >= group.rules.length) return
      const [rule] = group.rules.splice(idx, 1)
      group.rules.splice(target, 0, rule)
    })
  }

  const removeRule = (groupId: string, ruleId: string) => {
    updateGroup(groupId, (group) => {
      if (group.rules.length <= 1) return
      group.rules = group.rules.filter((r) => r.id !== ruleId)
    })
    setCollapsedRules((prev) => {
      const next = { ...prev }
      delete next[ruleId]
      return next
    })
  }

  const updateRule = (groupId: string, ruleId: string, updater: (rule: Rule) => void) => {
    updateGroup(groupId, (group) => {
      const idx = group.rules.findIndex((r) => r.id === ruleId)
      if (idx === -1) return
      const rule = cloneRule(group.rules[idx])
      updater(rule)
      group.rules[idx] = rule
    })
  }

  const addClause = (groupId: string, ruleId: string) => {
    updateRule(groupId, ruleId, (rule) => {
      rule.clauses = [...rule.clauses, getDefaultClause(availableVars)]
    })
  }

  const removeClause = (groupId: string, ruleId: string, clauseId: string) => {
    updateRule(groupId, ruleId, (rule) => {
      if (rule.clauses.length <= 1) return
      rule.clauses = rule.clauses.filter((c) => c.id !== clauseId)
    })
  }

  const updateClause = (groupId: string, ruleId: string, clauseId: string, updater: (clause: Clause) => void) => {
    updateRule(groupId, ruleId, (rule) => {
      const idx = rule.clauses.findIndex((c) => c.id === clauseId)
      if (idx === -1) return
      const clause = { ...rule.clauses[idx] }
      updater(clause)
      rule.clauses[idx] = clause
    })
  }

  const updateDefaultTarget = (value: string) => {
    updateConfig((draft) => {
      draft.defaultTarget = value ? value : null
    })
  }

  const handleVariableChange = (groupId: string, ruleId: string, clause: Clause, nextVar: string) => {
    const match = availableVars.find((v) => v.name === nextVar)
    const nextType = match?.type ?? clause.type
    const nextOperator = CLAUSE_OPERATORS[nextType][0]?.value ?? clause.operator
    updateClause(groupId, ruleId, clause.id, (c) => {
      c.variable = nextVar
      c.type = nextType
      c.operator = nextOperator
      c.value = nextType === 'array' ? [] : ''
    })
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="space-y-2">
        <label className="text-sm font-semibold text-[var(--lpc-text)]">Groups</label>
        <div className="space-y-3 max-h-[460px] overflow-auto pr-2">
          {normalized.groups.map((group, groupIdx) => {
            const collapsed = collapsedGroups[group.id] ?? false
            const displayName = getGroupDisplayName(groupIdx, group)
            return (
              <div key={group.id} className="rounded border border-[var(--lpc-stroke)] bg-white">
                <div className="flex items-center justify-between gap-2 border-b bg-[var(--lpc-bg)] px-3 py-2">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      className="rounded border px-1 text-xs"
                      aria-label={collapsed ? 'Expand group' : 'Collapse group'}
                      onClick={() => setCollapsedGroups((prev) => ({ ...prev, [group.id]: !collapsed }))}
                    >
                      {collapsed ? '▸' : '▾'}
                    </button>
                    <input
                      className="rounded border px-2 py-1 text-sm"
                      value={group.title ?? ''}
                      onChange={(e) => updateGroup(group.id, (g) => { g.title = e.target.value })}
                      placeholder={`Group ${groupIdx + 1}`}
                    />
                  </div>
                  <div className="flex items-center gap-1">
                    <button type="button" className="rounded border px-2 py-1 text-xs" onClick={() => moveGroup(group.id, -1)}>↑</button>
                    <button type="button" className="rounded border px-2 py-1 text-xs" onClick={() => moveGroup(group.id, 1)}>↓</button>
                    <button type="button" className="rounded border px-2 py-1 text-xs" onClick={() => removeGroup(group.id)}>×</button>
                  </div>
                </div>

                {!collapsed && (
                  <div className="space-y-3 p-3">
                    {group.rules.map((rule, ruleIdx) => {
                      const ruleCollapsed = collapsedRules[rule.id] ?? false
                      const ruleDisplay = getRuleDisplayName(groupIdx, ruleIdx, rule)
                      return (
                        <div key={rule.id} className="rounded border border-[var(--lpc-stroke)]/80">
                          <div className="flex items-center justify-between gap-2 border-b bg-white px-3 py-2">
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                className="rounded border px-1 text-xs"
                                aria-label={ruleCollapsed ? 'Expand rule' : 'Collapse rule'}
                                onClick={() => setCollapsedRules((prev) => ({ ...prev, [rule.id]: !ruleCollapsed }))}
                              >
                                {ruleCollapsed ? '▸' : '▾'}
                              </button>
                              <input
                                className="rounded border px-2 py-1 text-sm"
                                value={rule.name ?? ''}
                                onChange={(e) => updateRule(group.id, rule.id, (r) => { r.name = e.target.value })}
                                placeholder={ruleDisplay}
                              />
                            </div>
                            <div className="flex items-center gap-1">
                              <button type="button" className="rounded border px-2 py-1 text-xs" onClick={() => moveRule(group.id, rule.id, -1)}>↑</button>
                              <button type="button" className="rounded border px-2 py-1 text-xs" onClick={() => moveRule(group.id, rule.id, 1)}>↓</button>
                              <button type="button" className="rounded border px-2 py-1 text-xs" onClick={() => removeRule(group.id, rule.id)}>×</button>
                            </div>
                          </div>

                          {!ruleCollapsed && (
                            <div className="space-y-3 p-3 bg-white/60">
                              <div className="space-y-1">
                                <label className="text-xs font-semibold text-[var(--lpc-muted)]">Target</label>
                                <select
                                  className="w-full rounded border px-2 py-1 text-sm"
                                  value={rule.target ?? ''}
                                  onChange={(e) => updateRule(group.id, rule.id, (r) => { r.target = e.target.value || null })}
                                >
                                  <option value="">(Connect via canvas or choose)</option>
                                  {nodes.filter((n) => n.id !== currentNodeId).map((node) => (
                                    <option key={node.id} value={node.id}>{node.label}</option>
                                  ))}
                                </select>
                              </div>

                              <div className="space-y-2">
                                <div className="flex items-center justify-between text-xs font-semibold text-[var(--lpc-text)]">
                                  <span>Clauses (AND)</span>
                                  <button type="button" className="rounded border px-2 py-1 text-xs" onClick={() => addClause(group.id, rule.id)}>+ Clause</button>
                                </div>
                                <div className="space-y-2">
                                  {rule.clauses.map((clause) => (
                                    <div key={clause.id} className="rounded border border-[var(--lpc-stroke)]/80 bg-white p-3 text-sm space-y-2">
                                      <div className="grid grid-cols-12 gap-2 items-end">
                                        <div className="col-span-4">
                                          <label className="block text-[11px] text-[var(--lpc-muted)]">Variable</label>
                                          <input
                                            className="w-full rounded border px-2 py-1 text-sm"
                                            list="choice-editor-vars"
                                            value={clause.variable}
                                            onChange={(e) => handleVariableChange(group.id, rule.id, clause, e.target.value)}
                                          />
                                        </div>
                                        <div className="col-span-3">
                                          <label className="block text-[11px] text-[var(--lpc-muted)]">Type</label>
                                          <select
                                            className="w-full rounded border px-2 py-1 text-sm"
                                            value={clause.type}
                                            onChange={(e) => {
                                              const nextType = e.target.value as ClauseType
                                              const defaultOperator = CLAUSE_OPERATORS[nextType][0]?.value ?? clause.operator
                                              updateClause(group.id, rule.id, clause.id, (c) => {
                                                c.type = nextType
                                                c.operator = defaultOperator
                                                c.value = nextType === 'array' ? [] : ''
                                              })
                                            }}
                                          >
                                            <option value="string">String</option>
                                            <option value="number">Number</option>
                                            <option value="date">Date</option>
                                            <option value="array">Array</option>
                                            <option value="boolean">Boolean</option>
                                          </select>
                                        </div>
                                        <div className="col-span-3">
                                          <label className="block text-[11px] text-[var(--lpc-muted)]">Operator</label>
                                          <select
                                            className="w-full rounded border px-2 py-1 text-sm"
                                            value={clause.operator}
                                            onChange={(e) => updateClause(group.id, rule.id, clause.id, (c) => { c.operator = e.target.value as ClauseOperator })}
                                          >
                                            {CLAUSE_OPERATORS[clause.type].map((op) => (
                                              <option key={op.value} value={op.value}>{op.label}</option>
                                            ))}
                                          </select>
                                        </div>
                                        <div className="col-span-2 flex justify-end">
                                          <button type="button" className="rounded border px-2 py-1 text-xs" onClick={() => removeClause(group.id, rule.id, clause.id)}>×</button>
                                        </div>
                                      </div>
                                      <div>
                                        <label className="block text-[11px] text-[var(--lpc-muted)]">Value</label>
                                        {clause.type === 'boolean' ? (
                                          <select
                                            className="w-full rounded border px-2 py-1 text-sm"
                                            value={clause.operator === 'isFalse' ? 'false' : 'true'}
                                            onChange={(e) => updateClause(group.id, rule.id, clause.id, (c) => {
                                              c.operator = e.target.value === 'true' ? 'isTrue' : 'isFalse'
                                              c.value = e.target.value === 'true'
                                            })}
                                          >
                                            <option value="true">True</option>
                                            <option value="false">False</option>
                                          </select>
                                        ) : clause.type === 'array' ? (
                                          <input
                                            className="w-full rounded border px-2 py-1 text-sm"
                                            placeholder="Comma separated values"
                                            value={(Array.isArray(clause.value) ? clause.value : []).join(', ')}
                                            onChange={(e) => updateClause(group.id, rule.id, clause.id, (c) => { c.value = parseArrayToValue(e.target.value) })}
                                          />
                                        ) : clause.type === 'number' ? (
                                          <input
                                            type="number"
                                            className="w-full rounded border px-2 py-1 text-sm"
                                            value={clause.value === '' || clause.value === undefined ? '' : Number(clause.value)}
                                            onChange={(e) => updateClause(group.id, rule.id, clause.id, (c) => { c.value = e.target.value === '' ? '' : Number(e.target.value) })}
                                          />
                                        ) : clause.type === 'date' ? (
                                          <input
                                            type="date"
                                            className="w-full rounded border px-2 py-1 text-sm"
                                            value={typeof clause.value === 'string' ? clause.value : ''}
                                            onChange={(e) => updateClause(group.id, rule.id, clause.id, (c) => { c.value = e.target.value })}
                                          />
                                        ) : (
                                          <input
                                            className="w-full rounded border px-2 py-1 text-sm"
                                            value={String(clause.value ?? '')}
                                            onChange={(e) => updateClause(group.id, rule.id, clause.id, (c) => { c.value = e.target.value })}
                                          />
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })}
                    <button type="button" className="rounded border px-3 py-1 text-sm" onClick={() => addRule(group.id)}>+ Rule</button>
                  </div>
                )}
              </div>
            )
          })}

          <button type="button" className="rounded border px-3 py-1 text-sm" onClick={addGroup}>+ Group</button>
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-sm font-semibold text-[var(--lpc-text)]">Default target</label>
        <select
          className="w-full rounded border px-2 py-1 text-sm"
          value={normalized.defaultTarget ?? ''}
          onChange={(e) => updateDefaultTarget(e.target.value)}
        >
          <option value="">(Connect via canvas or choose)</option>
          {nodes.filter((node) => node.id !== currentNodeId).map((node) => (
            <option key={node.id} value={node.id}>{node.label}</option>
          ))}
        </select>
      </div>

      <datalist id="choice-editor-vars">
        {availableVars.map((v) => (
          <option key={v.name} value={v.name} />
        ))}
      </datalist>
    </div>
  )
}

function parseArrayToValue(input: string): string[] {
  return input.split(',').map((item) => item.trim()).filter(Boolean)
}

function cloneGroup(group: Group): Group {
  return {
    id: group.id,
    title: group.title,
    rules: group.rules.map(cloneRule),
  }
}

function cloneRule(rule: Rule): Rule {
  return {
    id: rule.id,
    name: rule.name,
    target: rule.target ?? null,
    clauses: rule.clauses.map((clause) => ({
      id: clause.id,
      variable: clause.variable,
      type: clause.type,
      operator: clause.operator,
      value: normalizeClauseValue(clause.value, clause.type),
    })),
  }
}
