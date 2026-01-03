# [FEAT] Triggers - Event-based Automation

## Labels
`automation`, `priority:high`

## Description
Implement an event-based trigger system that automatically performs actions when specific conditions are met on ticket creation or update.

## Requirements

### Trigger Structure
- **Conditions**: Requirements that must be met for trigger to fire
- **Actions**: Operations performed when conditions are met
- Trigger name and description
- Active/inactive status
- Trigger ordering/priority

### Trigger Events
- Ticket created
- Ticket updated
- Ticket assigned
- Ticket status changed
- Comment added
- Customer replied
- Agent replied

### Condition Types
- Ticket properties (status, priority, type, etc.)
- Requester properties
- Organization properties
- Assignee properties
- Time-based (created/updated within X hours)
- Tag presence
- Custom field values
- Text contains (subject, description)

### Action Types
- Set ticket properties
- Add tags
- Send email notification
- Send webhook
- Assign to agent/group
- Add internal note
- Add CC/followers
- Set custom fields

### Management
- Trigger list with enable/disable
- Trigger reordering
- Trigger testing/preview
- Trigger execution logs
- Clone triggers

## Zendesk Reference
Ticket triggers are business rules that run immediately after a ticket is created or updated and automatically perform actions if specified conditions are met.

## Acceptance Criteria
- [ ] Triggers fire on ticket events
- [ ] All condition types work
- [ ] All action types work
- [ ] Trigger ordering respected
- [ ] Execution logs available
