# [FEAT] Automations - Time-based Actions

## Labels
`automation`, `priority:high`

## Description
Implement time-based automation that performs actions on tickets based on elapsed time since specific events.

## Requirements

### Automation Structure
- **Time Conditions**: Hours/days since event
- **Conditions**: Additional requirements
- **Actions**: Operations to perform
- Automation name and description
- Active/inactive status

### Time Conditions
- Hours since created
- Hours since updated
- Hours since status changed
- Hours since assigned
- Hours since pending
- Hours since customer reply
- Hours since agent reply
- Business hours vs. calendar hours

### Additional Conditions
- Current ticket status
- Priority level
- Assignee presence
- Tag presence
- Custom field values
- Organization properties

### Action Types
- Change status
- Send reminder emails
- Escalate priority
- Reassign ticket
- Add tags
- Close ticket
- Send webhook notification
- Update custom fields

### Execution
- Run frequency (hourly)
- Prevent duplicate executions
- Execution history logging
- Test automation against tickets

## Zendesk Reference
Automations execute when an event occurs after a ticket property was set or updated, rather than immediately. All automations run once every hour on all non-closed tickets.

## Acceptance Criteria
- [ ] Time-based conditions work
- [ ] Business hours calculation
- [ ] Automations run hourly
- [ ] No duplicate executions
- [ ] Execution logs available
