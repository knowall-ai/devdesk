#!/bin/bash

# DevDesk GitHub Issue Creation Script
# This script creates all documented issues in GitHub
#
# Prerequisites:
# 1. GitHub CLI (gh) installed and authenticated
# 2. Run from the repository root directory
#
# Usage: bash .github/ISSUES/create_issues.sh

set -e

echo "Creating GitHub labels..."

# Create labels
gh label create "core" -d "Core ticketing functionality" -c "0052CC" --force 2>/dev/null || true
gh label create "automation" -d "Automation and workflow features" -c "5319E7" --force 2>/dev/null || true
gh label create "omnichannel" -d "Multi-channel support features" -c "1D76DB" --force 2>/dev/null || true
gh label create "knowledge-base" -d "Knowledge base and help center" -c "0E8A16" --force 2>/dev/null || true
gh label create "reporting" -d "Analytics and reporting features" -c "FBCA04" --force 2>/dev/null || true
gh label create "user-management" -d "User roles and permissions" -c "F9D0C4" --force 2>/dev/null || true
gh label create "ai" -d "AI and machine learning features" -c "D93F0B" --force 2>/dev/null || true
gh label create "api" -d "API and integrations" -c "006B75" --force 2>/dev/null || true
gh label create "collaboration" -d "Team collaboration features" -c "BFD4F2" --force 2>/dev/null || true
gh label create "security" -d "Security and compliance" -c "B60205" --force 2>/dev/null || true
gh label create "customization" -d "Customization and branding" -c "C5DEF5" --force 2>/dev/null || true
gh label create "customer-experience" -d "Customer-facing features" -c "7057FF" --force 2>/dev/null || true
gh label create "priority:high" -d "High priority feature" -c "FF0000" --force 2>/dev/null || true
gh label create "priority:medium" -d "Medium priority feature" -c "FFA500" --force 2>/dev/null || true
gh label create "priority:low" -d "Low priority feature" -c "008000" --force 2>/dev/null || true

echo "Labels created!"
echo ""
echo "Creating issues..."

# Function to create issue from markdown file
create_issue_from_file() {
    local file=$1

    # Extract title (first line after #)
    local title=$(grep -m1 "^# " "$file" | sed 's/^# //')

    # Extract labels (line after ## Labels)
    local labels=$(grep -A1 "^## Labels" "$file" | tail -1 | tr -d '`' | tr ',' '\n' | xargs | tr ' ' ',')

    # Read the entire file as body
    local body=$(cat "$file")

    echo "Creating issue: $title"
    echo "Labels: $labels"

    gh issue create --title "$title" --body "$body" --label "$labels"

    echo "Created: $title"
    echo ""
}

# Create issues from all markdown files (excluding README)
for file in .github/ISSUES/0*.md; do
    if [ -f "$file" ]; then
        create_issue_from_file "$file"
        sleep 1  # Rate limiting
    fi
done

echo ""
echo "All issues created successfully!"
echo ""
echo "View issues at: $(gh repo view --json url -q .url)/issues"
