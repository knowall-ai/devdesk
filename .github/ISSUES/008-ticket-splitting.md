# [FEAT] Ticket Splitting

## Labels
`core`, `priority:low`

## Description
Implement ticket splitting to create new tickets from existing ticket content when multiple issues are reported.

## Requirements

### Split Functionality
- Create new ticket from selected content
- Copy relevant comments to new ticket
- Link original and split tickets
- Preserve requester information
- Copy attachments selectively

### Split Options
- Select which comments to include
- Copy or move content
- Set status of new ticket
- Assign to different agent/group
- Copy custom field values

### Split History
- Reference to parent ticket
- Split audit trail
- Bi-directional linking
- View all related tickets

### Use Cases
- Customer reports multiple issues in one ticket
- Issue spans multiple teams/departments
- Escalation requires separate tracking

## Zendesk Reference
Zendesk allows creating follow-up tickets and splitting complex issues into manageable parts.

## Acceptance Criteria
- [ ] Can split ticket into new ticket
- [ ] Content selection works
- [ ] Tickets properly linked
- [ ] Audit trail maintained
- [ ] Permissions enforced
