# [FEAT] Groups and Teams

## Labels
`user-management`, `priority:high`

## Description
Implement groups and teams for organizing agents and managing ticket routing.

## Requirements

### Group Structure
- Create groups
- Group name and description
- Group members (agents)
- Group email address
- Default assignee

### Group Features
- Ticket assignment to groups
- Group-specific views
- Group-specific macros
- Group-specific SLAs
- Group schedules

### Agent Membership
- Add agents to groups
- Multiple group membership
- Primary group assignment
- Group admin role

### Group Routing
- Route by category to group
- Route by skill to group
- Load balancing within group
- Escalation between groups

### Team Features (Higher-level)
- Teams as collections of groups
- Team leads
- Team dashboards
- Cross-group collaboration
- Team-level permissions

### Group Management
- Group list view
- Search groups
- Merge groups
- Group analytics
- Group capacity tracking

## Zendesk Reference
Groups are collections of agents. They can be used to organize agents for ticket assignment, routing, and access control.

## Acceptance Criteria
- [ ] Group CRUD works
- [ ] Agent membership functional
- [ ] Ticket routing to groups works
- [ ] Group-specific settings apply
- [ ] Team structure supported
