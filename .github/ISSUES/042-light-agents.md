# [FEAT] Light Agents

## Labels
`user-management`, `priority:low`

## Description
Implement light agent roles for users who need limited ticket visibility without full agent capabilities.

## Requirements

### Light Agent Capabilities
- View tickets (read-only customer communication)
- Add internal notes
- View ticket history
- Access knowledge base
- View customer information

### Light Agent Restrictions
- Cannot reply to customers
- Cannot be assigned tickets
- Cannot change ticket status
- Cannot use macros (public)
- Limited reporting access

### Use Cases
- Subject matter experts
- Escalation reviewers
- Quality assurance
- Training/shadowing
- Cross-department collaboration

### Configuration
- Convert agent to light agent
- Convert light agent to agent
- Group membership
- Ticket access rules
- Custom permissions (optional)

### Cost Optimization
- Reduced licensing cost
- Seat type tracking
- License reporting
- Upgrade prompts

## Zendesk Reference
Light agents can add internal notes to tickets and see full ticket content but cannot communicate directly with customers.

## Acceptance Criteria
- [ ] Light agent role works
- [ ] Restrictions enforced
- [ ] Internal notes functional
- [ ] Ticket viewing works
- [ ] Role conversion available
