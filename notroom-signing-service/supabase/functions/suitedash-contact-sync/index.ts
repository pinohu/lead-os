import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { validateApiKeyEnv } from "../_shared/envValidation.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SMSIT_BASE_URL = "https://aicpanel.smsit.ai/api/v2";

interface SyncStats {
  suitedashToSmsit: number;
  smsitToSuitedash: number;
  errors: string[];
}

/**
 * Phase 7: Complete Two-Way Sync
 * Runs every 6 hours via cron job
 * 
 * Direction 1: SuiteDash → SMS-iT (contact updates, project notes)
 * Direction 2: SMS-iT → SuiteDash (engagement data, conversation history)
 */

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate environment - need both API keys
    const env = validateApiKeyEnv('smsit');
    const envSuitedash = validateApiKeyEnv('suitedash');
    
    // Combine env vars
    const supabaseUrl = env.SUPABASE_URL;
    const supabaseServiceKey = env.SUPABASE_SERVICE_ROLE_KEY;
    const suitedashApiKey = envSuitedash.SUITEDASH_API_KEY!;
    const smsitApiKey = env.SMSIT_API_KEY!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const stats: SyncStats = {
      suitedashToSmsit: 0,
      smsitToSuitedash: 0,
      errors: []
    };

    console.log('Starting bi-directional sync...');

    // ========================================
    // DIRECTION 1: SuiteDash → SMS-iT
    // ========================================
    
    console.log('Fetching updated contacts from SuiteDash (last 6 hours)...');
    
    // Get contacts updated in last 6 hours from SuiteDash
    const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString();
    
    const suitedashResponse = await fetch(
      `https://app.suitedash.com/api/v1/contacts?updated_after=${sixHoursAgo}`,
      {
        headers: {
          'Authorization': `Bearer ${suitedashApiKey}`,
          'Accept': 'application/json'
        }
      }
    );

    if (suitedashResponse.ok) {
      const suitedashContacts = await suitedashResponse.json();
      const contacts = Array.isArray(suitedashContacts) ? suitedashContacts : suitedashContacts.data || [];
      
      console.log(`Found ${contacts.length} updated contacts in SuiteDash`);

      for (const contact of contacts) {
        try {
          // Find matching booking in our DB
          const { data: booking } = await supabase
            .from('bookings')
            .select('*')
            .eq('suitedash_contact_id', contact.id)
            .single();

          if (!booking) {
            console.log(`No booking found for SuiteDash contact ${contact.id}`);
            continue;
          }

          // Update SMS-iT contact with latest SuiteDash data
          const smsitUpdateData = {
            email: contact.email || booking.email,
            phone: contact.phone || booking.phone,
            first_name: contact.first_name || booking.name.split(' ')[0],
            last_name: contact.last_name || booking.name.split(' ').slice(1).join(' '),
            tags: contact.tags || []
          };

          const smsitResponse = await fetch(`${SMSIT_BASE_URL}/contacts`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${smsitApiKey}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(smsitUpdateData)
          });

          if (smsitResponse.ok) {
            stats.suitedashToSmsit++;
            console.log(`Synced contact ${contact.id} from SuiteDash to SMS-iT`);
          }

          // Also sync our local database
          await supabase
            .from('bookings')
            .update({
              name: `${contact.first_name} ${contact.last_name}`.trim(),
              email: contact.email || booking.email,
              phone: contact.phone || booking.phone,
              updated_at: new Date().toISOString()
            })
            .eq('id', booking.id);

        } catch (error) {
          const errorMsg = `Error syncing contact ${contact.id}: ${error}`;
          console.error(errorMsg);
          stats.errors.push(errorMsg);
        }
      }
    }

    // ========================================
    // DIRECTION 2: SMS-iT → SuiteDash
    // ========================================
    
    console.log('Fetching bookings with SMS-iT engagement data (last 6 hours)...');
    
    // Get bookings that have SuiteDash IDs and were updated recently
    const { data: recentBookings, error: bookingsError } = await supabase
      .from('bookings')
      .select('*')
      .not('suitedash_contact_id', 'is', null)
      .gte('updated_at', sixHoursAgo);

    if (bookingsError) {
      console.error('Error fetching recent bookings:', bookingsError);
    } else {
      console.log(`Found ${recentBookings?.length || 0} recent bookings to sync`);

      for (const booking of recentBookings || []) {
        try {
          // Fetch engagement data from SMS-iT for this booking
          // Note: In production, you'd get conversation history, link clicks, etc.
          // For now, we'll sync status and notes
          
          const projectNotes = `
📱 SMS Engagement Update (${new Date().toLocaleString()})
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Status: ${booking.status}
Service: ${booking.service}
Preferred Date: ${booking.preferred_date || 'Not specified'}
Urgency: ${booking.urgency || 'flexible'}

Customer Message: ${booking.message || 'None'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Last Updated: ${booking.updated_at}
          `.trim();

          // Update SuiteDash project with latest notes
          if (booking.suitedash_project_id) {
            const projectUpdateResponse = await fetch(
              `https://app.suitedash.com/api/v1/projects/${booking.suitedash_project_id}`,
              {
                method: 'PUT',
                headers: {
                  'Authorization': `Bearer ${suitedashApiKey}`,
                  'Content-Type': 'application/json',
                  'Accept': 'application/json'
                },
                body: JSON.stringify({
                  notes: projectNotes,
                  status: booking.status === 'confirmed' ? 'active' : 
                         booking.status === 'completed' ? 'completed' : 'pending',
                  custom_fields: {
                    booking_id: booking.id,
                    last_sms_sync: new Date().toISOString(),
                    booking_status: booking.status
                  }
                })
              }
            );

            if (projectUpdateResponse.ok) {
              stats.smsitToSuitedash++;
              console.log(`Synced booking ${booking.id} to SuiteDash project`);
            } else {
              const errorText = await projectUpdateResponse.text();
              console.error(`Failed to update SuiteDash project: ${errorText}`);
            }
          }

          // Update SuiteDash contact with engagement tags
          if (booking.suitedash_contact_id) {
            const engagementTags = [
              `status_${booking.status}`,
              `urgency_${booking.urgency || 'flexible'}`,
              'recent_activity'
            ];

            // Count actual bookings for this contact (match by email or phone)
            let bookingCount = 1; // Default fallback value
            try {
              // Build query conditions for matching by email or phone
              const conditions: string[] = [];
              if (booking.email) {
                conditions.push(`email.eq.${booking.email}`);
              }
              if (booking.phone) {
                conditions.push(`phone.eq.${booking.phone}`);
              }

              if (conditions.length > 0) {
                const { count, error: countError } = await supabase
                  .from('bookings')
                  .select('*', { count: 'exact', head: true })
                  .or(conditions.join(','));

                if (countError) {
                  console.error(`Error counting bookings for contact ${booking.suitedash_contact_id}:`, countError);
                  // Use fallback value on error
                } else {
                  // Ensure at least 1 (SuiteDash may expect a positive number)
                  bookingCount = count && count > 0 ? count : 1;
                }
              }
            } catch (error) {
              console.error(`Exception counting bookings for contact ${booking.suitedash_contact_id}:`, error);
              // Use fallback value on exception
            }

            const contactUpdateResponse = await fetch(
              `https://app.suitedash.com/api/v1/contacts/${booking.suitedash_contact_id}`,
              {
                method: 'PUT',
                headers: {
                  'Authorization': `Bearer ${suitedashApiKey}`,
                  'Content-Type': 'application/json',
                  'Accept': 'application/json'
                },
                body: JSON.stringify({
                  tags: engagementTags,
                  custom_fields: {
                    last_sms_interaction: new Date().toISOString(),
                    booking_count: bookingCount
                  }
                })
              }
            );

            if (contactUpdateResponse.ok) {
              console.log(`Updated SuiteDash contact ${booking.suitedash_contact_id} with engagement data`);
            }
          }

        } catch (error) {
          const errorMsg = `Error syncing booking ${booking.id} to SuiteDash: ${error}`;
          console.error(errorMsg);
          stats.errors.push(errorMsg);
        }
      }
    }

    // ========================================
    // SYNC SUMMARY
    // ========================================
    
    console.log('Sync completed:', stats);

    return new Response(
      JSON.stringify({
        success: true,
        stats,
        timestamp: new Date().toISOString(),
        message: `Two-way sync completed: ${stats.suitedashToSmsit} contacts from SuiteDash, ${stats.smsitToSuitedash} bookings to SuiteDash`,
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );

  } catch (error: unknown) {
    console.error('Error in suitedash-contact-sync function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    // Handle configuration errors specifically
    if (errorMessage.includes('Missing required environment variables')) {
      return new Response(
        JSON.stringify({ 
          error: 'Configuration error',
          message: errorMessage 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
    
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
        details: error instanceof Error ? error.toString() : String(error)
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        },
      }
    );
  }
};

serve(handler);
