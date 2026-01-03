# [FEAT] Organizations

## Labels
`user-management`, `priority:high`

## Description
Implement organization management for grouping customers and managing B2B support.

## Requirements

### Organization Structure
- Create organizations
- Organization name and details
- Organization domains
- Custom fields
- Organization tags
- Notes

### Organization Features
- Multiple users per organization
- Organization admins
- Shared organization tickets
- Organization-wide settings
- Default ticket settings

### User-Organization Relationship
- Add users to organizations
- Primary organization
- Multiple organizations (optional)
- Auto-add by email domain

### Organization Settings
- Default tags for tickets
- SLA assignment
- Group assignment
- Custom fields defaults
- Ticket sharing preferences

### Organization Tickets
- View organization tickets
- Organization ticket history
- Organization-level reporting
- Shared ticket access

### Organization Management
- Organization list view
- Search organizations
- Merge organizations
- Delete organizations
- Import/export organizations

## Zendesk Reference
Organizations are collections of end users. Admins and agents can add end users to organizations, and on higher plans, users can belong to multiple organizations.

## Acceptance Criteria
- [ ] Organization CRUD works
- [ ] User-organization linking
- [ ] Shared ticket access
- [ ] Organization settings applied
- [ ] Organization reporting available
