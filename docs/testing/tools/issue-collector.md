# Interactive Issue Collection Workflow

## Overview

This workflow provides a systematic approach for collecting, documenting, and formatting issues discovered during beta testing. It bridges the gap between issue discovery and GitHub issue creation by providing interactive guidance and automated formatting.

## Usage

### When to Use This Workflow
- You've discovered a bug or issue during testing
- You want to report a feature enhancement
- You need to document a problem systematically
- You want to ensure all required information is captured

### How to Activate
Simply tell Claude:
- "I found a bug"
- "I want to report an issue"
- "There's a problem with [feature]"
- "I need to log an issue"

## Interactive Collection Process

### Step 1: Issue Type Identification
Claude will ask you to identify the type of issue:
- **Bug Report**: Something isn't working as expected
- **Feature Request**: New functionality needed
- **Enhancement**: Improvement to existing feature
- **Documentation Issue**: Unclear or missing documentation
- **Question**: Clarification needed about functionality

### Step 2: Basic Information Collection
Claude will gather essential details:
- **Issue summary** (one-line description)
- **Module affected** (Authentication, Members, Events, etc.)
- **User role** (Admin, Pastor, Member)
- **Environment** (Browser, device, OS)
- **Severity level** (Critical, High, Medium, Low)

### Step 3: Detailed Information Gathering
Based on issue type, Claude will collect specific details:

#### For Bug Reports:
- Step-by-step reproduction instructions
- Expected vs actual behavior
- Error messages or console logs
- Screenshots or videos (if available)
- Test data context (Member IDs, Event IDs, etc.)
- Workaround availability

#### For Feature Requests:
- User story format
- Acceptance criteria
- Use cases and benefits
- Integration requirements
- Priority justification

#### For Enhancements:
- Current behavior description
- Desired behavior
- Benefits of the improvement
- Implementation suggestions

### Step 4: Validation and Formatting
Claude will:
- Review collected information for completeness
- Ask clarifying questions if needed
- Format the issue according to GitHub templates
- Suggest appropriate labels and milestones
- Generate ready-to-post GitHub issue content

### Step 5: Local Logging
Claude will:
- Log the issue locally for tracking
- Assign a unique issue ID
- Update issue statistics
- Provide summary for your records

## Interactive Prompts

### Initial Issue Discovery
```
Claude: I see you've encountered an issue. Let me help you document it properly.

1. What type of issue is this?
   - Bug (something not working)
   - Feature request (new functionality)
   - Enhancement (improvement to existing feature)
   - Documentation issue
   - Question/clarification

2. Can you provide a brief summary of the issue?
   (One sentence describing the problem)

3. Which module is affected?
   - Authentication & Login
   - Member Management
   - Event Management
   - Donation Management
   - Sermon Management
   - Volunteer Management
   - Dashboard
   - Other/Multiple
```

### Environment Collection
```
Claude: Let me gather some environment details:

1. What browser are you using?
   - Chrome (version?)
   - Firefox (version?)
   - Safari (version?)
   - Edge (version?)

2. What device are you testing on?
   - Desktop/Laptop
   - Tablet
   - Mobile phone

3. What user role were you testing as?
   - Admin
   - Pastor
   - Member
   - Not logged in
```

### Bug-Specific Questions
```
Claude: Now let's get the details to reproduce this bug:

1. What were you trying to do when this happened?
   (Describe your goal)

2. What steps did you take? Please be specific:
   Step 1: 
   Step 2:
   Step 3:
   (Continue as needed)

3. What did you expect to happen?

4. What actually happened instead?

5. How often does this occur?
   - Always (every time)
   - Often (most times)
   - Sometimes (occasionally)
   - Rarely (hard to reproduce)

6. Are there any error messages? If so, what do they say?

7. Is there a workaround available?
```

### Feature Request Questions
```
Claude: Let's document this feature request:

1. Describe the feature you'd like to see:
   (Detailed description)

2. Let's format this as a user story:
   As a [type of user]
   I want [goal/desire]
   So that [benefit/value]

3. What would make this feature "done"?
   (Acceptance criteria - list specific requirements)

4. Can you describe specific use cases?
   (When and how would this be used?)

5. How important is this feature?
   - Critical (essential for operations)
   - High (would significantly improve workflow)
   - Medium (nice improvement)
   - Low (minor enhancement)
```

## Output Format

### GitHub-Ready Issue Format
After collection, Claude will generate formatted content like:

```markdown
# Bug Report: [Issue Title]

## Environment
- Browser: Chrome 91
- Device: Desktop
- User Role: Admin
- Module: Member Management

## Issue Description
[Detailed description based on collected information]

## Steps to Reproduce
1. [Step 1]
2. [Step 2]
3. [Step 3]

## Expected Behavior
[What should happen]

## Actual Behavior
[What actually happened]

## Additional Information
- Severity: High
- Frequency: Always
- Error Messages: [If any]
- Workaround: [If available]

## Suggested Labels
- type: bug
- module: members
- severity: high
- priority: medium
```

### Local Issue Log Entry
```
Issue ID: ISSUE-001
Date: 2025-07-17
Type: Bug
Module: Member Management
Reporter: [User]
Status: Reported
GitHub Status: Ready for posting
```

## Benefits

### For Beta Testers
- **Guided Process**: No guesswork about what information to provide
- **Complete Documentation**: Ensures all necessary details are captured
- **Consistent Format**: Same high-quality format every time
- **Time Saving**: Faster than manually filling out templates

### For Development Team
- **Complete Information**: All issues include necessary details for reproduction
- **Standardized Format**: Consistent structure makes triage easier
- **Proper Classification**: Appropriate labels and severity levels
- **Immediate Readiness**: Issues are ready for GitHub posting

### For Project Management
- **Local Tracking**: Maintain issue history and statistics
- **Pattern Recognition**: Identify common issues and trends
- **Progress Monitoring**: Track issue discovery and resolution rates
- **Quality Metrics**: Monitor testing coverage and effectiveness

## Next Steps After Collection

1. **Copy the formatted issue** to your clipboard
2. **Go to GitHub Issues** (repository URL will be provided)
3. **Click "New Issue"** and select appropriate template
4. **Paste the formatted content** into the issue form
5. **Apply suggested labels** and milestone
6. **Submit the issue**
7. **Inform Claude** of the GitHub issue number for local tracking

## Integration with Other Tools

- **Links to GitHub Templates**: References the YAML templates for consistency
- **Connects to Issue Logging Framework**: Uses the same classification system
- **Integrates with Testing Checklist**: Can reference specific test scenarios
- **Supports Feedback Collection**: Can be used during feedback sessions

---

**Note**: This workflow is designed to make issue reporting as smooth and complete as possible while maintaining the human verification step for GitHub posting.