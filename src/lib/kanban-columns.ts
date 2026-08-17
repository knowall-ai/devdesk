/**
 * Kanban column / DevOps state reconciliation.
 *
 * The stand-up board renders a fixed set of display columns (New, To Do,
 * Active, Blocked, Resolved, Closed) that is really a *union* across every
 * process template in the org. Any individual work item can only ever enter
 * the states its own work item type defines — an Agile-template Bug has no
 * "To Do" state at all — so a column that is valid for one card is invalid
 * for another. Dropping onto an invalid column makes DevOps reject the PATCH
 * with a workflow rule error (TF401320) and the card silently snaps back
 * (issues #391, #366).
 *
 * These helpers let the board ask "can *this* card go in *that* column?"
 * before offering the drop target.
 */

/**
 * Normalize a state or column name for tolerant comparison.
 *
 * Templates serialize the same logical state in different shapes — "To Do",
 * "ToDo", "To-Do", occasionally with a non-breaking space — so comparisons
 * strip case and everything that isn't alphanumeric.
 */
export function normalizeStateName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '');
}

/**
 * Whether `workItemType` defines a state matching `columnName`.
 *
 * Fails open: when we have no state list for the type (state discovery
 * failed, or the type is new), the drop is allowed and the server remains
 * the authority. Blocking on absent data would break working drags.
 */
export function canTypeEnterColumn(
  workItemType: string | undefined,
  columnName: string,
  allowedStatesByType: Record<string, string[]> | undefined
): boolean {
  if (!workItemType) return true;
  const states = allowedStatesByType?.[workItemType];
  if (!states || states.length === 0) return true;
  const target = normalizeStateName(columnName);
  return states.some((state) => normalizeStateName(state) === target);
}

/**
 * Translate a display column name into the state name DevOps actually expects
 * for this work item type.
 *
 * The column label and the state name are NOT interchangeable. The board shows
 * "To Do" while the KnowAll process defines the state as "Todo", and PATCHing
 * the label verbatim is rejected — which is why no card could be dragged into
 * that column regardless of its type (#391).
 *
 * Falls back to the column name when the type's states are unknown, leaving
 * the server to have the final say.
 */
export function resolveStateForColumn(
  workItemType: string | undefined,
  columnName: string,
  allowedStatesByType: Record<string, string[]> | undefined
): string {
  if (!workItemType) return columnName;
  const states = allowedStatesByType?.[workItemType];
  if (!states || states.length === 0) return columnName;
  const target = normalizeStateName(columnName);
  return states.find((state) => normalizeStateName(state) === target) ?? columnName;
}
