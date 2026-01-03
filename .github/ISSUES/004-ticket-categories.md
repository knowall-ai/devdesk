# [FEAT] Ticket Categories and Types

## Labels
`core`, `priority:medium`

## Description
Implement a categorization system for tickets to organize and route them effectively.

## Requirements

### Category Structure
- Multi-level category hierarchy (Category > Subcategory)
- Ticket types (Question, Incident, Problem, Task, etc.)
- Multiple category assignment support
- Category-based routing to groups/agents

### Category Management
- Admin interface for category CRUD operations
- Category descriptions and help text
- Active/inactive status for categories
- Category ordering/sorting
- Category-specific custom fields

### User Experience
- Searchable category dropdown
- Category suggestions based on ticket content
- Required vs. optional category selection
- Category validation rules

### Routing & Automation
- Auto-assign tickets based on category
- Category-specific macros and templates
- Category-based SLA rules
- Category-specific workflows

## Zendesk Reference
Zendesk supports ticket categorization and tagging to organize support requests effectively.

## Acceptance Criteria
- [ ] Hierarchical category structure
- [ ] Ticket type classification
- [ ] Admin category management
- [ ] Category-based auto-routing
- [ ] Category reporting available
