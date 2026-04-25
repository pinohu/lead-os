/**
 * Booking confirmation email template
 */

interface BookingConfirmationTemplateProps {
  bookingId: string;
  serviceType: string;
  date: string;
  time: string;
  location: string;
}

export function bookingConfirmationTemplate(details: BookingConfirmationTemplateProps): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Booking Confirmed - Notroom</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f5f5f5;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff;">
          <div style="text-align: center; margin-bottom: 30px;">
            <div style="width: 60px; height: 60px; background-color: #10b981; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 20px;">
              <span style="color: white; font-size: 30px;">✓</span>
            </div>
            <h1 style="color: #2563eb; margin: 0; font-size: 28px;">Booking Confirmed!</h1>
          </div>
          
          <p style="font-size: 16px; margin-bottom: 20px;">
            Your notary appointment has been confirmed. We look forward to serving you!
          </p>
          
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 30px 0;">
            <h2 style="color: #111827; font-size: 18px; margin-top: 0; margin-bottom: 15px;">Booking Details</h2>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #6b7280; font-size: 14px;"><strong>Booking ID:</strong></td>
                <td style="padding: 8px 0; color: #111827; font-size: 14px; text-align: right;">${details.bookingId}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280; font-size: 14px;"><strong>Service:</strong></td>
                <td style="padding: 8px 0; color: #111827; font-size: 14px; text-align: right;">${details.serviceType}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280; font-size: 14px;"><strong>Date:</strong></td>
                <td style="padding: 8px 0; color: #111827; font-size: 14px; text-align: right;">${details.date}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280; font-size: 14px;"><strong>Time:</strong></td>
                <td style="padding: 8px 0; color: #111827; font-size: 14px; text-align: right;">${details.time}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280; font-size: 14px;"><strong>Location:</strong></td>
                <td style="padding: 8px 0; color: #111827; font-size: 14px; text-align: right;">${details.location}</td>
              </tr>
            </table>
          </div>
          
          <p style="font-size: 16px; margin-bottom: 20px;">
            If you have any questions or need to make changes to your booking, please contact us at 
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





