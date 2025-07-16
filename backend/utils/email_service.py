import os
import smtplib
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional, Dict, Any
from datetime import datetime
import random
import string

logger = logging.getLogger(__name__)

class EmailService:
    """Enhanced email service for LaunchKart with Gmail SMTP integration"""
    
    def __init__(self):
        self.smtp_server = os.environ.get('SMTP_SERVER', 'smtp.gmail.com')
        self.smtp_port = int(os.environ.get('SMTP_PORT', '587'))
        self.smtp_username = os.environ.get('SMTP_USERNAME', '')
        self.smtp_password = os.environ.get('SMTP_PASSWORD', '')
        self.from_email = os.environ.get('FROM_EMAIL', 'noreply@launchkart.com')
        self.from_name = os.environ.get('FROM_NAME', 'LaunchKart')
        
        # Validate configuration
        if not all([self.smtp_username, self.smtp_password]):
            logger.warning("Email service not properly configured. Check SMTP_USERNAME and SMTP_PASSWORD.")
    
    def _send_email(self, to_email: str, subject: str, html_body: str, text_body: Optional[str] = None) -> bool:
        """Send email using Gmail SMTP"""
        try:
            # Create message
            msg = MIMEMultipart('alternative')
            msg['From'] = f"{self.from_name} <{self.from_email}>"
            msg['To'] = to_email
            msg['Subject'] = subject
            
            # Add text version if provided
            if text_body:
                text_part = MIMEText(text_body, 'plain')
                msg.attach(text_part)
            
            # Add HTML version
            html_part = MIMEText(html_body, 'html')
            msg.attach(html_part)
            
            # Send email
            try:
                # Try SMTP with STARTTLS (port 587)
                with smtplib.SMTP(self.smtp_server, self.smtp_port) as server:
                    server.starttls()
                    server.login(self.smtp_username, self.smtp_password)
                    server.sendmail(self.from_email, to_email, msg.as_string())
            except Exception as e:
                # Fallback to SMTP_SSL (port 465) if starttls fails
                logger.warning(f"STARTTLS failed, trying SSL: {e}")
                with smtplib.SMTP_SSL(self.smtp_server, 465) as server:
                    server.login(self.smtp_username, self.smtp_password)
                    server.sendmail(self.from_email, to_email, msg.as_string())
            
            logger.info(f"Email sent successfully to {to_email}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to send email to {to_email}: {str(e)}")
            
            # Development mode fallback - simulate email sending
            if os.environ.get('DEVELOPMENT_MODE') == 'true':
                logger.warning("🧪 DEVELOPMENT MODE: Simulating email send")
                logger.info(f"📧 Would send email to: {to_email}")
                logger.info(f"📝 Subject: {subject}")
                if "verification" in subject.lower():
                    # Extract verification token from HTML
                    import re
                    token_match = re.search(r'token=([^"&]+)', html_body)
                    if token_match:
                        token = token_match.group(1)
                        logger.info(f"🔗 Verification URL: https://delicate-rabanadas-9a8271.netlify.app/verify-email?token={token}")
                        # logger.info(f"🔗 Verification URL: http://localhost:3000/verify-email?token={token}")
                return True
            
            return False
    
    def send_email_verification(self, to_email: str, full_name: str, verification_token: str) -> bool:
        """Send email verification link"""
        # verification_url = f"http://localhost:3000/verify-email?token={verification_token}"
        verification_url = f"https://delicate-rabanadas-9a8271.netlify.app/verify-email?token={verification_token}"
        
        subject = "🔐 Verify Your LaunchKart Account"
        
        html_body = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <style>
                .container {{ max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; }}
                .header {{ background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; }}
                .content {{ padding: 40px 30px; background: #f9f9f9; }}
                .button {{ 
                    display: inline-block; 
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                    color: white; 
                    padding: 15px 30px; 
                    text-decoration: none; 
                    border-radius: 8px; 
                    font-weight: bold;
                    margin: 20px 0;
                }}
                .footer {{ padding: 20px; text-align: center; color: #666; font-size: 12px; }}
                .logo {{ font-size: 28px; font-weight: bold; margin-bottom: 10px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <div class="logo">🚀 LaunchKart</div>
                    <h1>Welcome to LaunchKart!</h1>
                    <p>Verify your email to get started</p>
                </div>
                <div class="content">
                    <h2>Hello {full_name},</h2>
                    
                    <p>Thank you for signing up with LaunchKart! We're excited to help you on your entrepreneurial journey.</p>
                    
                    <p>To complete your account setup and start accessing our platform, please verify your email address by clicking the button below:</p>
                    
                    <div style="text-align: center;">
                        <a href="{verification_url}" class="button">Verify Email Address</a>
                    </div>
                    
                    <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
                    <p style="word-break: break-all; color: #4f46e5;">{verification_url}</p>
                    
                    <p><strong>Important:</strong></p>
                    <ul>
                        <li>This link will expire in 24 hours</li>
                        <li>You must verify your email before you can sign in</li>
                        <li>If you didn't create this account, please ignore this email</li>
                    </ul>
                    
                    <p>Once verified, you'll have access to:</p>
                    <ul>
                        <li>✨ Free business essentials (logo, landing page, social media kit)</li>
                        <li>🎓 Expert mentorship connections</li>
                        <li>💰 Investment opportunities</li>
                        <li>🛠️ Professional services marketplace</li>
                    </ul>
                    
                    <p>Need help? Reply to this email or contact our support team.</p>
                    
                    <p>Best regards,<br>The LaunchKart Team</p>
                </div>
                <div class="footer">
                    <p>© 2025 LaunchKart. Empowering entrepreneurs in India & UAE.</p>
                    <p>This is an automated message, please do not reply directly to this email.</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        text_body = f"""
        Welcome to LaunchKart!
        
        Hello {full_name},
        
        Thank you for signing up! Please verify your email address to complete your account setup.
        
        Verification link: {verification_url}
        
        This link will expire in 24 hours.
        
        Best regards,
        The LaunchKart Team
        """
        
        return self._send_email(to_email, subject, html_body, text_body)
    
    def send_admin_otp(self, to_email: str, full_name: str, otp: str) -> bool:
        """Send OTP for admin login"""
        subject = "🔐 Your LaunchKart Admin OTP"
        
        html_body = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <style>
                .container {{ max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; }}
                .header {{ background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; }}
                .content {{ padding: 30px; background: #f9f9f9; }}
                .otp-code {{ 
                    background: #4f46e5; 
                    color: white; 
                    padding: 20px; 
                    border-radius: 10px; 
                    font-size: 32px; 
                    font-weight: bold;
                    text-align: center;
                    letter-spacing: 5px;
                    margin: 20px 0;
                }}
                .footer {{ padding: 20px; text-align: center; color: #666; font-size: 12px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🔐 Admin Login OTP</h1>
                    <p>LaunchKart Admin Portal</p>
                </div>
                <div class="content">
                    <h2>Hello {full_name},</h2>
                    
                    <p>You requested an OTP to access the LaunchKart admin portal.</p>
                    
                    <div class="otp-code">{otp}</div>
                    
                    <p><strong>Important:</strong></p>
                    <ul>
                        <li>This OTP is valid for 10 minutes only</li>
                        <li>Do not share this OTP with anyone</li>
                        <li>If you didn't request this, please ignore this email</li>
                    </ul>
                    
                    <p>Best regards,<br>LaunchKart Admin Team</p>
                </div>
                <div class="footer">
                    <p>© 2025 LaunchKart. Secure admin access.</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        text_body = f"""
        LaunchKart Admin OTP
        
        Hello {full_name},
        
        Your admin login OTP: {otp}
        
        This OTP is valid for 10 minutes only.
        
        Best regards,
        LaunchKart Admin Team
        """
        
        return self._send_email(to_email, subject, html_body, text_body)
    
    def send_admin_promotion_notification(self, to_email: str, full_name: str, role: str, promoted_by: str) -> bool:
        """Send notification about admin promotion"""
        subject = "🎉 You've been promoted to LaunchKart Admin!"
        
        html_body = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <style>
                .container {{ max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; }}
                .header {{ background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; }}
                .content {{ padding: 30px; background: #f9f9f9; }}
                .button {{ 
                    display: inline-block; 
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                    color: white; 
                    padding: 15px 30px; 
                    text-decoration: none; 
                    border-radius: 8px; 
                    font-weight: bold;
                    margin: 20px 0;
                }}
                .role-badge {{ 
                    background: #4f46e5; 
                    color: white; 
                    padding: 8px 16px; 
                    border-radius: 20px; 
                    font-weight: bold;
                    display: inline-block;
                    margin: 10px 0;
                }}
                .footer {{ padding: 20px; text-align: center; color: #666; font-size: 12px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🎉 Congratulations!</h1>
                    <p>You've been promoted to admin</p>
                </div>
                <div class="content">
                    <h2>Hello {full_name},</h2>
                    
                    <p>Great news! <strong>{promoted_by}</strong> has promoted you to the LaunchKart admin team.</p>
                    
                    <div style="text-align: center;">
                        <div class="role-badge">{role.upper()} ACCESS</div>
                    </div>
                    
                    <p>As an admin, you now have access to:</p>
                    <ul>
                        <li>Platform analytics and insights</li>
                        <li>User and service management tools</li>
                        <li>Advanced dashboard features</li>
                        <li>System administration controls</li>
                    </ul>
                    
                    <div style="text-align: center;">
                        <a href="https://delicate-rabanadas-9a8271.netlify.app/admin/dashboard" class="button">Access Admin Portal</a>
                    </div>
                    
                    <p><strong>Next Steps:</strong></p>
                    <ol>
                        <li>Visit the admin portal using the link above</li>
                        <li>Use your existing email for OTP authentication</li>
                        <li>Explore your new admin capabilities</li>
                    </ol>
                    
                    <p>Your user account remains active - you can still access all regular features plus your new admin privileges.</p>
                    
                    <p>Questions? Contact: admin@launchkart.com</p>
                </div>
                <div class="footer">
                    <p>© 2025 LaunchKart. Welcome to the Admin Team!</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        text_body = f"""
        Congratulations! You've been promoted to LaunchKart Admin!
        
        Hello {full_name},
        
        {promoted_by} has promoted you to {role} on the LaunchKart admin team.
        
        Access the admin portal: https://delicate-rabanadas-9a8271.netlify.app/admin/dashboard
        
        Use your existing email for OTP authentication.
        
        Best regards,
        LaunchKart Team
        """
        
        return self._send_email(to_email, subject, html_body, text_body)
    
    def send_password_reset(self, to_email: str, full_name: str, reset_token: str) -> bool:
        """Send password reset link"""
        reset_url = f"https://delicate-rabanadas-9a8271.netlify.app/reset-password?token={reset_token}"
        
        subject = "🔑 Reset Your LaunchKart Password"
        
        html_body = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <style>
                .container {{ max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; }}
                .header {{ background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; }}
                .content {{ padding: 30px; background: #f9f9f9; }}
                .button {{ 
                    display: inline-block; 
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                    color: white; 
                    padding: 15px 30px; 
                    text-decoration: none; 
                    border-radius: 8px; 
                    font-weight: bold;
                    margin: 20px 0;
                }}
                .footer {{ padding: 20px; text-align: center; color: #666; font-size: 12px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🔑 Password Reset</h1>
                    <p>LaunchKart Account Security</p>
                </div>
                <div class="content">
                    <h2>Hello {full_name},</h2>
                    
                    <p>We received a request to reset your LaunchKart account password.</p>
                    
                    <div style="text-align: center;">
                        <a href="{reset_url}" class="button">Reset Password</a>
                    </div>
                    
                    <p>If the button doesn't work, copy and paste this link:</p>
                    <p style="word-break: break-all; color: #4f46e5;">{reset_url}</p>
                    
                    <p><strong>Security Notice:</strong></p>
                    <ul>
                        <li>This link expires in 1 hour</li>
                        <li>If you didn't request this reset, ignore this email</li>
                        <li>Your password won't change until you create a new one</li>
                    </ul>
                    
                    <p>For security questions, contact our support team.</p>
                    
                    <p>Best regards,<br>LaunchKart Security Team</p>
                </div>
                <div class="footer">
                    <p>© 2025 LaunchKart. Account security is our priority.</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        text_body = f"""
        LaunchKart Password Reset
        
        Hello {full_name},
        
        Reset your password: {reset_url}
        
        This link expires in 1 hour.
        
        Best regards,
        LaunchKart Security Team
        """
        
        return self._send_email(to_email, subject, html_body, text_body)

# Create global email service instance
email_service = EmailService()

# Convenience functions for backward compatibility
async def send_otp_email(email: str, otp: str, full_name: str):
    """Send OTP email - backward compatibility"""
    return email_service.send_admin_otp(email, full_name, otp)

async def send_admin_promotion_email(email: str, full_name: str, role: str, promoted_by: str):
    """Send admin promotion email - backward compatibility"""
    return email_service.send_admin_promotion_notification(email, full_name, role, promoted_by)