# Beta Testing Setup Guide

## Creating an Administrative User

For beta testing, you'll need at least one administrative user to access all features of the Shepherd Church Management system. We provide two methods for creating admin users:

### Method 1: Quick Admin Creation (Recommended for Beta Testing)

Run the following command to create a default admin user:

```bash
npm run create-admin
```

This will create an admin user with the following credentials:
- **Email**: admin@shepherdchurch.com
- **Password**: ShepherdAdmin2024!
- **Role**: Administrator

**⚠️ IMPORTANT**: Change this password immediately after your first login!

### Method 2: Interactive Admin Setup

For a more customized setup, use the interactive script:

```bash
npm run setup-admin
```

This script allows you to:
1. Create a new admin user with custom credentials
2. Promote an existing user to admin status

The interactive script will guide you through:
- Setting a custom email address
- Creating a secure password (with validation)
- Entering user details (name, phone)
- Confirming the admin creation

## Beta Testing Admin Features

Once logged in as an admin, you'll have access to:

### 1. **Role Management** (`/admin/roles`)
- Assign roles to users (admin, pastor, member)
- View role statistics
- Manage unassigned users
- All role changes are audit logged

### 2. **Full Dashboard Access**
- View all church statistics
- Access financial data and reports
- See all events (public and private)
- Monitor system activity

### 3. **Member Management**
- Create and edit member profiles
- Manage households
- Access all member information

### 4. **Financial Management**
- Record donations
- View all donation history
- Generate financial reports
- Export financial data

### 5. **Event Management**
- Create public and private events
- Manage event registrations
- View attendance reports

### 6. **Audit Logs** (`/admin/audit-logs`)
- View all security-sensitive actions
- Monitor role changes
- Track financial data access
- Ensure compliance

## Security Best Practices for Beta Testing

1. **Password Security**
   - Change default passwords immediately
   - Use strong, unique passwords
   - Consider using a password manager

2. **Role Assignment**
   - Only assign admin roles to trusted users
   - Use pastor role for ministry leaders
   - Default new users to member role

3. **Data Privacy**
   - Remember that admins can see all data
   - Test member accounts to verify data isolation
   - Check that members can only see their own donations

4. **Audit Trail**
   - All admin actions are logged
   - Review audit logs regularly
   - Test that unauthorized access attempts are logged

## Testing Checklist

### Admin Features to Test:
- [ ] Login with admin credentials
- [ ] Change default password
- [ ] Assign roles to test users
- [ ] Create a test event
- [ ] Record a test donation
- [ ] View financial reports
- [ ] Check audit logs

### Security Features to Test:
- [ ] Create a member account
- [ ] Verify member can only see own donations
- [ ] Test pastor account permissions
- [ ] Attempt unauthorized access (should be blocked)
- [ ] Verify audit logging works

### Role-Based Access to Test:
- [ ] Admin sees all data
- [ ] Pastor sees aggregate financial data only
- [ ] Member sees only personal donations
- [ ] Unassigned users have limited access

## Troubleshooting

### Cannot Create Admin User
- Error: "Email already in use" - Use `npm run setup-admin` to promote existing user
- Error: "Weak password" - Ensure password meets requirements (8+ chars, uppercase, lowercase, number, special char)

### Cannot Login
- Verify Firebase Authentication is enabled
- Check that the member document exists in Firestore
- Ensure the user's role is set correctly

### Missing Permissions
- Check the user's role in the database
- Verify role-based access control is working
- Review audit logs for access denials

## Support

For beta testing support:
1. Check the audit logs for any errors
2. Review the browser console for JavaScript errors
3. Ensure all Firebase services are properly configured
4. Contact the development team with specific error messages

Remember: This is beta software. Please report any issues or unexpected behavior!