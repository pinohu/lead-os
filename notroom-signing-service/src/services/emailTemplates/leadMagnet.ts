/**
 * Lead magnet welcome email template
 */

interface LeadMagnetTemplateProps {
  name: string;
  resource?: string;
}

export function leadMagnetTemplate({ name, resource }: LeadMagnetTemplateProps): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to Notroom</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f5f5f5;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2563eb; margin: 0; font-size: 28px;">Welcome to Notroom!</h1>
          </div>
          
          <p style="font-size: 16px; margin-bottom: 20px;">Hi ${name},</p>
          
          <p style="font-size: 16px; margin-bottom: 20px;">
            Thank you for your interest in Notroom! We're excited to help you with your notary needs.
          </p>
          
          ${resource ? `
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 30px 0;">
            <p style="margin: 0; font-size: 14px; color: #6b7280;">
              <strong>Resource:</strong> ${resource}
            </p>
          </div>
          ` : ''}
          
          <p style="font-size: 16px; margin-bottom: 20px;">
            We'll be in touch soon with helpful notary resources and information about our services.
          </p>
          
          <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
            <p style="font-size: 14px; color: #6b7280; margin: 0;">
              Best regards,<br>
              The Notroom Team
            </p>
          </div>
        </div>
      </body>
    </html>
  `;
}





