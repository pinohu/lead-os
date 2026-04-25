import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch CallScaler DNI configuration
    const { data: config } = await supabase
      .from('integration_config')
      .select('config')
      .eq('tool', 'callscaler')
      .eq('active', true)
      .maybeSingle();

    if (!config?.config?.dni_script) {
      console.error('No DNI script configured');
      return new Response(
        '// CallScaler DNI not configured. Please set up in admin panel.',
        { 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/javascript',
            'Cache-Control': 'no-cache'
          } 
        }
      );
    }

    // Generate dynamic DNI script with number pool mapping
    const dniScript = generateDNIScript(config.config);

    return new Response(dniScript, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/javascript',
        'Cache-Control': 'public, max-age=300', // Cache for 5 minutes
      },
    });
  } catch (error) {
    console.error('DNI script error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      `// Error loading DNI script: ${errorMessage}`,
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/javascript' 
        } 
      }
    );
  }
});

function generateDNIScript(config: any): string {
  const { number_pool = [], default_number } = config;

  return `
(function() {
  'use strict';
  
  // CallScaler Dynamic Number Insertion (DNI)
  var numberPool = ${JSON.stringify(number_pool)};
  var defaultNumber = '${default_number || ''}';
  
  function getSourceFromURL() {
    var params = new URLSearchParams(window.location.search);
    return {
      source: params.get('utm_source') || params.get('source'),
      medium: params.get('utm_medium'),
      campaign: params.get('utm_campaign'),
      gclid: params.get('gclid'),
      fbclid: params.get('fbclid')
    };
  }
  
  function selectTrackingNumber(source) {
    // Map source to tracking number
    if (source.gclid) return findNumber('google_ads');
    if (source.fbclid) return findNumber('facebook_ads');
    if (source.source === 'google' && source.medium === 'organic') return findNumber('google_organic');
    if (source.source === 'gbp') return findNumber('google_business_profile');
    if (source.campaign) return findNumber('campaign_' + source.campaign);
    
    return defaultNumber;
  }
  
  function findNumber(label) {
    var match = numberPool.find(function(n) { return n.label === label; });
    return match ? match.number : defaultNumber;
  }
  
  function replacePhoneNumbers(number) {
    if (!number) return;
    
    // Find all phone number elements
    var elements = document.querySelectorAll('[href^="tel:"], .phone-number, [data-phone]');
    
    elements.forEach(function(el) {
      if (el.tagName === 'A' && el.href.startsWith('tel:')) {
        el.href = 'tel:' + number;
        el.textContent = formatPhoneNumber(number);
      } else {
        el.textContent = formatPhoneNumber(number);
        if (el.dataset) {
          el.dataset.phone = number;
        }
      }
    });
    
    console.log('CallScaler DNI: Replaced with', number);
  }
  
  function formatPhoneNumber(number) {
    // Format as (XXX) XXX-XXXX
    var cleaned = number.replace(/\\D/g, '');
    if (cleaned.length === 11) cleaned = cleaned.substring(1);
    if (cleaned.length === 10) {
      return '(' + cleaned.substring(0,3) + ') ' + cleaned.substring(3,6) + '-' + cleaned.substring(6);
    }
    return number;
  }
  
  // Execute on page load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      var source = getSourceFromURL();
      var trackingNumber = selectTrackingNumber(source);
      replacePhoneNumbers(trackingNumber);
    });
  } else {
    var source = getSourceFromURL();
    var trackingNumber = selectTrackingNumber(source);
    replacePhoneNumbers(trackingNumber);
  }
  
  // Store source for attribution
  try {
    sessionStorage.setItem('callscaler_source', JSON.stringify(getSourceFromURL()));
  } catch(e) {}
})();
`;
}
