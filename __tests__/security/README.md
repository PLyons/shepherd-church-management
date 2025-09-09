# Firebase Security Rules Testing Suite

This comprehensive test suite validates the enhanced donation security rules implemented in **PRP-2C-004: Enhanced Firestore Security Rules for Financial Data Protection**.

## Overview

The security rules test suite ensures that:
- **Members** can only access their own financial data
- **Pastors** have NO access to individual donations (only aggregate summaries)
- **Admins** have full access with proper audit logging
- Time-limited edits (24-hour window) are enforced
- Status-based security prevents editing verified/cancelled donations
- Data validation prevents invalid or malicious data

## Test Structure

### Test Categories

1. **Authentication Tests** - Verify unauthenticated access is denied
2. **Donation Categories Security** - Role-based access to categories
3. **Donations Security** - Core financial data protection
4. **Donation Summaries Security** - Aggregate reporting access control  
5. **Financial Audit Log Security** - Admin-only audit trail access
6. **Collection Group Query Security** - Cross-collection query restrictions
7. **Time-Based Security Tests** - 24-hour edit window enforcement
8. **Status-Based Security Tests** - Pending vs verified donation restrictions
9. **Edge Cases and Security Vulnerabilities** - Anti-tampering and privilege escalation prevention

### Test Data

The test suite uses comprehensive mock data including:
- **Test Users**: Admin, Pastor, Member (multiple)
- **Donation Categories**: Active, inactive, various fund types
- **Donations**: Different statuses, ages, amounts, and ownership
- **Summaries**: Aggregate and individual donor summaries
- **Audit Logs**: Various financial access events

## Running the Tests

### Prerequisites

1. **Firebase CLI** - Install globally: `npm install -g firebase-tools`
2. **Firebase Rules Unit Testing SDK** - Installed via: `npm install --save-dev @firebase/rules-unit-testing`
3. **Firebase Emulator** - Configured in firebase.json
4. **Vitest Testing Framework** - Project's testing setup

### Quick Start Commands

```bash
# Run complete security test suite (recommended)
npm run test:security

# Run security rules tests with manual emulator management
npm run security:rules:full

# Run security rules tests only (requires running emulator separately)
npm run security:rules

# Start/stop emulator manually
npm run security:emulator:start
npm run security:emulator:stop
```

### Detailed Test Execution

#### Option 1: Automated Test Suite (Recommended)

```bash
# Complete test suite with emulator auto-management
npm run test:security
```

This will:
1. ✅ Validate test environment
2. 🚀 Start Firebase emulator automatically  
3. 🧪 Run all security rules tests
4. 🛑 Stop emulator after tests complete
5. 📊 Display comprehensive test results

#### Option 2: Manual Emulator Management

```bash
# Terminal 1: Start emulator
npm run security:emulator:start

# Terminal 2: Run tests
npm run security:rules

# Terminal 1: Stop emulator (Ctrl+C or)
npm run security:emulator:stop
```

#### Option 3: Advanced Test Runner Options

```bash
# Full test runner with options
./__tests__/security/run-security-tests.sh --help

# Skip environment validation
./__tests__/security/run-security-tests.sh --skip-validation

# Keep emulator running after tests
./__tests__/security/run-security-tests.sh --keep-emulator
```

### Test Environment Setup

The test runner automatically:
1. **Validates Environment**:
   - ✅ Firebase CLI installation
   - ✅ Security rules file exists
   - ✅ Test dependencies installed
   - ✅ Test files present

2. **Emulator Management**:
   - 🚀 Starts Firebase emulator on port 8080
   - ⏳ Waits for emulator to be ready
   - 🧹 Cleans up processes after tests

3. **Test Execution**:
   - 🧪 Runs comprehensive security validation
   - 📊 Provides detailed test results
   - 🎯 Validates all role-based access scenarios

### Test Environment Setup

The test suite automatically:
1. **Initializes** Firebase emulator with security rules
2. **Creates** test contexts for different user roles
3. **Seeds** mock data for comprehensive testing
4. **Cleans** up between tests for isolation
5. **Validates** both success and failure scenarios

## Security Test Scenarios

### Member Access Control

**✅ Allowed:**
- Read own donations only
- Create donations for themselves (pending status)
- Update own pending donations within 24 hours
- Read active donation categories

**❌ Denied:**
- Read other members' donations
- Create donations for other members
- Update verified/cancelled donations
- Update donations after 24-hour window
- Delete any donations
- Access donation summaries
- Access audit logs
- Write to donation categories

### Pastor Access Control

**✅ Allowed:**
- Read all donation categories (active/inactive)
- Create/update active donation categories
- Read aggregate donation summaries (no individual details)
- Create aggregate summaries

**❌ Denied:**
- Read individual donations (ANY donations)
- Write to donations collection
- Read individual donor summaries
- Delete donation categories
- Access audit logs
- Create inactive donation categories

### Admin Access Control

**✅ Allowed:**
- Full access to all financial data
- Read/write all donations with validation
- Full access to donation categories
- Full access to donation summaries
- Read/write audit logs
- Delete operations (with audit trail)

## Data Validation Tests

### Donation Data Validation

- **Required Fields**: amount, donationDate, method, categoryId, memberId
- **Amount Limits**: Positive values, max $1,000,000
- **Valid Methods**: cash, check, credit_card, debit_card, bank_transfer, online, other
- **Valid Statuses**: pending, verified, cancelled
- **Data Types**: Proper typing for all fields

### Donation Category Validation

- **Required Fields**: name, description, isActive, isTaxDeductible
- **Name Validation**: Non-empty string
- **Boolean Fields**: Proper boolean typing
- **Optional Fields**: displayOrder, code, fundCode with proper types

## Time-Based Security

### 24-Hour Edit Window

The test suite validates:
- Donations created within 24 hours can be edited by members
- Donations exactly at 24-hour boundary cannot be edited
- Donations older than 24 hours cannot be edited by members
- Admins can edit donations regardless of age

### Status-Based Restrictions

- **Pending Donations**: Editable by member (within time window)
- **Verified Donations**: Only admin can edit
- **Cancelled Donations**: Only admin can edit

## Collection Group Security

### Cross-Collection Queries

Tests validate:
- **Admin**: Can query across all financial collections
- **Pastor**: Limited to aggregate summaries only
- **Member**: Can only access own data in queries
- **Filtering**: Security rules properly filter results

## Anti-Tampering and Security Vulnerabilities

### Privilege Escalation Prevention

- Members cannot create verified donations
- Members cannot assign donations to other members
- Members cannot modify createdBy, createdAt fields
- Pastors cannot access individual financial records

### Data Integrity Protection

- Critical fields (memberId, status, timestamps) cannot be tampered with
- Role-based access prevents unauthorized privilege escalation
- Collection group queries are properly filtered by user access rights

## Audit Logging Requirements

### Financial Access Auditing

- All admin financial data access triggers audit requirements
- Audit logs are admin-only accessible
- System-level audit entries supported for Cloud Functions

## Test Coverage

The test suite provides:
- **Authentication**: 100% coverage of unauthenticated access denial
- **Role-Based Access**: Complete validation of admin/pastor/member permissions
- **Data Validation**: Comprehensive field and type validation
- **Time/Status Security**: Full coverage of temporal and status restrictions
- **Edge Cases**: Anti-tampering, privilege escalation, bulk operations
- **Performance**: Query security and filtering validation

## Development Usage

### Adding New Security Tests

1. **Identify Security Requirement**: Define what should be protected
2. **Create Test Scenarios**: Both positive (allowed) and negative (denied) cases
3. **Use assertSucceeds/assertFails**: Validate security rule behavior
4. **Test All Roles**: Admin, Pastor, Member, Unauthenticated
5. **Include Edge Cases**: Data tampering, privilege escalation attempts

### Debugging Security Rules

1. **Run Tests in UI Mode**: `npm run test:ui`
2. **Check Firebase Emulator**: View rule evaluation in emulator UI
3. **Validate Test Data**: Ensure mock data matches production patterns
4. **Test Both Success and Failure**: Verify expected behavior

## Continuous Integration

Include security rules testing in CI/CD:

```bash
# In CI pipeline
npm run typecheck
npm run lint
npm run test:security  # Run security rules validation
npm run build
```

## Security Compliance

This test suite validates compliance with:
- **PRP-2C-004**: Enhanced financial data security requirements
- **Role-Based Access Control**: Principle of least privilege
- **Data Privacy**: Member financial information protection
- **Audit Requirements**: Administrative access logging
- **Time-Based Security**: Limited edit windows for data integrity

## Future Enhancements

Potential test suite improvements:
- **Performance Testing**: Large dataset query security validation
- **Real-time Updates**: Security rule enforcement in live data streams
- **Advanced Queries**: Complex aggregation and reporting security
- **Multi-tenant**: Organization-level data isolation testing