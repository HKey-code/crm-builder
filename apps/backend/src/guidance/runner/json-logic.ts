export function evalCondition(condition: any, ctx: any): boolean {
  if (!condition) return true;
  if (condition['==']) {
    const [left, right] = condition['=='];
    const l = resolveVar(left, ctx);
    const r = resolveVar(right, ctx);
    return l === r;
  }
  return false;
}

function resolveVar(expr: any, ctx: any): any {
  if (expr && typeof expr === 'object' && ('var' in expr)) {
    const path = String(expr.var).split('.');
    return path.reduce((acc, k) => (acc ? acc[k] : undefined), ctx);
  }
  return expr;
}
