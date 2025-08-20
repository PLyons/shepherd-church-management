# Documentation Index - Shepherd Church Management System

**Last Updated:** 2025-08-20  
**Project Status:** Production Ready with Core Features  

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
| [PRD](prd.md) | Product Requirements Document | Original spec |
| [Project Tracker](project_tracker.md) | Current phase and progress | 2025-01-16 |
| [Current Features](current-features.md) | Detailed feature documentation | Up to date |
| [Session Context](SESSION_CONTEXT.md) | Recent development context | 2025-01-16 |

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

---

## 🎯 Feature-Specific Documentation

### Authentication & Registration
- **QR Registration:** [PRD QR Self-Registration](prd-qr-self-registration.md)
- **Authentication:** Covered in CLAUDE.md and Development Guide
- **User Roles:** Detailed in Security Roles Design

### Member & Household Management
- **Current Implementation:** [Current Features](current-features.md)
- **Data Models:** [Firebase Schema](firebase/firestore-schema-design.md)
- **Service Layer:** Documented in CLAUDE.md

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
2. Read [CLAUDE.md](../CLAUDE.md) thoroughly
3. Follow [Development Guide](development-guide.md)
4. Review [Current Features](current-features.md)

### For Project Managers
1. Review [Project Tracker](project_tracker.md)
2. Check [Current Features](current-features.md) 
3. Reference [PRD](prd.md) for original requirements
4. Monitor [Session Context](SESSION_CONTEXT.md) for recent changes

### For DevOps/Deployment
1. Follow [Deployment Guide](deployment.md)
2. Reference [Firebase Migration Guide](firebase/migration-guide.md)
3. Review [Security Implementation](security-implementation-summary.md)

### For Architects
1. **CLAUDE.md is the primary reference** - most accurate technical documentation
2. Review [Firebase Schema Design](firebase/firestore-schema-design.md)
3. Check [Security Roles Design](security-roles-design.md)
4. Reference [Documentation Audit](documentation-audit.md) for current issues

---

## 📞 Getting Help

- **Primary Reference:** Always check CLAUDE.md first
- **Current Issues:** Review Documentation Audit report
- **Development Questions:** Use MCP servers (Serena, Context7) for code assistance
- **Architecture Questions:** Reference Firebase and security documentation

---

*This index is maintained as part of the documentation cleanup process. For the most current technical information, always refer to CLAUDE.md as the authoritative source.*