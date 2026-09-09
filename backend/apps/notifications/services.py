import logging
from django.core.mail import send_mail, EmailMultiAlternatives
from django.conf import settings

logger = logging.getLogger(__name__)

def send_transactional_email(to_email: str, subject: str, text_content: str, html_content: str = None) -> bool:
    """
    Sends an email using the configured backend (Brevo SMTP in production, console in local dev).
    """
    if not to_email:
        logger.warning("Attempted to send email with empty recipient.")
        return False

    from_email = settings.DEFAULT_FROM_EMAIL
    try:
        msg = EmailMultiAlternatives(subject, text_content, from_email, [to_email])
        if html_content:
            msg.attach_alternative(html_content, "text/html")
        msg.send(fail_silently=False)
        logger.info(f"Email sent successfully to {to_email}: '{subject}'")
        return True
    except Exception as e:
        logger.error(f"Failed to send email to {to_email}: {e}")
        return False


def send_welcome_email(user) -> bool:
    """
    Sends a welcome email to newly registered users.
    """
    subject = "Welcome to ResQ - HyperLocal Food Excess Exchange"
    name = getattr(user, 'first_name', '') or getattr(user, 'business_name', '') or 'there'
    
    text_content = f"""Hello {name},

Welcome to ResQ! Your account has been created successfully.

Role: {getattr(user, 'role', 'Community Member')}
Email: {user.email}

Thank you for helping eliminate food waste in our community.

Warm regards,
The ResQ Team
"""

    html_content = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
        <h2 style="color: #0F766E;">Welcome to ResQ, {name}!</h2>
        <p style="color: #475569; font-size: 16px; line-height: 1.5;">
            Thank you for joining our mission to eliminate food waste and support our community.
        </p>
        <div style="background-color: #F0FDFA; padding: 16px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 4px 0; color: #115E59;"><strong>Email:</strong> {user.email}</p>
            <p style="margin: 4px 0; color: #115E59;"><strong>Role:</strong> {getattr(user, 'role', 'Community Member').capitalize()}</p>
        </div>
        <p style="color: #64748B; font-size: 14px;">
            If you have any questions, feel free to reply to this email.
        </p>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
        <p style="color: #94A3B8; font-size: 12px; text-align: center;">
            &copy; ResQ HyperLocal Food Excess Exchange
        </p>
    </div>
    """
    return send_transactional_email(user.email, subject, text_content, html_content)


def send_order_status_email(order, status_text: str) -> bool:
    """
    Sends an order notification email to the claimer or buyer.
    """
    user = getattr(order, 'consumer', None)
    if not user or not getattr(user, 'email', None):
        return False

    listing_title = getattr(order.listing, 'title', 'Food Surplus Item')
    subject = f"ResQ Order Update: {listing_title} ({status_text})"

    text_content = f"""Hello,

Your order for "{listing_title}" status is now: {status_text}.
Order ID: #{order.id}
Quantity: {getattr(order, 'quantity', 1)}

Thank you for choosing ResQ!
"""
    return send_transactional_email(user.email, subject, text_content)
