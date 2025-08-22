# Product Requirement Prompts (PRPs)

**Last Updated:** 2025-08-21  
**Status:** Active Development System  

## Overview

Product Requirement Prompts (PRPs) are detailed, executable implementation instructions that provide comprehensive guidance for implementing specific features or enhancements. Each PRP contains all the context, requirements, and step-by-step procedures needed for a developer or AI agent to successfully complete the task.

## PRP Philosophy

### Design Principles
- **Self-Contained**: Each PRP includes all necessary context and requirements
- **Executable**: Clear, actionable procedures that can be followed step-by-step
- **Testable**: Success criteria and testing procedures for validation
- **Safe**: Rollback plans for safe implementation
- **Sequential**: PRPs build on each other in logical order

### When to Use PRPs
- Complex feature implementations requiring multiple components
- UI/UX enhancements with specific design requirements
- System architecture changes affecting multiple files
- Integration projects with external services
- Performance optimization initiatives

## Current Active Phases

### Phase 0.2: Member Profile UI Enhancements
**Status:** Planning Complete, Ready for Implementation  
**Start Date:** 2025-08-21  
**Target Completion:** 2025-08-28  

**Overview:** Comprehensive redesign of member profile interface inspired by Planning Center's professional design patterns optimized for Shepherd's desktop-first administrative workflows.

**Documentation:** [Phase 0.2 PRPs](phase-0.2-member-profile/)

**PRPs:** 11 sequential implementation prompts covering:
- UI structure and navigation
- Information architecture
- Household integration  
- Enhanced interactions
- Mobile optimization
- Accessibility compliance
- Performance optimization
- Quality assurance

## PRP Structure

Each PRP follows a consistent format:

```markdown
# PRP-XXX: [Title]

**Phase:** [Phase identifier]
**Status:** Not Started | In Progress | Complete  
**Priority:** High | Medium | Low  
**Estimated Effort:** X days  
**Dependencies:** [List other PRPs]  

## Purpose
[Clear description of what this PRP accomplishes]

## Requirements
[Technical requirements and dependencies]

## Context
[Background information and current state]

## Success Criteria
[Measurable outcomes and testing requirements]

## Implementation Procedure
[Detailed step-by-step instructions]

## Testing Plan
[Verification procedures]

## Rollback Plan
[Safe reversion procedures]
```

## Implementation Guidelines

### Preparation
1. **Read the entire PRP** before starting implementation
2. **Check dependencies** - ensure prerequisite PRPs are complete
3. **Verify requirements** - ensure all dependencies are available
4. **Review context** - understand the current state and goals

### Execution
1. **Follow procedures sequentially** - don't skip steps
2. **Test incrementally** - verify each major step
3. **Document issues** - note any deviations or problems
4. **Update status** - mark PRP progress in project tracker

### Completion
1. **Run all tests** - verify success criteria are met
2. **Update documentation** - reflect any changes
3. **Mark complete** - update PRP status
4. **Review next PRP** - prepare for dependent tasks

## Quality Standards

### Code Quality
- Follow existing code conventions and patterns
- Maintain TypeScript strict typing
- Include comprehensive error handling
- Add appropriate logging and debugging

### Testing Requirements
- Unit tests for new components
- Integration tests for workflows
- Manual testing for UI/UX
- Accessibility testing with screen readers

### Documentation Standards
- Update relevant documentation files
- Include inline code comments
- Document any architectural decisions
- Update API documentation if needed

## Directory Structure

```
docs/prps/
├── README.md                          # This file
├── phase-0.2-member-profile/          # Phase 0.2 PRPs
│   ├── README.md                      # Phase overview
│   ├── PRP-001-header-redesign.md     # Header enhancement
│   ├── PRP-002-tabbed-navigation.md   # Tab implementation
│   └── [... additional PRPs]
└── [future-phases]/                   # Future PRP phases
```

## Getting Help

### For Developers
- **Primary Reference:** Always check CLAUDE.md first
- **Current PRPs:** This directory for implementation details
- **MCP Servers:** Use Serena for code analysis, Context7 for documentation

### For Project Managers
- **Progress Tracking:** Check project_tracker.md
- **Overview:** Review phase README files
- **Status Updates:** PRP completion status in tracker

### For Architects
- **Technical Details:** Individual PRP files
- **Dependencies:** Phase README dependency graphs
- **Architecture Impact:** CLAUDE.md and technical documentation

## Best Practices

### PRP Creation
- **Start with user value** - clearly define the benefit
- **Include sufficient context** - don't assume prior knowledge
- **Make it executable** - provide exact file paths and code examples
- **Plan for failure** - include error handling and rollback procedures

### PRP Execution
- **Read completely first** - understand the full scope
- **Validate dependencies** - ensure prerequisites are met
- **Test early and often** - don't wait until the end
- **Document deviations** - explain any changes to the plan

### PRP Maintenance
- **Update for changes** - keep PRPs current with codebase
- **Archive completed phases** - move to appropriate folders
- **Learn from execution** - improve future PRP quality
- **Share knowledge** - document lessons learned

---

*PRPs are living documents that evolve with the project. Always refer to the latest version and contribute improvements based on implementation experience.*