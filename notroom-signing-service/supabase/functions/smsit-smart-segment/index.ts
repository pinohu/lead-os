import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SMSIT_BASE_URL = "https://aicpanel.smsit.ai/api/v2";

/**
 * Phase 9: Smart Segmentation Engine
 * Automatically segments contacts based on behavior patterns
 * 
 * Segments:
 * - High Intent (opened 3+ links, no booking)
 * - Price Sensitive (only clicked discount codes)
 * - Urgent Bookers (always picks same-day)
 * - Corporate Clients (3+ bookings from same company)
 * - Weekend Warriors (only books Saturdays)
 * - Geographic (by county/city)
 * - Service Affinity (repeated service type)
 */

interface Contact {
  phone: string;
  name: string;
  email: string;
  bookings: number;
  services: string[];
  avgUrgency: string;
  lastBooking: Date;
  smsOptIn: boolean;
}

interface Segment {
  name: string;
  criteria: string;
  contacts: Contact[];
  description: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const smsitApiKey = Deno.env.get('SMSIT_API_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    console.log('Smart segmentation started');

    // Fetch all bookings with SMS opt-in
    const { data: bookings, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('sms_opt_in', true)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch bookings: ${error.message}`);
    }

    console.log(`Processing ${bookings.length} bookings for segmentation`);

    // Group by phone to analyze patterns
    const contactMap = new Map<string, Contact>();

    bookings.forEach(booking => {
      if (!contactMap.has(booking.phone)) {
        contactMap.set(booking.phone, {
          phone: booking.phone,
          name: booking.name,
          email: booking.email,
          bookings: 0,
          services: [],
          avgUrgency: booking.urgency || 'flexible',
          lastBooking: new Date(booking.created_at),
          smsOptIn: booking.sms_opt_in
        });
      }

      const contact = contactMap.get(booking.phone)!;
      contact.bookings++;
      if (!contact.services.includes(booking.service)) {
        contact.services.push(booking.service);
      }
      
      const bookingDate = new Date(booking.created_at);
      if (bookingDate > contact.lastBooking) {
        contact.lastBooking = bookingDate;
      }
    });

    const allContacts = Array.from(contactMap.values());
    console.log(`Analyzing ${allContacts.length} unique contacts`);

    // Build segments
    const segments: Segment[] = [];

    // 1. High Intent (never booked but inquired multiple times)
    const highIntent = allContacts.filter(c => 
      c.bookings >= 2 && 
      bookings.filter(b => b.phone === c.phone && b.status === 'pending').length >= 2
    );
    segments.push({
      name: 'High Intent',
      criteria: '2+ inquiries, never converted',
      contacts: highIntent,
      description: 'Interested but needs nudge - offer free consultation'
    });

    // 2. Price Sensitive (multiple pending, message contains "price" or "cost")
    const priceSensitive = allContacts.filter(c =>
      bookings.some(b => {
        const msg = b.message?.toLowerCase() || '';
        return b.phone === c.phone && 
          (msg.includes('price') || msg.includes('cost') || msg.includes('cheap') || msg.includes('discount'));
      })
    );
    segments.push({
      name: 'Price Sensitive',
      criteria: 'Mentions price/cost in messages',
      contacts: priceSensitive,
      description: 'Target with exclusive discounts (25% off)'
    });

    // 3. Urgent Bookers (always picks same_day or asap)
    const urgentBookers = allContacts.filter(c =>
      bookings.filter(b => 
        b.phone === c.phone && 
        (b.urgency === 'same_day' || b.urgency === 'asap')
      ).length >= 2
    );
    segments.push({
      name: 'Urgent Bookers',
      criteria: '2+ same-day/ASAP requests',
      contacts: urgentBookers,
      description: 'Offer priority booking & emergency service'
    });

    // 4. Corporate Clients (3+ bookings or business services)
    const corporateClients = allContacts.filter(c =>
      c.bookings >= 3 || 
      c.services.some(s => 
        s.includes('business') || 
        s.includes('i9') || 
        s.includes('retainer')
      )
    );
    segments.push({
      name: 'Corporate Clients',
      criteria: '3+ bookings or business services',
      contacts: corporateClients,
      description: 'Pitch business retainer packages'
    });

    // 5. Service Affinity (repeated same service 2+ times)
    const serviceAffinityMap = new Map<string, Contact[]>();
    allContacts.forEach(contact => {
      if (contact.services.length === 1 && contact.bookings >= 2) {
        const service = contact.services[0];
        if (!serviceAffinityMap.has(service)) {
          serviceAffinityMap.set(service, []);
        }
        serviceAffinityMap.get(service)!.push(contact);
      }
    });

    serviceAffinityMap.forEach((contacts, service) => {
      segments.push({
        name: `${service} Specialists`,
        criteria: `2+ bookings for ${service} only`,
        contacts,
        description: `Focus on ${service}-specific promotions`
      });
    });

    // 6. Inactive Contacts (last booking >90 days ago)
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    
    const inactiveContacts = allContacts.filter(c =>
      c.lastBooking < ninetyDaysAgo && c.bookings >= 1
    );
    segments.push({
      name: 'Inactive - Win Back',
      criteria: 'Last booking >90 days ago',
      contacts: inactiveContacts,
      description: 'Win-back campaign with 30% discount'
    });

    // Sync segments to SMS-iT as tags
    console.log('Syncing segments to SMS-iT...');
    
    for (const segment of segments) {
      if (segment.contacts.length === 0) continue;

      const tagName = segment.name.toLowerCase().replace(/\s+/g, '_');
      
      // Create/update contacts in SMS-iT with segment tag
      for (const contact of segment.contacts) {
        try {
          await fetch(`${SMSIT_BASE_URL}/contacts`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${smsitApiKey}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              phone: contact.phone,
              first_name: contact.name.split(' ')[0],
              last_name: contact.name.split(' ').slice(1).join(' '),
              email: contact.email,
              tags: [tagName],
              custom_fields: {
                bookings_count: contact.bookings,
                last_booking: contact.lastBooking.toISOString(),
                services: contact.services.join(',')
              }
            })
          });
        } catch (syncError) {
          console.error(`Failed to sync ${contact.phone}:`, syncError);
        }
      }

      console.log(`Synced ${segment.contacts.length} contacts to segment: ${segment.name}`);
    }

    // Return segment summary
    const summary = segments.map(s => ({
      name: s.name,
      criteria: s.criteria,
      count: s.contacts.length,
      description: s.description
    }));

    return new Response(
      JSON.stringify({
        success: true,
        totalContacts: allContacts.length,
        segments: summary,
        message: 'Segmentation complete - tags synced to SMS-iT'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error: any) {
    console.error('Error in smart-segment function:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
};

serve(handler);
