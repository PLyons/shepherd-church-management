# GitHub Issue Formatter Tool

## Overview

This tool provides automated formatting of collected issue information into GitHub-ready markdown that matches the project's issue templates. It ensures consistent, complete, and properly formatted issues for efficient triage and resolution.

## Supported Issue Types

### 1. Bug Reports
Formats collected bug information into the bug report template with:
- Environment details
- Reproduction steps
- Expected vs actual behavior
- Error information
- Severity and priority classification

### 2. Feature Requests
Formats feature requests into the feature request template with:
- User story format
- Acceptance criteria
- Use cases and benefits
- Priority justification
- Integration considerations

### 3. Enhancement Requests
Formats enhancement suggestions into the enhancement template with:
- Current vs desired behavior
- Benefits analysis
- Implementation suggestions
- Impact assessment

### 4. Documentation Issues
Formats documentation problems into the documentation template with:
- Document identification
- Issue description
- Suggested improvements
- User context

### 5. Questions
Formats questions into the question template with:
- Question context
- Attempted solutions
- Urgency level
- Related modules

## Formatting Functions

### Bug Report Formatter

```markdown
# Bug Report Template Output

**Title**: [BUG] [One-line summary]

**Labels**: type: bug, severity: [level], module: [module], status: new

**Environment Information**:
- Browser: [Browser and version]
- Device: [Device type]
- Operating System: [OS details]
- User Role: [Admin/Pastor/Member]

**Bug Description**:
**Brief Summary**: [One-line description]
**Detailed Description**: [Comprehensive explanation]

**Steps to Reproduce**:
1. [Step 1]
2. [Step 2]
3. [Step 3]

**Expected Behavior**: [What should happen]
**Actual Behavior**: [What actually happened]

**Additional Context**:
- **Severity**: [Critical/High/Medium/Low]
- **Frequency**: [Always/Often/Sometimes/Rarely]
- **Test Data Context**: [Relevant IDs or data]
- **Console Errors**: [Any JavaScript errors]
- **Workaround Available**: [Yes/No - describe if yes]

**Evidence**: [Screenshots/videos to be attached]
```

### Feature Request Formatter

```markdown
# Feature Request Template Output

**Title**: [FEATURE] [Feature name]

**Labels**: type: feature, priority: [level], module: [module], status: new

**Feature Description**:
**Feature Name**: [Short name]
**Detailed Description**: [Comprehensive description]

**User Story**:
As a [type of user]
I want [goal/desire]
So that [benefit/value]

**Acceptance Criteria**:
- [ ] [Criterion 1]
- [ ] [Criterion 2]
- [ ] [Criterion 3]

**Use Cases**:
1. **Use Case 1**: [Description]
2. **Use Case 2**: [Description]
3. **Use Case 3**: [Description]

**Business Value**: [Why this feature is valuable]

**Priority and Timeline**:
**Priority Level**: [High/Medium/Low]
**Desired Timeline**: [When this would be most valuable]

**Integration Points**: [How this integrates with existing modules]
```

### Enhancement Formatter

```markdown
# Enhancement Template Output

**Title**: [ENHANCEMENT] [Brief description]

**Labels**: type: enhancement, impact: [level], module: [module], status: new

**Enhancement Description**:
**Feature to Enhance**: [Existing feature]
**Proposed Enhancement**: [Detailed improvement description]

**Current Behavior**: [How it currently works]
**Desired Behavior**: [How it should work]

**User Story**:
As a [type of user]
I want [goal/desire]
So that [benefit/value]

**Benefits**:
- [Benefit 1]
- [Benefit 2]
- [Benefit 3]

**Impact Level**: [High/Medium/Low] - [Justification]
**Implementation Ideas**: [Suggestions for implementation]
```

## Label Suggestion Engine

### Automatic Label Generation
Based on collected information, the formatter automatically suggests appropriate labels:

#### Type Labels (Required)
- `type: bug` - For bugs and defects
- `type: feature` - For new feature requests
- `type: enhancement` - For improvements to existing features
- `type: documentation` - For documentation issues
- `type: question` - For questions and clarifications

#### Severity Labels (For bugs)
- `severity: critical` - System crashes, data loss, security issues
- `severity: high` - Major functionality broken
- `severity: medium` - Minor issues with workarounds
- `severity: low` - Cosmetic or minor impact

#### Priority Labels
- `priority: urgent` - Blocking beta testing
- `priority: high` - Important for beta completion
- `priority: medium` - Standard priority
- `priority: low` - Nice to have

#### Module Labels
- `module: authentication` - Login, roles, permissions
- `module: members` - Member management, profiles
- `module: households` - Household management
- `module: events` - Calendar, event management
- `module: donations` - Financial management
- `module: sermons` - Sermon archive, uploads
- `module: volunteers` - Volunteer scheduling
- `module: dashboard` - Statistics, overview

#### Status Labels
- `status: new` - Newly reported (default)
- `status: investigating` - Under investigation
- `status: in-progress` - Being worked on
- `status: resolved` - Fixed/addressed
- `status: needs-info` - More information needed

## Integration with GitHub Templates

### Template Compatibility
The formatter ensures output matches the YAML templates in `/docs/testing/github/issue-templates.md`:

- **Field Mapping**: Maps collected information to template fields
- **Validation**: Ensures all required fields are populated
- **Format Consistency**: Maintains consistent markdown formatting
- **Label Alignment**: Uses the same label system as templates

### Template Selection Guide
```
Bug discovered → Use bug_report.yml template
New feature needed → Use feature_request.yml template
Existing feature improvement → Use enhancement.yml template
Documentation problem → Use documentation.yml template
Need clarification → Use question.yml template
```

## Quality Assurance Features

### Completeness Checking
- **Required Fields**: Ensures all mandatory information is present
- **Detail Validation**: Checks for sufficient detail in descriptions
- **Step Verification**: Validates reproduction steps are clear
- **Context Confirmation**: Ensures environment details are complete

### Format Validation
- **Markdown Syntax**: Ensures proper markdown formatting
- **Template Compliance**: Validates against GitHub template structure
- **Label Consistency**: Checks label format and availability
- **Length Limits**: Ensures content fits GitHub field limits

### Enhancement Suggestions
- **Detail Prompts**: Suggests additional information that would be helpful
- **Clarity Improvements**: Recommends clearer wording or structure
- **Priority Guidance**: Helps determine appropriate priority levels
- **Label Recommendations**: Suggests additional relevant labels

## Usage Examples

### Example 1: Bug Report
**Input Information**:
- Type: Bug
- Summary: "Login button doesn't work on mobile"
- Module: Authentication
- Browser: Safari Mobile
- Steps: 1. Open app on iPhone, 2. Enter credentials, 3. Tap login
- Expected: Should log in
- Actual: Nothing happens
- Severity: High

**Formatted Output**:
```markdown
# [BUG] Login button doesn't work on mobile Safari

## Environment Information
- Browser: Safari Mobile
- Device: iPhone
- User Role: Member
- Module: Authentication

## Bug Description
**Brief Summary**: Login button doesn't respond when tapped on mobile Safari

**Detailed Description**: When accessing the login page on mobile Safari, the login button appears but doesn't respond to touch events, preventing users from logging in.

## Steps to Reproduce
1. Open application on iPhone using Safari browser
2. Navigate to login page
3. Enter valid credentials (admin@test.com / password123)
4. Tap the login button
5. Observe no response

## Expected Behavior
User should be logged in and redirected to dashboard

## Actual Behavior
Login button doesn't respond to touch events, no login occurs

## Additional Context
- **Severity**: High
- **Frequency**: Always
- **Console Errors**: [To be checked]
- **Workaround Available**: Works on desktop browsers

## Suggested Labels
- type: bug
- severity: high
- module: authentication
- platform: mobile
- browser: safari
```

### Example 2: Feature Request
**Input Information**:
- Type: Feature Request
- Name: "Member Photo Gallery"
- User Story: As a pastor, I want to see member photos in the directory
- Benefits: Better member recognition, improved pastoral care
- Priority: Medium

**Formatted Output**:
```markdown
# [FEATURE] Member Photo Gallery

## Feature Description
**Feature Name**: Member Photo Gallery
**Detailed Description**: Add photo upload and display functionality to member profiles and directory listings

## User Story
As a pastor
I want to see member photos in the directory and profiles
So that I can better recognize members and provide personalized pastoral care

## Acceptance Criteria
- [ ] Members can upload profile photos
- [ ] Photos display in member directory
- [ ] Photos show in individual member profiles
- [ ] Photos are properly sized and formatted
- [ ] Photo upload validates file types and sizes

## Business Value
Improves member recognition and enables better pastoral care by providing visual identification of congregation members

## Priority and Timeline
**Priority Level**: Medium
**Desired Timeline**: Next release cycle

## Suggested Labels
- type: feature
- priority: medium
- module: members
```

## Integration Points

### With Issue Collection Workflow
- Receives structured information from interactive collection
- Formats collected data into appropriate templates
- Maintains consistency with collection process

### With GitHub Templates
- Maps to YAML template structure
- Ensures field compatibility
- Maintains label consistency

### With Issue Logging Framework
- Uses same classification system
- Follows documentation standards
- Integrates with tracking processes

### With Beta Testing Process
- Supports systematic testing workflows
- Integrates with feedback collection
- Maintains testing documentation standards

## Best Practices

### For Optimal Results
1. **Complete Information**: Ensure all collected information is comprehensive
2. **Clear Language**: Use clear, professional language in all fields
3. **Proper Classification**: Choose appropriate severity and priority levels
4. **Sufficient Detail**: Provide enough information for reproduction and understanding
5. **Consistent Format**: Follow the established template structure

### Quality Guidelines
- **Reproducible Steps**: Ensure steps can be followed by others
- **Specific Details**: Include specific versions, IDs, and configurations
- **Clear Expectations**: Clearly state expected vs actual behavior
- **Appropriate Severity**: Match severity to actual impact
- **Helpful Context**: Include relevant background information

---

**Note**: This formatter ensures that all GitHub issues maintain high quality and consistency, making them easier to triage, understand, and resolve.