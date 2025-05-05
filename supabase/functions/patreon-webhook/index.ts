
import { serve } from "https://deno.land/std@0.195.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.21.0";

const PATREON_WEBHOOK_SECRET = Deno.env.get("PATREON_WEBHOOK_SECRET") || "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Verify the webhook signature
    const signature = req.headers.get("x-patreon-signature");
    if (!signature) {
      throw new Error("Missing webhook signature");
    }

    // Parse the webhook payload
    const payload = await req.json();
    const eventType = req.headers.get("x-patreon-event");
    
    // Initialize Supabase client
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    // Handle different webhook event types
    switch (eventType) {
      case "members:pledge:create":
      case "members:pledge:update":
        await handlePledgeCreate(supabase, payload);
        break;
        
      case "members:pledge:delete":
        await handlePledgeDelete(supabase, payload);
        break;
        
      default:
        console.log(`Unhandled webhook event type: ${eventType}`);
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Patreon Webhook Error:", error);
    
    return new Response(
      JSON.stringify({ error: error.message || "An unexpected error occurred" }), 
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

// Handle pledge creation or update
async function handlePledgeCreate(supabase: any, payload: any) {
  const patreonUserId = payload?.data?.relationships?.user?.data?.id;
  const tierData = payload?.data?.relationships?.currently_entitled_tiers?.data;
  
  if (!patreonUserId) {
    throw new Error("Missing Patreon user ID in payload");
  }
  
  // Determine tier level based on entitled tiers
  let tierLevel = null;
  
  if (tierData && tierData.length > 0) {
    // Get tier details to determine tier level
    const tierIds = tierData.map((tier: any) => tier.id);
    
    // Fetch tier details from Patreon API
    const tierLookup = payload.included?.filter((item: any) => 
      item.type === 'tier' && tierIds.includes(item.id)
    ) || [];
    
    // Process tier data to determine appropriate tier level
    const highestTier = tierLookup.reduce((highest: any, tier: any) => {
      const tierPrice = tier.attributes?.amount_cents || 0;
      const tierTitle = tier.attributes?.title || "";
      
      // Log tier details for debugging
      console.log(`Processing tier: ${tierTitle}, price: ${tierPrice} cents`);
      
      // Assign specific tier based on either name or price
      const titleLower = tierTitle.toLowerCase();
      
      // Check if the tier name contains specific keywords
      if (titleLower.includes("founder")) {
        return { ...tier, priority: 3 };
      } else if (titleLower.includes("supporter")) {
        return highest?.priority === 3 ? highest : { ...tier, priority: 2 };
      } else if (titleLower.includes("basic")) {
        return highest?.priority >= 2 ? highest : { ...tier, priority: 1 };
      }
      
      // If no specific name match, fall back to price-based logic
      if (tierPrice >= 2000) { // $20 or more - Founder
        return highest?.priority === 3 ? highest : { ...tier, priority: 3 };
      } else if (tierPrice >= 1000) { // $10 or more - Supporter
        return highest?.priority === 3 ? highest : { ...tier, priority: 2 };
      } else if (tierPrice > 0) { // Any paid tier - Basic
        return highest?.priority >= 2 ? highest : { ...tier, priority: 1 };
      }
      
      return highest || { ...tier, priority: 0 };
    }, null);
    
    // Convert priority levels to tier names
    if (highestTier) {
      if (highestTier.priority === 3) {
        tierLevel = "patreon_founder";
      } else if (highestTier.priority === 2) {
        tierLevel = "patreon_supporter";
      } else if (highestTier.priority === 1) {
        tierLevel = "patreon_basic";
      }
    }
  }
  
  // Update user profile with new tier information
  const { data, error } = await supabase
    .from("profiles")
    .update({
      patreon_tier: tierLevel,
      patreon_connected: true
    })
    .eq("patreon_id", patreonUserId);
  
  if (error) {
    throw new Error(`Failed to update user tier: ${error.message}`);
  }
}

// Handle pledge deletion
async function handlePledgeDelete(supabase: any, payload: any) {
  const patreonUserId = payload?.data?.relationships?.user?.data?.id;
  
  if (!patreonUserId) {
    throw new Error("Missing Patreon user ID in payload");
  }
  
  // Remove tier information from user profile
  const { error } = await supabase
    .from("profiles")
    .update({
      patreon_tier: null
    })
    .eq("patreon_id", patreonUserId);
  
  if (error) {
    throw new Error(`Failed to update user tier: ${error.message}`);
  }
}
