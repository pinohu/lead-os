/**
 * Email service for lead capture and marketing automation
 * Integrates with Emailit.com email service
 */

import { logger } from '@/utils/logger';
import { leadMagnetTemplate } from './emailTemplates/leadMagnet';
import { bookingConfirmationTemplate } from './emailTemplates/bookingConfirmation';
import { tcApplicationConfirmationTemplate } from './emailTemplates/tcApplicationConfirmation';
import { cropApplicationConfirmationTemplate } from './emailTemplates/cropApplicationConfirmation';

const DEFAULT_FROM = 'Notroom <noreply@notroom.com>';
const DEFAULT_FROM_EMAIL = 'noreply@notroom.com';

interface LeadData {
  email: string;
  name: string;
  resource?: string;
  timestamp?: number;
}

interface TransactionalEmailOptions {
  to: string;
  subject: string;
  html: string;
  from?: string;
  replyTo?: string;
}

/**
 * Send email via Emailit.com API
 * 
 * Note: The API endpoint and request format may need to be adjusted based on
 * Emailit.com's actual API documentation. Common variations:
 * - Endpoint might be `/api/send`, `/v1/emails`, or similar
 * - Auth might use API key in header (X-API-Key) or query param
 * - Request body format might differ
 * 
 * Check Emailit.com API docs and update VITE_EMAILIT_API_URL if needed.
 */
async function sendEmailViaEmailit(
  to: string,
  subject: string,
  html: string,
  from?: string
): Promise<boolean> {
  try {
    const { supabase } = await import('@/integrations/supabase/client');
    const { error } = await supabase.functions.invoke('send-booking-confirmation', {
      body: { to, subject, html, from: from || DEFAULT_FROM_EMAIL },
    });
    if (error) {
      logger.error('Email service error:', error);
      return false;
    }
    return true;
  } catch (error) {
    logger.error('Email service error:', error);
    return false;
  }
}

/**
 * Send lead magnet email and add to mailing list
 */
export async function captureLeadMagnetEmail(leadData: LeadData): Promise<boolean> {
  try {
    // Send welcome email
    const emailSent = await sendEmailViaEmailit(
      leadData.email,
      'Welcome to Notroom - Your Notary Resource',
      leadMagnetTemplate({
        name: leadData.name,
        resource: leadData.resource
      }),
      DEFAULT_FROM_EMAIL
    );

    if (emailSent) {
      logger.log('Lead captured and email sent:', leadData.email);
      return true;
    }

    return false;
  } catch (error) {
    logger.error('Email service error:', error);
    return false;
  }
}

/**
 * Send transactional email (booking confirmations, etc.)
 */
export async function sendTransactionalEmail(
  options: TransactionalEmailOptions
): Promise<boolean> {
  try {
    const emailSent = await sendEmailViaEmailit(
      options.to,
      options.subject,
      options.html,
      options.from || DEFAULT_FROM_EMAIL
    );

    if (emailSent) {
      logger.log('Transactional email sent:', { to: options.to, subject: options.subject });
      return true;
    }

    return false;
  } catch (error) {
    logger.error('Transactional email error:', error);
    return false;
  }
}

/**
 * Send booking confirmation email
 */
export async function sendBookingConfirmationEmail(
  email: string,
  bookingDetails: {
    bookingId: string;
    serviceType: string;
    date: string;
    time: string;
    location: string;
  }
): Promise<boolean> {
  const html = bookingConfirmationTemplate(bookingDetails);

  return sendTransactionalEmail({
    to: email,
    subject: 'Booking Confirmed - Notroom',
    html,
  });
}

/**
 * Send TC application confirmation email
 */
export async function sendTcApplicationConfirmationEmail(
  email: string,
  applicationDetails: {
    applicationId: string;
    clientName: string;
    transactionType: string;
    selectedPlan: string;
  }
): Promise<boolean> {
  const html = tcApplicationConfirmationTemplate(applicationDetails);

  return sendTransactionalEmail({
    to: email,
    subject: 'Transaction Coordination Application Confirmed - Notroom',
    html,
  });
}

/**
 * Send CROP application confirmation email
 */
export async function sendCropApplicationConfirmationEmail(
  email: string,
  applicationDetails: {
    applicationId: string;
    contactPerson: string;
    entityName: string;
    selectedPlan: string;
  }
): Promise<boolean> {
  const html = cropApplicationConfirmationTemplate(applicationDetails);

  return sendTransactionalEmail({
    to: email,
    subject: 'CROP Application Confirmed - Notroom',
    html,
  });
}
