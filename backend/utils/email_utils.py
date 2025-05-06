from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from django.conf import settings

def send_html_email(subject, template_name, to_email, context):
    """Send an HTML email using a template"""
    try:
        # Add site URL to context for links
        if 'site_url' not in context:
            context['site_url'] = settings.SITE_URL if hasattr(settings, 'SITE_URL') else 'http://localhost:3000'
        
        # Render HTML content
        html_content = render_to_string(template_name, context)
        
        # Create a more descriptive plain text version
        plain_text = f"This email contains HTML content. Please use an HTML-compatible email client to view it properly.\n\n"
        if 'customer_name' in context:
            plain_text += f"Hello {context['customer_name']},\n\n"
        if 'order_id' in context:
            plain_text += f"Regarding your order #{context['order_id']}.\n\n"
        if 'reset_code' in context:
            plain_text += f"Your password reset code is: {context['reset_code']}\n\n"
        
        plain_text += "Thank you for choosing Winch Point Offroad House."
        
        # Create email with multiple parts
        email = EmailMultiAlternatives(
            subject,
            plain_text,
            f"Winch Point Offroad House <{settings.EMAIL_HOST_USER}>",  # Using a better from address
            [to_email]
        )
        
        # Attach HTML content with proper MIME type
        email.attach_alternative(html_content, "text/html")
        
        # Add email headers that help with HTML rendering
        email.mixed_subtype = 'related'
        
        # Send email
        return email.send()
    except Exception as e:
        print(f"HTML email error for template {template_name}: {e}")
        # Return False instead of raising the exception
        return False