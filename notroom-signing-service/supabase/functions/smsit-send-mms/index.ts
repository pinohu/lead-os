import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SMSIT_BASE_URL = "https://aicpanel.smsit.ai/api/v2";

/**
 * Phase 8: MMS Rich Media Integration
 * Send images, documents, and guides via MMS
 * 
 * Use cases:
 * - Send example ID photos (apostille services)
 * - Send form templates (I-9, notary forms)
 * - Send location maps (mobile notary)
 * - Send before/after examples (translation certification)
 * - Send step-by-step visual guides
 */

interface MMSRequest {
  bookingId?: string;
  phone: string;
  message: string;
  mediaUrls: string[]; // URLs to images/documents
  mediaType: 'example' | 'guide' | 'form' | 'map' | 'other';
  service?: string;
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
    
    const mmsRequest: MMSRequest = await req.json();
    console.log('MMS send request:', mmsRequest);

    if (!mmsRequest.mediaUrls || mmsRequest.mediaUrls.length === 0) {
      throw new Error('At least one media URL is required for MMS');
    }

    // Upload media files to SMS-iT first
    const uploadedMediaUrls: string[] = [];
    
    for (const mediaUrl of mmsRequest.mediaUrls) {
      try {
        console.log('Uploading media:', mediaUrl);
        
        // Upload to SMS-iT media storage
        const uploadResponse = await fetch(`${SMSIT_BASE_URL}/upload-mms`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${smsitApiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            media_url: mediaUrl,
            media_type: getMediaType(mediaUrl)
          })
        });

        if (!uploadResponse.ok) {
          console.error('Media upload failed:', await uploadResponse.text());
          continue; // Skip this media, try next one
        }

        const uploadData = await uploadResponse.json();
        uploadedMediaUrls.push(uploadData.url || uploadData.media_url);
        console.log('Media uploaded successfully:', uploadData);
        
      } catch (uploadError) {
        console.error('Error uploading media:', uploadError);
        // Continue with other media files
      }
    }

    if (uploadedMediaUrls.length === 0) {
      throw new Error('Failed to upload any media files');
    }

    // Send MMS via SMS-iT
    const mmsResponse = await fetch(`${SMSIT_BASE_URL}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${smsitApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        to: mmsRequest.phone,
        message: mmsRequest.message,
        media_urls: uploadedMediaUrls,
        message_type: 'mms',
        campaign_name: `mms_${mmsRequest.mediaType}`,
        track_links: true
      })
    });

    if (!mmsResponse.ok) {
      const errorText = await mmsResponse.text();
      console.error('MMS send failed:', errorText);
      throw new Error(`MMS send failed: ${errorText}`);
    }

    const mmsData = await mmsResponse.json();
    console.log('MMS sent successfully:', mmsData);

    // Log MMS in booking if bookingId provided
    if (mmsRequest.bookingId) {
      const { data: booking } = await supabase
        .from('bookings')
        .select('message')
        .eq('id', mmsRequest.bookingId)
        .single();

      const mmsLog = `\n[MMS Sent ${new Date().toLocaleString()}] Type: ${mmsRequest.mediaType}, Media count: ${uploadedMediaUrls.length}, Message: ${mmsRequest.message.substring(0, 50)}...`;
      
      await supabase
        .from('bookings')
        .update({
          message: (booking?.message || '') + mmsLog,
          updated_at: new Date().toISOString()
        })
        .eq('id', mmsRequest.bookingId);
    }

    return new Response(
      JSON.stringify({
        success: true,
        messageId: mmsData.id || mmsData.message_id,
        mediaUrlsSent: uploadedMediaUrls,
        message: 'MMS sent successfully'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error: any) {
    console.error('Error in smsit-send-mms function:', error);
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

/**
 * Determine media type from URL
 */
function getMediaType(url: string): string {
  const extension = url.split('.').pop()?.toLowerCase();
  
  if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension || '')) {
    return 'image';
  } else if (['pdf'].includes(extension || '')) {
    return 'document';
  } else if (['mp4', 'mov', 'avi'].includes(extension || '')) {
    return 'video';
  }
  
  return 'other';
}

serve(handler);
