/**
 * Transaction Coordination application confirmation email template
 */

interface TcApplicationConfirmationTemplateProps {
  applicationId: string;
  clientName: string;
  transactionType: string;
  selectedPlan: string;
}

export function tcApplicationConfirmationTemplate(details: TcApplicationConfirmationTemplateProps): string {
  const planNames: Record<string, string> = {
    basic: 'Basic Plan',
    standard: 'Standard Plan',
    premium: 'Premium Plan'
  };

  const transactionTypeNames: Record<string, string> = {
    real_estate: 'Real Estate Transaction',
    business_sale: 'Business Sale',
    merger_acquisition: 'Merger & Acquisition',
    contract_negotiation: 'Contract Negotiation',
    settlement: 'Settlement',
    other: 'Other Transaction'
  };

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Transaction Coordination Application Confirmed - Notroom</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f5f5f5;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff;">
          <div style="text-align: center; margin-bottom: 30px;">
            <div style="width: 60px; height: 60px; background-color: #10b981; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 20px;">
              <span style="color: white; font-size: 30px;">✓</span>
            </div>
            <h1 style="color: #2563eb; margin: 0; font-size: 28px;">Application Confirmed!</h1>
          </div>
          
          <p style="font-size: 16px; margin-bottom: 20px;">
            Hi ${details.clientName},
          </p>
          
          <p style="font-size: 16px; margin-bottom: 20px;">
            Your Transaction Coordination application has been successfully submitted and is now active. 
            Your transaction coordinator will contact you within 24 hours to get started.
          </p>
          
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 30px 0;">
            <h2 style="color: #111827; font-size: 18px; margin-top: 0; margin-bottom: 15px;">Application Details</h2>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #6b7280; font-size: 14px;"><strong>Application ID:</strong></td>
                <td style="padding: 8px 0; color: #111827; font-size: 14px; text-align: right;">${details.applicationId}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280; font-size: 14px;"><strong>Transaction Type:</strong></td>
                <td style="padding: 8px 0; color: #111827; font-size: 14px; text-align: right;">${transactionTypeNames[details.transactionType] || details.transactionType}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280; font-size: 14px;"><strong>Selected Plan:</strong></td>
                <td style="padding: 8px 0; color: #111827; font-size: 14px; text-align: right;">${planNames[details.selectedPlan] || details.selectedPlan}</td>
              </tr>
            </table>
          </div>
          
          <div style="background-color: #eff6ff; padding: 20px; border-radius: 8px; margin: 30px 0; border-left: 4px solid #2563eb;">
            <h3 style="color: #111827; font-size: 16px; margin-top: 0; margin-bottom: 10px;">What Happens Next?</h3>
            <ul style="margin: 0; padding-left: 20px; color: #374151; font-size: 14px;">
              <li style="margin-bottom: 8px;">Within 15 minutes, you'll receive a payment confirmation from Stripe</li>
              <li style="margin-bottom: 8px;">Within 24 hours, your assigned coordinator will contact you</li>
              <li style="margin-bottom: 8px;">You'll receive instructions for sharing documents securely</li>
              <li>You'll get access to your client portal</li>
            </ul>
          </div>
          
          <p style="font-size: 16px; margin-bottom: 20px;">
            If you have any questions, please contact us at 
            <a href="mailto:support@notroom.com" style="color: #2563eb; text-decoration: none;">support@notroom.com</a> 
            or call us at <a href="tel:814-480-0989" style="color: #2563eb; text-decoration: none;">(814) 480-0989</a>.
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





