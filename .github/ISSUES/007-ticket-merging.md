# [FEAT] Ticket Merging

## Labels
`core`, `priority:low`

## Description
Implement ticket merging functionality to combine duplicate or related tickets into a single ticket.

## Requirements

### Merge Functionality
- Merge two or more tickets into one
- Select primary ticket (target)
- Secondary tickets become linked/closed
- Preserve all comments and history
- Merge attachments

### Merge Options
- Combine descriptions or keep primary only
- Merge custom field values
- Retain all requester information
- Keep ticket IDs for reference
- Notification options for merged tickets

### Merge History
- Audit trail of merge operations
- Link to original tickets
- View merged ticket sources
- Undo merge (within time limit)

### Permissions
- Configure who can merge tickets
- Merge confirmation workflow (optional)
- Restrict cross-organization merges

### Duplicate Detection
- Suggest potential duplicates
- Compare tickets side-by-side
- Quick merge from suggestions

## Zendesk Reference
Zendesk supports ticket merging to combine duplicate tickets and maintain a clean ticket queue.

## Acceptance Criteria
- [ ] Can merge 2+ tickets
- [ ] All history preserved
- [ ] Merge audit trail exists
- [ ] Duplicate suggestions work
- [ ] Permissions enforced
