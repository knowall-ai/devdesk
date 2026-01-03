# [FEAT] User Roles System

## Labels
`user-management`, `security`, `priority:high`

## Description
Implement a comprehensive user roles system with distinct permissions for different user types.

## Requirements

### Standard Roles
- **Account Owner**: Full system access
- **Administrator**: System configuration access
- **Agent**: Ticket handling access
- **Light Agent**: Limited ticket access (view, internal notes)
- **End User**: Customer self-service access

### Role Capabilities

#### Administrator
- Manage all settings
- Create/manage users
- Configure business rules
- Access all tickets
- Manage integrations
- View all reports

#### Agent
- Access assigned tickets
- Create/update tickets
- Use macros
- Access knowledge base
- View assigned reports

#### Light Agent
- View tickets (no assignment)
- Add internal notes
- Access knowledge base
- No customer communication

#### End User
- Submit tickets
- View own tickets
- Access help center
- Update profile

### Role Assignment
- Assign roles to users
- Multiple role support (optional)
- Default role for new users
- Role inheritance

## Zendesk Reference
Zendesk Support provides several standard user roles: account owner, administrator, agent, light agent, and end user.

## Acceptance Criteria
- [ ] All standard roles implemented
- [ ] Permissions enforced
- [ ] Role assignment works
- [ ] Role hierarchy functional
- [ ] Default roles configurable
