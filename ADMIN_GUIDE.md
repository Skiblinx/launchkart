# LaunchKart Admin Guide

## Table of Contents

1. [Admin System Overview](#admin-system-overview)
2. [Getting Admin Access](#getting-admin-access)
3. [Admin Dashboard](#admin-dashboard)
4. [User Management](#user-management)
5. [KYC Management](#kyc-management)
6. [Service Management](#service-management)
7. [Mentorship Management](#mentorship-management)
8. [Investment Management](#investment-management)
9. [Payment Management](#payment-management)
10. [Analytics & Reporting](#analytics--reporting)
11. [System Administration](#system-administration)
12. [Admin Roles & Permissions](#admin-roles--permissions)
13. [Troubleshooting](#troubleshooting)

---

## Admin System Overview

The LaunchKart admin system provides comprehensive tools for managing users, services, payments, and platform operations. The system is designed with role-based access control to ensure security and proper delegation of responsibilities.

### Key Features:
- User management and KYC verification
- Service request approval and management
- Payment processing and refunds
- Analytics and reporting
- System configuration and maintenance
- Admin user management
- Audit logging and security monitoring

---

## Getting Admin Access

### 1. Admin Promotion Process

**Eligibility Requirements:**
- Must be a registered user on the platform
- KYC verification completed (basic level minimum)
- Good standing with the platform (no violations)

**Promotion Process:**
1. **Existing Admin Action**: Current admin with `admin_management` permission promotes eligible users
2. **Role Selection**: Choose appropriate admin role:
   - **Super Admin**: Full system access
   - **Admin**: General administrative access
   - **Moderator**: Content moderation and user management
   - **Support**: Customer support and basic management
3. **Permission Assignment**: Specific permissions assigned based on role
4. **Email Notification**: Promoted user receives notification email

### 2. Admin Login Process

**Step 1: Request OTP**
- Navigate to admin login page
- Enter your registered email address
- Click "Request OTP"
- System validates admin status and sends OTP

**Step 2: Verify OTP**
- Check email for 6-digit OTP code
- Enter OTP in verification form
- OTP expires after 10 minutes
- Maximum 3 attempts allowed

**Step 3: Access Admin Panel**
- Upon successful verification, receive admin JWT token
- Redirected to admin dashboard
- Token valid for session duration

### 3. Admin Roles & Permissions

**Super Admin:**
- All system permissions
- Can create and manage other admins
- Access to all sections and features
- System configuration and maintenance

**Admin:**
- User management
- Content moderation
- Service approval
- Analytics access
- KYC verification

**Moderator:**
- Content moderation
- User management
- Service approval
- Limited analytics

**Support:**
- User management
- Basic analytics access
- Customer support functions

---

## Admin Dashboard

### 1. Dashboard Overview

**Key Metrics:**
- **Total Users**: Current user count
- **Service Requests**: Number of service requests
- **Total Revenue**: Platform revenue
- **Pending KYC**: Users awaiting KYC verification

**Recent Activity:**
- New user registrations
- Service requests
- Payment activities
- KYC submissions

**Quick Actions:**
- Access user management
- Review pending KYC
- View service requests
- Check system health

### 2. Navigation Structure

**Main Menu:**
- **Dashboard**: Overview and statistics
- **Users**: User management and KYC
- **Services**: Service request management
- **Mentorship**: Mentor and session management
- **Investment**: Investment application review
- **Payments**: Payment and refund management
- **Analytics**: Reports and insights
- **System**: System settings and maintenance
- **Admin Management**: Admin user control

---

## User Management

### 1. User Overview

**Access Path**: Admin Panel → Users

**User List Features:**
- **Search**: By name, email, or ID
- **Filter**: By KYC status, role, registration date
- **Sort**: By various criteria
- **Pagination**: Handle large user lists

**User Information Displayed:**
- Full name and email
- Role (founder, mentor, investor)
- KYC status
- Registration date
- Last login
- Account status (active/suspended)

### 2. User Actions

**View User Details:**
- Complete profile information
- KYC documents and status
- Service request history
- Payment history
- Session history
- Account activity log

**User Account Management:**
- **Suspend Account**: Temporarily disable user access
- **Reactivate Account**: Restore suspended account
- **Delete Account**: Permanently remove user (with data retention compliance)
- **Reset Password**: Force password reset
- **Update Profile**: Modify user information

**Communication:**
- Send email notifications
- Add internal notes
- View communication history

### 3. User Activity Monitoring

**Activity Tracking:**
- Login/logout activities
- Profile updates
- Service requests
- Payment activities
- Security events

**Audit Trail:**
- All admin actions on user accounts
- Timestamp and admin identification
- Action details and reasoning
- Reversible actions tracking

---

## KYC Management

### 1. KYC Review Process

**Access Path**: Admin Panel → Users → KYC Management

**Review Workflow:**
1. **New KYC Submissions**: Users submit verification documents
2. **Document Review**: Admin reviews uploaded documents
3. **Verification Decision**: Approve, reject, or request more information
4. **User Notification**: Automated email notification sent
5. **Status Update**: KYC status updated in system

### 2. KYC Document Types

**Required Documents:**
- **Identity Proof**: 
  - Passport
  - Driver's License
  - National ID Card
  - Voter ID
- **Address Proof**:
  - Utility Bill (within 3 months)
  - Bank Statement
  - Government correspondence
- **Business Documents** (if applicable):
  - Certificate of Incorporation
  - Business License
  - Tax Registration

### 3. KYC Verification Process

**Step 1: Document Review**
- Check document authenticity
- Verify information matches user profile
- Ensure documents are current and valid
- Cross-reference with blacklists

**Step 2: Risk Assessment**
- Evaluate user risk profile
- Check against fraud patterns
- Verify contact information
- Assess business legitimacy

**Step 3: Decision Making**
- **Approve**: Grant verified status
- **Reject**: Decline with reason
- **Request More Info**: Ask for additional documents

**Step 4: Status Update**
- Update KYC status in system
- Send notification to user
- Log decision in audit trail
- Update user permissions

### 4. KYC Status Management

**Status Types:**
- **Pending**: Under review
- **Verified**: Approved and active
- **Rejected**: Declined verification
- **Expired**: Verification expired (annual renewal)
- **Suspended**: Temporarily suspended

**Bulk Actions:**
- Approve multiple KYC applications
- Reject with common reasons
- Export KYC reports
- Generate compliance reports

---

## Service Management

### 1. Service Request Overview

**Access Path**: Admin Panel → Services

**Service Categories:**
- **Business Essentials**: Free services (logo, landing page, templates)
- **Legal Services**: Contracts, compliance, IP protection
- **Technical Services**: Development, cloud setup, technical consulting
- **Marketing Services**: Digital marketing, branding, content creation
- **Financial Services**: Accounting, tax, financial planning

### 2. Service Request Management

**Review Process:**
1. **Request Submission**: User submits service request
2. **Initial Review**: Admin reviews request details
3. **Provider Matching**: Assign to qualified service providers
4. **Quality Check**: Ensure provider capability
5. **Approval**: Approve provider assignment
6. **Monitoring**: Track project progress
7. **Completion Review**: Verify deliverables

**Service Request Details:**
- **Request Information**: Title, description, budget, timeline
- **User Information**: Requester details and history
- **Provider Information**: Assigned provider and credentials
- **Project Status**: Current stage and progress
- **Communication**: Messages between parties
- **Deliverables**: Files and completed work

### 3. Service Provider Management

**Provider Onboarding:**
- Review provider applications
- Verify credentials and experience
- Conduct background checks
- Set up provider profiles
- Define service offerings and rates

**Provider Monitoring:**
- Track provider performance
- Monitor customer satisfaction
- Review completion rates
- Handle disputes and issues
- Update provider ratings

**Quality Assurance:**
- Review completed work
- Ensure quality standards
- Handle customer complaints
- Implement improvement measures
- Maintain service standards

### 4. Service Request Actions

**Administrative Actions:**
- **Approve/Reject**: Service request approval
- **Assign Provider**: Match with suitable provider
- **Update Status**: Change request status
- **Modify Details**: Update request information
- **Cancel Request**: Cancel with refund if applicable
- **Escalate Issue**: Handle complex problems

**Communication:**
- Message users and providers
- Send status updates
- Provide feedback
- Resolve disputes
- Coordinate project activities

---

## Mentorship Management

### 1. Mentor Management

**Access Path**: Admin Panel → Mentorship

**Mentor Onboarding:**
- Review mentor applications
- Verify professional background
- Check references and credentials
- Approve mentor profiles
- Set mentorship rates and availability

**Mentor Profile Management:**
- Update mentor information
- Manage expertise areas
- Set availability schedules
- Update rates and packages
- Handle mentor inquiries

### 2. Session Management

**Session Oversight:**
- Monitor session bookings
- Track session completion
- Review session feedback
- Handle session disputes
- Generate session reports

**Session Quality Control:**
- Review mentor performance
- Monitor session ratings
- Address quality issues
- Implement improvement measures
- Maintain service standards

**Session Administration:**
- Cancel/reschedule sessions
- Process refunds
- Handle technical issues
- Manage session recordings
- Coordinate support

### 3. Mentorship Analytics

**Performance Metrics:**
- **Session Statistics**: Bookings, completions, cancellations
- **Mentor Performance**: Ratings, feedback, earnings
- **User Engagement**: Session frequency, satisfaction
- **Revenue Tracking**: Mentorship income and growth
- **Quality Metrics**: Satisfaction scores, repeat bookings

**Reporting:**
- Monthly mentorship reports
- Mentor performance summaries
- User engagement analytics
- Revenue and growth reports
- Quality assessment reports

---

## Investment Management

### 1. Investment Application Review

**Access Path**: Admin Panel → Investment

**Application Review Process:**
1. **Initial Screening**: Check application completeness
2. **Eligibility Verification**: Verify founder and company eligibility
3. **Document Review**: Review business plan, financials, pitch deck
4. **Due Diligence**: Conduct thorough background checks
5. **Investor Matching**: Identify suitable investors
6. **Facilitation**: Coordinate investor meetings
7. **Decision Support**: Provide investment recommendations

**Application Components:**
- **Company Information**: Registration, industry, stage
- **Business Plan**: Strategy, market analysis, projections
- **Financial Data**: Revenue, expenses, funding requirements
- **Team Information**: Founder and key team member profiles
- **Market Analysis**: Competition, opportunity, positioning
- **Legal Documents**: Incorporation, IP, contracts

### 2. Investor Management

**Investor Onboarding:**
- Review investor applications
- Verify investment credentials
- Conduct background checks
- Set investment preferences
- Approve investor profiles

**Investor Relations:**
- Manage investor communications
- Coordinate due diligence
- Facilitate meetings
- Handle investor inquiries
- Provide market updates

### 3. Investment Process Management

**Deal Flow Management:**
- Track application pipeline
- Monitor investor interest
- Coordinate due diligence
- Manage term negotiations
- Process legal documentation

**Investment Monitoring:**
- Track investment outcomes
- Monitor portfolio performance
- Generate investment reports
- Handle post-investment relations
- Measure success metrics

---

## Payment Management

### 1. Payment Processing

**Access Path**: Admin Panel → Payments

**Payment Types:**
- **Service Payments**: For professional services
- **Mentorship Fees**: For mentorship sessions
- **Platform Fees**: Commission and processing fees
- **Subscription Fees**: Premium account subscriptions

**Payment Methods:**
- Credit/Debit Cards
- Bank Transfers
- UPI (India)
- Digital Wallets
- Cryptocurrency (if enabled)

### 2. Payment Administration

**Payment Processing:**
- **Manual Processing**: Process payments manually
- **Bulk Processing**: Handle multiple payments
- **Payment Verification**: Verify payment details
- **Payment Disputes**: Handle payment issues
- **Payment Reconciliation**: Match payments with services

**Refund Management:**
- **Refund Requests**: Process refund applications
- **Refund Approval**: Approve/deny refund requests
- **Refund Processing**: Execute approved refunds
- **Refund Tracking**: Monitor refund status
- **Refund Reporting**: Generate refund reports

### 3. Financial Reporting

**Revenue Tracking:**
- Total platform revenue
- Revenue by service category
- Monthly/quarterly growth
- Commission earnings
- Payment method analysis

**Financial Analytics:**
- **Revenue Trends**: Growth patterns and forecasts
- **Payment Analysis**: Success rates and failures
- **Refund Analysis**: Refund rates and reasons
- **User Spending**: Average spending per user
- **Geographic Analysis**: Revenue by region

**Compliance Reporting:**
- Tax reports and documentation
- Regulatory compliance reports
- Audit trail maintenance
- Financial statement preparation
- Government reporting requirements

---

## Analytics & Reporting

### 1. Platform Analytics

**Access Path**: Admin Panel → Analytics

**Key Performance Indicators:**
- **User Growth**: Registration trends and user acquisition
- **User Engagement**: Active users, session duration, feature usage
- **Revenue Metrics**: Total revenue, average order value, conversion rates
- **Service Performance**: Service completion rates, satisfaction scores
- **Platform Health**: System uptime, response times, error rates

**Analytics Dashboards:**
- **Executive Dashboard**: High-level KPIs and trends
- **User Analytics**: User behavior and engagement
- **Revenue Analytics**: Financial performance and trends
- **Service Analytics**: Service performance and quality
- **Marketing Analytics**: Campaign performance and ROI

### 2. User Analytics

**User Behavior Analysis:**
- **Registration Patterns**: Sign-up trends and sources
- **Activity Patterns**: Feature usage and engagement
- **Retention Analysis**: User retention and churn rates
- **Session Analytics**: Session duration and frequency
- **Conversion Funnels**: User journey and conversion points

**User Segmentation:**
- **Demographic Segmentation**: Age, location, industry
- **Behavioral Segmentation**: Usage patterns and preferences
- **Value Segmentation**: Spending patterns and lifetime value
- **Engagement Segmentation**: Activity levels and frequency
- **Cohort Analysis**: User groups and their behaviors

### 3. Business Intelligence

**Performance Monitoring:**
- **Real-time Metrics**: Live platform performance
- **Historical Analysis**: Trend analysis and patterns
- **Predictive Analytics**: Forecasting and predictions
- **Comparative Analysis**: Period-over-period comparisons
- **Benchmark Analysis**: Industry and competitor comparison

**Custom Reports:**
- **Scheduled Reports**: Automated report generation
- **Ad-hoc Reports**: On-demand custom reports
- **Export Functionality**: Data export in various formats
- **Report Sharing**: Share reports with stakeholders
- **Report Automation**: Automated report distribution

---

## System Administration

### 1. System Configuration

**Access Path**: Admin Panel → System

**Platform Settings:**
- **General Settings**: Platform name, description, contact info
- **Regional Settings**: Supported countries and currencies
- **Email Settings**: SMTP configuration and templates
- **Payment Settings**: Payment gateway configuration
- **Security Settings**: Security policies and configurations

**Feature Management:**
- **Feature Flags**: Enable/disable platform features
- **Service Categories**: Manage service categories and types
- **User Roles**: Configure user roles and permissions
- **Pricing Configuration**: Set platform fees and commissions
- **Integration Settings**: Third-party service integrations

### 2. Content Management

**Content Administration:**
- **Page Content**: Manage static page content
- **Email Templates**: Customize email notifications
- **Terms and Conditions**: Update legal documents
- **Privacy Policy**: Manage privacy settings
- **FAQ Management**: Maintain help documentation

**Media Management:**
- **Image Upload**: Manage platform images
- **File Storage**: Configure file storage settings
- **CDN Configuration**: Content delivery network setup
- **Backup Management**: Data backup and recovery
- **Asset Optimization**: Image and file optimization

### 3. System Monitoring

**Performance Monitoring:**
- **System Health**: Server health and performance
- **Application Monitoring**: Application performance metrics
- **Database Monitoring**: Database performance and optimization
- **Error Tracking**: Error logs and debugging
- **Security Monitoring**: Security events and threats

**Maintenance Mode:**
- **Enable/Disable**: Toggle maintenance mode
- **Maintenance Message**: Custom maintenance messages
- **User Notifications**: Notify users about maintenance
- **Scheduled Maintenance**: Plan and schedule maintenance
- **Emergency Maintenance**: Handle urgent maintenance

### 4. Security Management

**Security Configuration:**
- **Authentication Settings**: Login security and policies
- **Authorization Rules**: Access control and permissions
- **Data Encryption**: Encryption settings and keys
- **Audit Logging**: Security event logging
- **Compliance Settings**: Regulatory compliance configuration

**Threat Management:**
- **Fraud Detection**: Fraud prevention and detection
- **Suspicious Activity**: Monitor and investigate threats
- **IP Blocking**: Block malicious IP addresses
- **User Verification**: Additional verification measures
- **Incident Response**: Security incident handling

---

## Admin Roles & Permissions

### 1. Permission System

**Permission Categories:**
- **User Management**: Create, read, update, delete users
- **Admin Management**: Manage admin users and roles
- **Content Moderation**: Moderate user-generated content
- **Service Approval**: Approve and manage services
- **Payment Management**: Handle payments and refunds
- **Analytics Access**: View reports and analytics
- **System Configuration**: Modify system settings
- **Email Management**: Send notifications and emails
- **KYC Verification**: Verify user identities
- **KYC Approval**: Approve KYC applications

### 2. Role Management

**Creating Admin Roles:**
1. **Access Admin Management**: Navigate to admin section
2. **Select User**: Choose eligible user for promotion
3. **Choose Role**: Select appropriate admin role
4. **Assign Permissions**: Customize permissions if needed
5. **Send Notification**: User receives promotion email
6. **Audit Log**: Action logged for security

**Managing Existing Admins:**
- **Update Permissions**: Modify admin permissions
- **Change Roles**: Update admin roles
- **Deactivate Admin**: Remove admin access
- **Audit Admin Activity**: Review admin actions
- **Password Reset**: Force admin password reset

### 3. Permission Matrix

| Permission | Super Admin | Admin | Moderator | Support |
|------------|-------------|--------|-----------|---------|
| User Management | ✓ | ✓ | ✓ | ✓ |
| Admin Management | ✓ | ✓ | ✗ | ✗ |
| Content Moderation | ✓ | ✓ | ✓ | ✗ |
| Service Approval | ✓ | ✓ | ✓ | ✗ |
| Payment Management | ✓ | ✓ | ✗ | ✗ |
| Analytics Access | ✓ | ✓ | ✓ | ✓ |
| System Configuration | ✓ | ✗ | ✗ | ✗ |
| Email Management | ✓ | ✓ | ✓ | ✓ |
| KYC Verification | ✓ | ✓ | ✗ | ✗ |
| KYC Approval | ✓ | ✓ | ✗ | ✗ |

---

## Troubleshooting

### Common Admin Issues

**1. OTP Not Received**
- **Check Email**: Verify email address is correct
- **Check Spam**: Look in spam/junk folder
- **Resend OTP**: Request new OTP
- **Contact Support**: If persistent issues

**2. Permission Denied**
- **Check Role**: Verify admin role and permissions
- **Session Timeout**: Re-authenticate if needed
- **Permission Update**: Contact super admin for permission changes
- **Browser Issues**: Clear cache and cookies

**3. User Management Issues**
- **User Not Found**: Check search criteria and filters
- **Action Failed**: Verify permissions and user status
- **Bulk Actions**: Check selection and permissions
- **Data Sync**: Refresh page or reload data

**4. Payment Processing Issues**
- **Payment Gateway**: Check gateway connection
- **Refund Processing**: Verify refund policies
- **Transaction Errors**: Check logs and error messages
- **Reconciliation**: Match payments with services

**5. System Performance Issues**
- **Slow Loading**: Check system health and performance
- **Database Issues**: Monitor database performance
- **Server Resources**: Check server capacity
- **Cache Issues**: Clear application cache

### Emergency Procedures

**Security Incidents:**
1. **Identify Threat**: Assess security threat level
2. **Contain Incident**: Implement containment measures
3. **Notify Team**: Alert security team and stakeholders
4. **Investigate**: Conduct thorough investigation
5. **Document**: Record incident details and response
6. **Recover**: Restore normal operations
7. **Review**: Post-incident analysis and improvements

**System Outages:**
1. **Assess Impact**: Determine outage scope and impact
2. **Enable Maintenance**: Activate maintenance mode
3. **Notify Users**: Send outage notifications
4. **Troubleshoot**: Identify and resolve issues
5. **Monitor Recovery**: Track system restoration
6. **Communicate**: Update users on progress
7. **Post-Mortem**: Analyze and prevent future issues

**Data Breaches:**
1. **Immediate Response**: Secure affected systems
2. **Assess Damage**: Evaluate data compromise
3. **Notify Authorities**: Report to relevant authorities
4. **User Communication**: Inform affected users
5. **Forensic Analysis**: Investigate breach cause
6. **Remediation**: Implement security improvements
7. **Monitoring**: Enhanced monitoring and detection

### Support Resources

**Internal Support:**
- **Admin Documentation**: Comprehensive guides and procedures
- **Training Materials**: Admin training resources
- **Support Channels**: Internal communication channels
- **Escalation Procedures**: Issue escalation process
- **Knowledge Base**: Searchable knowledge repository

**External Support:**
- **Technical Support**: Platform technical support
- **Vendor Support**: Third-party service support
- **Legal Support**: Legal compliance assistance
- **Security Support**: Security incident response
- **Compliance Support**: Regulatory compliance help

---

## Best Practices

### Security Best Practices

**Access Control:**
- Use strong, unique passwords
- Enable two-factor authentication
- Limit admin access to necessary personnel
- Regular access reviews and updates
- Monitor admin activity and logs

**Data Protection:**
- Encrypt sensitive data
- Regular security audits
- Backup critical data regularly
- Secure data transmission
- Implement data retention policies

**Incident Response:**
- Develop incident response procedures
- Train staff on security protocols
- Regular security awareness training
- Maintain emergency contact lists
- Document and review incidents

### Operational Best Practices

**User Management:**
- Respond promptly to user inquiries
- Maintain consistent service quality
- Document all admin actions
- Regular user feedback collection
- Proactive user communication

**Process Management:**
- Standardize admin procedures
- Regular process reviews and updates
- Quality assurance checks
- Performance monitoring
- Continuous improvement initiatives

**Communication:**
- Clear and professional communication
- Regular stakeholder updates
- Transparent decision-making
- Effective escalation procedures
- Comprehensive documentation

---

*This admin guide is regularly updated to reflect platform changes and improvements. For additional support or clarification, please contact the technical team or refer to the internal knowledge base.*