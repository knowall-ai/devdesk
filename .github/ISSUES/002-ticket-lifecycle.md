# [FEAT] Ticket Status and Lifecycle Management

## Labels
`core`, `priority:high`

## Description
Implement a ticket status and lifecycle management system to track tickets from creation to resolution.

## Requirements

### Default Statuses
- **New**: Ticket just created, not yet assigned
- **Open**: Ticket assigned and being worked on
- **Pending**: Awaiting customer response
- **On Hold**: Temporarily paused
- **Solved**: Issue resolved, awaiting confirmation
- **Closed**: Ticket completed and archived

### Status Transitions
- Define allowed status transitions (state machine)
- Automatic status changes based on events (e.g., customer reply sets to Open)
- Manual status updates by agents
- Bulk status updates

### Lifecycle Features
- Ticket aging tracking
- Auto-close after X days of inactivity
- Reopen capability for closed tickets
- Status change history/audit trail
- Time spent in each status tracking

### Notifications
- Status change notifications to customers
- Internal notifications for agents
- Configurable notification preferences

## Zendesk Reference
Zendesk allows you to automate support requests using triggers and create workflows to track ticket status at all times.

## Acceptance Criteria
- [ ] All default statuses implemented
- [ ] Status transitions follow defined rules
- [ ] Status change triggers notifications
- [ ] Full audit trail of status changes
- [ ] Auto-close functionality works correctly
