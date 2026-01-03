# [FEAT] Macros - Pre-defined Responses

## Labels
`automation`, `priority:high`

## Description
Implement macros (canned responses) that allow agents to apply pre-written responses and actions to tickets with one click.

## Requirements

### Macro Content
- Pre-written response text
- Rich text formatting support
- Dynamic placeholders:
  - {{ticket.id}}
  - {{ticket.requester.name}}
  - {{ticket.requester.email}}
  - {{agent.name}}
  - {{agent.signature}}
  - Custom field values
- Attachment templates

### Macro Actions
- Add public reply
- Add internal note
- Set status
- Set priority
- Add tags
- Set assignee
- Update custom fields
- Multiple actions per macro

### Macro Management
- Personal macros (agent-specific)
- Shared macros (team/global)
- Macro categories/folders
- Macro search
- Most-used macros list
- Macro shortcuts/hotkeys

### Permissions
- Create/edit personal macros
- Create/edit shared macros
- Apply macros
- Macro visibility by group

### Usage Tracking
- Macro usage statistics
- Most popular macros
- Macro effectiveness reports

## Zendesk Reference
Macros are pre-written responses or actions that agents can apply to tickets with one click, helping speed up replies and standardize communication for common issues.

## Acceptance Criteria
- [ ] Macros with placeholders work
- [ ] Multiple actions per macro
- [ ] Personal and shared macros
- [ ] Macro search/keyboard shortcuts
- [ ] Usage statistics tracked
