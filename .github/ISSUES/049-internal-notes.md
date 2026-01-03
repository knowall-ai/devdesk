# [FEAT] Internal Notes

## Labels
`collaboration`, `priority:high`

## Description
Implement internal notes for agent-to-agent communication within tickets without customer visibility.

## Requirements

### Internal Note Features
- Add internal comments
- Rich text formatting
- File attachments
- @mention agents
- Timestamp and author

### Visibility Control
- Hidden from customers
- Visible to all agents
- Group-restricted notes (optional)
- Clear visual distinction
- Never in customer emails

### Use Cases
- Agent handoff notes
- Escalation details
- Background information
- Investigation notes
- Decision documentation

### Internal Note Actions
- Edit own notes
- Delete own notes (time-limited)
- Pin important notes
- Search internal notes
- Filter by internal notes

### Notifications
- @mention notifications
- Configurable alerts
- Email summaries
- In-app notifications

### Audit
- Full audit trail
- Edit history
- Access logging

## Zendesk Reference
Light agents can add internal notes to tickets that are visible only to agents and not to customers.

## Acceptance Criteria
- [ ] Internal notes hidden from customers
- [ ] Rich text and attachments work
- [ ] @mentions functional
- [ ] Clear visual distinction
- [ ] Audit trail available
