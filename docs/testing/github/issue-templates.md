# GitHub Issue Templates Setup

## Overview

This document provides the complete set of GitHub issue templates for the Shepherd Church Management System beta testing process. These templates should be added to the repository's `.github/ISSUE_TEMPLATE/` directory to provide standardized issue reporting.

## Repository Setup Instructions

### Step 1: Create Issue Template Directory

In your GitHub repository, create the following directory structure:
```
.github/
└── ISSUE_TEMPLATE/
    ├── bug_report.yml
    ├── feature_request.yml
    ├── enhancement.yml
    ├── documentation.yml
    ├── question.yml
    └── config.yml
```

### Step 2: Add Template Files

Copy each template below into the corresponding file in your repository.

## Template Files

### 1. Bug Report Template (`bug_report.yml`)

```yaml
name: 🐛 Bug Report
description: Report a bug found during beta testing
title: '[BUG] Brief description of the issue'
labels: ['type: bug', 'status: new']
assignees: []
body:
  - type: markdown
    attributes:
      value: |
        Thank you for taking the time to report a bug! Please fill out the information below to help us understand and resolve the issue quickly.

  - type: input
    id: summary
    attributes:
      label: Bug Summary
      description: Provide a brief, clear summary of the bug
      placeholder: 'Example: Login button not working on mobile devices'
    validations:
      required: true

  - type: textarea
    id: description
    attributes:
      label: Detailed Description
      description: Provide a detailed explanation of what's wrong
      placeholder: Describe the bug in detail, including what you expected to happen vs what actually happened
    validations:
      required: true

  - type: textarea
    id: steps
    attributes:
      label: Steps to Reproduce
      description: List the exact steps to reproduce this bug
      placeholder: |
        1. Go to the login page
        2. Enter valid credentials
        3. Click the login button
        4. Notice that nothing happens
    validations:
      required: true

  - type: textarea
    id: expected
    attributes:
      label: Expected Behavior
      description: What should happen?
      placeholder: Describe what you expected to happen
    validations:
      required: true

  - type: textarea
    id: actual
    attributes:
      label: Actual Behavior
      description: What actually happened?
      placeholder: Describe what actually happened instead
    validations:
      required: true

  - type: dropdown
    id: browser
    attributes:
      label: Browser
      description: Which browser are you using?
      options:
        - Chrome
        - Firefox
        - Safari
        - Edge
        - Other (specify in additional context)
    validations:
      required: true

  - type: dropdown
    id: device
    attributes:
      label: Device Type
      description: What type of device are you using?
      options:
        - Desktop
        - Laptop
        - Tablet
        - Mobile Phone
        - Other (specify in additional context)
    validations:
      required: true

  - type: dropdown
    id: user-role
    attributes:
      label: User Role
      description: What role were you testing as?
      options:
        - Admin
        - Pastor
        - Member
        - Anonymous/Not logged in
    validations:
      required: true

  - type: dropdown
    id: severity
    attributes:
      label: Severity
      description: How severe is this bug?
      options:
        - Critical (System crash, data loss, security issue)
        - High (Major functionality broken)
        - Medium (Minor functionality issue, workaround available)
        - Low (Cosmetic issue, minimal impact)
    validations:
      required: true

  - type: dropdown
    id: frequency
    attributes:
      label: Frequency
      description: How often does this bug occur?
      options:
        - Always (100% of the time)
        - Often (75% of the time)
        - Sometimes (50% of the time)
        - Rarely (25% of the time)
        - Once (happened only once)
    validations:
      required: true

  - type: input
    id: test-data
    attributes:
      label: Test Data Context
      description: Relevant IDs or test data used (Member ID, Event ID, etc.)
      placeholder: 'Example: Member ID: 123, Event: "Sunday Service"'

  - type: textarea
    id: console-errors
    attributes:
      label: Console Errors
      description: Any JavaScript errors from browser console (F12 > Console tab)
      placeholder: Paste any error messages from the browser console
      render: text

  - type: textarea
    id: additional-context
    attributes:
      label: Additional Context
      description: Add any other context about the problem here
      placeholder: Screenshots, videos, or any other relevant information

  - type: checkboxes
    id: checklist
    attributes:
      label: Checklist
      description: Please confirm you have completed these steps
      options:
        - label: I have searched for existing issues to avoid duplicates
          required: true
        - label: I have provided all the required information above
          required: true
        - label: I can reproduce this bug consistently
          required: true
```

### 2. Feature Request Template (`feature_request.yml`)

```yaml
name: 🚀 Feature Request
description: Request a completely new feature
title: '[FEATURE] Brief description of the new feature'
labels: ['type: feature', 'status: new']
assignees: []
body:
  - type: markdown
    attributes:
      value: |
        Thank you for suggesting a new feature! Please provide as much detail as possible to help us understand your request.

  - type: input
    id: feature-name
    attributes:
      label: Feature Name
      description: What would you call this feature?
      placeholder: 'Example: Member Photo Gallery'
    validations:
      required: true

  - type: textarea
    id: description
    attributes:
      label: Feature Description
      description: Provide a detailed description of the requested feature
      placeholder: Describe what this feature would do and how it would work
    validations:
      required: true

  - type: textarea
    id: user-story
    attributes:
      label: User Story
      description: Describe this feature as a user story
      placeholder: |
        As a [type of user]
        I want [goal/desire]
        So that [benefit/value]
    validations:
      required: true

  - type: textarea
    id: acceptance-criteria
    attributes:
      label: Acceptance Criteria
      description: What needs to be true for this feature to be considered complete?
      placeholder: |
        - [ ] Criterion 1
        - [ ] Criterion 2
        - [ ] Criterion 3
    validations:
      required: true

  - type: textarea
    id: use-cases
    attributes:
      label: Use Cases
      description: Describe specific scenarios where this feature would be used
      placeholder: |
        1. Use Case 1: Description
        2. Use Case 2: Description
        3. Use Case 3: Description
    validations:
      required: true

  - type: dropdown
    id: user-role
    attributes:
      label: Primary User Role
      description: Which user role would primarily benefit from this feature?
      options:
        - Admin
        - Pastor
        - Member
        - All Users
        - Anonymous/Public
    validations:
      required: true

  - type: dropdown
    id: priority
    attributes:
      label: Priority Level
      description: How important is this feature?
      options:
        - High (Essential for church operations)
        - Medium (Would significantly improve workflow)
        - Low (Nice to have enhancement)
    validations:
      required: true

  - type: textarea
    id: business-value
    attributes:
      label: Business Value
      description: Why would this feature be valuable to the church management system?
      placeholder: Explain the benefits and value this feature would provide

  - type: textarea
    id: integration
    attributes:
      label: Integration with Existing Features
      description: How would this feature integrate with current modules?
      placeholder: Describe how this would work with members, events, donations, etc.

  - type: textarea
    id: alternatives
    attributes:
      label: Alternative Solutions
      description: Are there any existing workarounds or alternative approaches?
      placeholder: Describe any current workarounds or alternative solutions

  - type: textarea
    id: mockups
    attributes:
      label: UI/UX Ideas
      description: Any ideas about how this should look or behave?
      placeholder: Describe the user interface or attach mockups/sketches
```

### 3. Enhancement Template (`enhancement.yml`)

```yaml
name: ✨ Enhancement Request
description: Suggest an improvement to existing functionality
title: '[ENHANCEMENT] Brief description of the enhancement'
labels: ['type: enhancement', 'status: new']
assignees: []
body:
  - type: markdown
    attributes:
      value: |
        Thank you for suggesting an improvement! Please describe how we can make an existing feature better.

  - type: dropdown
    id: module
    attributes:
      label: Module/Feature to Enhance
      description: Which existing feature needs improvement?
      options:
        - Authentication & Login
        - Member Management
        - Household Management
        - Event Management
        - Donation Management
        - Sermon Management
        - Volunteer Management
        - Dashboard & Reports
        - Other (specify below)
    validations:
      required: true

  - type: textarea
    id: current-behavior
    attributes:
      label: Current Behavior
      description: How does the feature currently work?
      placeholder: Describe the current functionality
    validations:
      required: true

  - type: textarea
    id: desired-behavior
    attributes:
      label: Desired Behavior
      description: How would you like the feature to work instead?
      placeholder: Describe your proposed improvement
    validations:
      required: true

  - type: textarea
    id: user-story
    attributes:
      label: User Story
      description: Describe this enhancement as a user story
      placeholder: |
        As a [type of user]
        I want [goal/desire]
        So that [benefit/value]
    validations:
      required: true

  - type: textarea
    id: benefits
    attributes:
      label: Benefits
      description: What benefits would this enhancement provide?
      placeholder: |
        - Benefit 1
        - Benefit 2
        - Benefit 3
    validations:
      required: true

  - type: dropdown
    id: user-role
    attributes:
      label: User Role
      description: Which role would primarily benefit from this enhancement?
      options:
        - Admin
        - Pastor
        - Member
        - All Users
    validations:
      required: true

  - type: dropdown
    id: impact
    attributes:
      label: Impact Level
      description: How much would this enhancement improve the user experience?
      options:
        - High (Significantly improves workflow)
        - Medium (Moderately improves experience)
        - Low (Minor improvement)
    validations:
      required: true

  - type: textarea
    id: implementation
    attributes:
      label: Implementation Ideas
      description: Any suggestions about how this could be implemented?
      placeholder: Optional - share any ideas about implementation

  - type: textarea
    id: context
    attributes:
      label: Additional Context
      description: Any other relevant information
      placeholder: Screenshots, examples, or other context
```

### 4. Documentation Template (`documentation.yml`)

```yaml
name: 📚 Documentation Issue
description: Report issues with documentation or request clarification
title: '[DOCS] Brief description of documentation issue'
labels: ['type: documentation', 'status: new']
assignees: []
body:
  - type: markdown
    attributes:
      value: |
        Help us improve our documentation! Report unclear, missing, or incorrect information.

  - type: dropdown
    id: doc-type
    attributes:
      label: Documentation Type
      description: What type of documentation needs attention?
      options:
        - Beta Testing Guide
        - User Manual/Instructions
        - Test Scenarios
        - API Documentation
        - Setup/Installation Guide
        - FAQ/Troubleshooting
        - Other (specify below)
    validations:
      required: true

  - type: input
    id: document
    attributes:
      label: Document/Page
      description: Which specific document or page has the issue?
      placeholder: 'Example: Beta Tester Onboarding Guide, Section 3.2'
    validations:
      required: true

  - type: dropdown
    id: issue-type
    attributes:
      label: Issue Type
      description: What kind of documentation issue is this?
      options:
        - Unclear/Confusing
        - Missing Information
        - Incorrect Information
        - Outdated Information
        - Typo/Grammar
        - Broken Link
        - Missing Screenshot/Example
    validations:
      required: true

  - type: textarea
    id: current-content
    attributes:
      label: Current Documentation
      description: Quote or describe the current documentation (if applicable)
      placeholder: Copy the current text or describe what exists now

  - type: textarea
    id: issue-description
    attributes:
      label: Issue Description
      description: What's wrong, unclear, or missing?
      placeholder: Explain the specific problem with the documentation
    validations:
      required: true

  - type: textarea
    id: suggested-improvement
    attributes:
      label: Suggested Improvement
      description: How should the documentation be changed?
      placeholder: Provide your suggested correction or addition
    validations:
      required: true

  - type: dropdown
    id: user-context
    attributes:
      label: User Context
      description: From whose perspective is this documentation unclear?
      options:
        - New Beta Tester
        - Experienced Beta Tester
        - Admin User
        - Pastor User
        - Member User
        - Developer/Technical User
    validations:
      required: true

  - type: dropdown
    id: urgency
    attributes:
      label: Impact on Testing
      description: How does this documentation issue affect beta testing?
      options:
        - Blocking (Cannot complete testing without this)
        - Hindering (Slows down testing progress)
        - Minor (Causes slight confusion)
        - Enhancement (Would be nice to have)
    validations:
      required: true

  - type: textarea
    id: context
    attributes:
      label: Additional Context
      description: Any other relevant information
      placeholder: Screenshots, links, or other helpful context
```

### 5. Question Template (`question.yml`)

```yaml
name: ❓ Question
description: Ask a question about functionality or testing
title: '[QUESTION] Brief description of your question'
labels: ['type: question', 'status: new']
assignees: []
body:
  - type: markdown
    attributes:
      value: |
        Have a question? We're here to help! Please provide as much context as possible.

  - type: textarea
    id: question
    attributes:
      label: Your Question
      description: What would you like to know?
      placeholder: Ask your specific question here
    validations:
      required: true

  - type: dropdown
    id: category
    attributes:
      label: Question Category
      description: What is your question about?
      options:
        - How to use a feature
        - Expected behavior clarification
        - Test scenario guidance
        - Account/access issues
        - Technical difficulties
        - General system functionality
        - Beta testing process
        - Other
    validations:
      required: true

  - type: textarea
    id: context
    attributes:
      label: Context
      description: What are you trying to accomplish?
      placeholder: Describe what you're trying to do and why
    validations:
      required: true

  - type: textarea
    id: attempted
    attributes:
      label: What I've Tried
      description: What steps have you already taken?
      placeholder: List what you've already tried or attempted

  - type: dropdown
    id: user-role
    attributes:
      label: User Role
      description: What role are you testing as?
      options:
        - Admin
        - Pastor
        - Member
        - Not sure/Not applicable
    validations:
      required: true

  - type: dropdown
    id: module
    attributes:
      label: Related Module
      description: Which part of the system is your question about?
      options:
        - Authentication & Login
        - Member Management
        - Household Management
        - Event Management
        - Donation Management
        - Sermon Management
        - Volunteer Management
        - Dashboard & Reports
        - General/Multiple modules
        - Not sure
    validations:
      required: true

  - type: dropdown
    id: urgency
    attributes:
      label: Urgency
      description: Is this blocking your testing progress?
      options:
        - Urgent (Blocking all testing)
        - High (Blocking current module testing)
        - Medium (Slowing down progress)
        - Low (Not blocking, just curious)
    validations:
      required: true

  - type: textarea
    id: additional-context
    attributes:
      label: Additional Context
      description: Any other relevant information
      placeholder: Screenshots, error messages, or other helpful details
```

### 6. Config File (`config.yml`)

```yaml
blank_issues_enabled: false
contact_links:
  - name: 🚀 Beta Testing Guide
    url: https://github.com/[YOUR-USERNAME]/shepherd/blob/main/docs/testing/beta-testing-overview.md
    about: Complete guide to beta testing the Shepherd Church Management System
  - name: 📋 Testing Checklist
    url: https://github.com/[YOUR-USERNAME]/shepherd/blob/main/docs/testing/testing-checklist.md
    about: Master checklist for comprehensive testing coverage
  - name: 📧 Direct Contact
    url: mailto:beta-testing@yourchurch.com
    about: Email the beta testing coordinator directly for urgent issues
  - name: 💬 Discussion Forum
    url: https://github.com/[YOUR-USERNAME]/shepherd/discussions
    about: Community discussions and general questions
```

## Setup Instructions for Repository

### Step 1: Create the Directory Structure

1. Navigate to your GitHub repository
2. Create a new folder: `.github`
3. Inside `.github`, create folder: `ISSUE_TEMPLATE`
4. Create each template file with the content above

### Step 2: Customize the Templates

1. **Update Repository URLs**: Replace `[YOUR-USERNAME]` with actual GitHub username
2. **Update Contact Information**: Replace email addresses with actual contacts
3. **Adjust Labels**: Ensure labels match your repository's label system
4. **Modify Options**: Customize dropdown options to match your specific needs

### Step 3: Configure Repository Labels

Create the following labels in your repository:

**Type Labels:**
- `type: bug` (color: #d73a49)
- `type: enhancement` (color: #a2eeef)
- `type: feature` (color: #0075ca)
- `type: documentation` (color: #0052cc)
- `type: question` (color: #d876e3)

**Status Labels:**
- `status: new` (color: #ffffff)
- `status: investigating` (color: #fbca04)
- `status: in-progress` (color: #0052cc)
- `status: resolved` (color: #28a745)
- `status: needs-info` (color: #f9d0c4)

**Severity Labels:**
- `severity: critical` (color: #b60205)
- `severity: high` (color: #d93f0b)
- `severity: medium` (color: #fbca04)
- `severity: low` (color: #0e8a16)

**Module Labels:**
- `module: authentication` (color: #5319e7)
- `module: members` (color: #1d76db)
- `module: households` (color: #0052cc)
- `module: events` (color: #0e8a16)
- `module: donations` (color: #b60205)
- `module: sermons` (color: #d876e3)
- `module: volunteers` (color: #f9d0c4)
- `module: dashboard` (color: #fbca04)

### Step 4: Test the Templates

1. Go to Issues tab in your repository
2. Click "New Issue"
3. Verify all templates appear correctly
4. Test creating an issue with each template
5. Confirm all fields and validations work

### Step 5: Train Beta Testers

1. Share the issue reporting process with beta testers
2. Provide examples of well-written issues
3. Demonstrate how to select appropriate templates
4. Explain the importance of complete information

## Best Practices for Issue Templates

### Template Design Principles
- **Required Fields**: Mark essential information as required
- **Clear Labels**: Use descriptive field labels and help text
- **Logical Flow**: Order fields in a logical sequence
- **Validation**: Include appropriate validation for data quality
- **Examples**: Provide examples in placeholder text

### Maintenance Guidelines
- **Regular Review**: Review templates quarterly for improvements
- **User Feedback**: Gather feedback from beta testers on template usability
- **Content Updates**: Update based on common issues or missing information
- **Label Consistency**: Ensure labels match repository label system

---

**Document Version**: 1.0  
**Last Updated**: July 17, 2025  
**Next Review**: Monthly during beta testing  
**Responsible Team**: Development Team + Beta Testing Coordinator