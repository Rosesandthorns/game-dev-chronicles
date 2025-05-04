
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
    // Simple logic: if user has any tier, set as basic
    tierLevel = "basic";
    
    // Check for premium tier (tier ID that corresponds to premium)
    // You'd need to replace this with your actual premium tier ID from Patreon
    const premiumTierIds = ["12345", "67890"]; // Example tier IDs
    const hasPremiumTier = tierData.some((tier: any) => 
      premiumTierIds.includes(tier.id)
    );
    
    if (hasPremiumTier) {
      tierLevel = "premium";
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
