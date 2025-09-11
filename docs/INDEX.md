# Documentation Index - Shepherd Church Management System

**Last Updated:** 2025-09-11  
**Project Status:** Phase 2C Donation Tracking - Foundation & Member UI Complete with TDD  

Welcome to the Shepherd CMS documentation hub. This index provides quick access to all project documentation organized by topic and audience.

---

## 🚀 Getting Started

| Document | Description | Audience |
|----------|-------------|----------|
| [README.md](../README.md) | Project overview and quick start guide | All Users |
| [Development Guide](development-guide.md) | Complete development setup | Developers |
| [Deployment Guide](deployment.md) | Firebase + Vercel deployment instructions | DevOps |

---

## 📋 Project Management

| Document | Description | Last Updated |
|----------|-------------|---------------|
| [**PROJECT_STATUS.md**](PROJECT_STATUS.md) | **📍 PRIMARY SOURCE OF TRUTH** | **2025-09-11** |
| [PRD](prd.md) | Product Requirements Document | Original spec |
| [Project Tracker](project_tracker.md) | Historical phase progress | 2025-08-16 |
| [Current Features](current-features.md) | Legacy feature documentation | Superseded |
| [Session Context](SESSION_CONTEXT.md) | Legacy development context | 2025-08-16 |
| [**PRPs Directory**](prps/) | **Product Requirement Prompts** | **2025-08-21** |

---

## 🛠️ Technical Documentation

### Core Architecture
| Document | Description | Status |
|----------|-------------|--------|
| [CLAUDE.md](../CLAUDE.md) | **Primary technical reference** | ✅ Current |
| [Firebase Schema](firebase/firestore-schema-design.md) | Database structure | ✅ Current |
| [Firebase Migration Guide](firebase/migration-guide.md) | Migration documentation | ✅ Complete |

### Security & Roles
| Document | Description | Importance |
|----------|-------------|------------|
| [Security Roles Design](security-roles-design.md) | Role-based access control | Critical |
| [Security Implementation](security-implementation-summary.md) | Current security status | High |

### Development Guides
| Document | Description | For |
|----------|-------------|-----|
| [Code Quality Progress](code-quality-audit-progress.md) | Linting and type safety | Developers |
| [TypeScript Error Resolution](typescript-error-resolution.md) | Common TS fixes | Developers |
| [Clean Removal Guide](clean-removal-guide.md) | Code cleanup patterns | Developers |

### Test-Driven Development (TDD)
| Document | Description | Purpose |
|----------|-------------|---------|
| [**TDD Quick Reference**](TDD-QUICK-REFERENCE.md) | Essential commands and patterns | **Daily TDD workflow** |
| [**Agent TDD Workflow**](AGENT-TDD-WORKFLOW.md) | Step-by-step implementation guide | **Comprehensive TDD process** |
| [**Phase 2C Test Examples**](prps/phase-2c-donations/) | Working TDD implementations | **Reference patterns** |

**TDD Status:** ✅ **ESTABLISHED** - 151+ passing tests demonstrate excellence in TDD methodology  
**Coverage Standards:** 80% minimum / 90% core logic / 95% financial & security  
**Primary Interface:** Use `agents.md` for TDD-compliant development tasks

---

## 🎯 Feature-Specific Documentation

### Authentication & Registration
- **QR Registration:** [PRD QR Self-Registration](prd-qr-self-registration.md)
- **Authentication:** Covered in CLAUDE.md and Development Guide
- **User Roles:** Detailed in Security Roles Design

### Member & Household Management
- **Enhanced Member Forms (Phase 0.1 ✅):** Professional contact management complete
- **Member Profile Enhancement (Phase 0.2 🔧):** 
  - [Original PRP Suite](prps/phase-0.2-member-profile/) - PRPs 005-012
  - **[Corrective PRPs](prps/phase-0.2-member-profile/)** - PRPs 101-106 (Layout fixes required)
  - PRP-005 (Inline Editing) completed, revealed layout issues
- **Current Implementation:** [Current Features](current-features.md)
- **Data Models:** [Firebase Schema](firebase/firestore-schema-design.md)
- **Service Layer:** Documented in CLAUDE.md
- **Testing:** [Manual Testing Guide](../MANUAL-TESTING-GUIDE.md) and [Firestore Data Verification](../FIRESTORE-DATA-VERIFICATION.md)

---

## 🔧 Operations & Maintenance

| Document | Description | Frequency |
|----------|-------------|-----------|
| [Deployment Guide](deployment.md) | Production deployment | As needed |
| [Beta Testing Setup](beta-testing-setup.md) | Testing environment | Testing phases |
| [Documentation Audit](documentation-audit.md) | Documentation review | 2025-01-20 |

---

## 📁 Archive

Historical and obsolete documentation is stored in:
- [docs/archive/](archive/) - Obsolete files with archive README

---

## 📖 Documentation Standards

### File Naming Conventions
- Use kebab-case for file names: `feature-description.md`
- Include dates in filenames for time-sensitive docs
- Use descriptive names that indicate content and purpose

### Content Standards
- **Always include "Last Updated" date** at the top of documents
- **Use clear headings** and consistent markdown formatting
- **Link related documents** for easy navigation
- **Mark status** of features/implementations (✅ ❌ 🚧)

### Maintenance Guidelines
- Update documentation with code changes
- Review documentation quarterly for accuracy
- Archive obsolete documentation rather than deleting
- Keep CLAUDE.md as the authoritative technical reference

---

## 🎯 Quick Reference by Role

### For New Developers
1. Start with [README.md](../README.md)
2. Read [CLAUDE.md](../CLAUDE.md) thoroughly - **includes mandatory TDD methodology**
3. Review [TDD Quick Reference](TDD-QUICK-REFERENCE.md) for daily workflow
4. Follow [Development Guide](development-guide.md)
5. **For TDD implementation:** Study [Agent TDD Workflow](AGENT-TDD-WORKFLOW.md)
6. **For current work:** Reference [Phase 2C PRPs](prps/phase-2c-donations/) for TDD examples

### For Project Managers
1. Review [Project Tracker](project_tracker.md)
2. Check [Current Features](current-features.md) 
3. Reference [PRD](prd.md) for original requirements
4. Monitor [Session Context](SESSION_CONTEXT.md) for recent changes
5. **Phase 0.2 Planning:** Review [PRP Overview](prps/phase-0.2-member-profile/README.md) for detailed roadmap

### For DevOps/Deployment
1. Follow [Deployment Guide](deployment.md)
2. Reference [Firebase Migration Guide](firebase/migration-guide.md)
3. Review [Security Implementation](security-implementation-summary.md)

### For Architects
1. **CLAUDE.md is the primary reference** - most accurate technical documentation with TDD methodology
2. Review [Firebase Schema Design](firebase/firestore-schema-design.md)
3. Check [Security Roles Design](security-roles-design.md)
4. **TDD Architecture:** Review [Agent TDD Workflow](AGENT-TDD-WORKFLOW.md) for testing patterns
5. Reference [Documentation Audit](documentation-audit.md) for current issues

---

## 📞 Getting Help

- **Primary Reference:** Always check CLAUDE.md first - includes mandatory TDD methodology
- **TDD Implementation:** Use [Agent TDD Workflow](AGENT-TDD-WORKFLOW.md) and [TDD Quick Reference](TDD-QUICK-REFERENCE.md)
- **Development Questions:** Use MCP servers (Serena, Context7) for code assistance
- **Current Issues:** Review Documentation Audit report
- **Architecture Questions:** Reference Firebase and security documentation

---

*This index is maintained as part of the documentation cleanup process. For the most current technical information, always refer to CLAUDE.md as the authoritative source.*