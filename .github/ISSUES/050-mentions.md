# [FEAT] @Mentions

## Labels
`collaboration`, `priority:medium`

## Description
Implement @mentions for notifying and involving team members in ticket discussions.

## Requirements

### Mention Types
- @agent mentions
- @group mentions
- @role mentions
- @all mentions (restricted)

### Mention Features
- Autocomplete on typing @
- Agent search
- Recent mentions list
- Mention highlighting
- Click to view profile

### Notifications
- In-app notification
- Email notification
- Push notification (mobile)
- Notification preferences
- Mention digest option

### Mention Locations
- Public replies
- Internal notes
- Side conversations
- Comments
- Article discussions

### Mention Actions
- Jump to mentioned ticket
- Reply to mention
- Mark as read
- Snooze mentions
- Mention history

### Permissions
- Who can mention whom
- Group mention restrictions
- @all restrictions
- Cross-group mentions

## Zendesk Reference
Zendesk supports internal collaboration with notifications and internal communications for support agents.

## Acceptance Criteria
- [ ] @mentions work with autocomplete
- [ ] Notifications delivered
- [ ] Different mention types work
- [ ] Permission restrictions enforced
- [ ] Mention history trackable
