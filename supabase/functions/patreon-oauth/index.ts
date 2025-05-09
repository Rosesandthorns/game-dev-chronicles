
import { serve } from "https://deno.land/std@0.195.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.21.0";

const PATREON_CLIENT_ID = Deno.env.get("PATREON_CLIENT_ID") || "";
const PATREON_CLIENT_SECRET = Deno.env.get("PATREON_CLIENT_SECRET") || "";
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
    const url = new URL(req.url);
    const code = url.searchParams.get("code");
    const redirect_url = url.searchParams.get("redirect_url");
    // Get the auth token from query parameters if not in headers
    const authTokenFromQuery = url.searchParams.get("auth_token");
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Step 1: If we don't have a code, redirect to Patreon auth page
    if (!code) {
      // Store the auth token in the redirect URL to retrieve it later
      const redirectUri = `${url.origin}${url.pathname}?redirect_url=${encodeURIComponent(
        redirect_url || url.origin
      )}&auth_token=${authTokenFromQuery || ""}`;

      const patreonAuthUrl = new URL("https://www.patreon.com/oauth2/authorize");
      patreonAuthUrl.searchParams.append("client_id", PATREON_CLIENT_ID);
      patreonAuthUrl.searchParams.append("redirect_uri", redirectUri);
      patreonAuthUrl.searchParams.append("response_type", "code");
      patreonAuthUrl.searchParams.append("scope", "identity identity[email] campaigns");

      return new Response(null, {
        status: 302,
        headers: { 
          ...corsHeaders,
          Location: patreonAuthUrl.toString() 
        }
      });
    }

    // Step 2: If we have a code, exchange it for access token
    const tokenResponse = await fetch("https://www.patreon.com/api/oauth2/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        grant_type: "authorization_code",
        client_id: PATREON_CLIENT_ID,
        client_secret: PATREON_CLIENT_SECRET,
        redirect_uri: `${url.origin}${url.pathname}?redirect_url=${encodeURIComponent(
          redirect_url || url.origin
        )}&auth_token=${authTokenFromQuery || ""}`,
      }),
    });

    const tokenData = await tokenResponse.json();
    const { access_token, refresh_token } = tokenData;

    if (!access_token) {
      throw new Error("Failed to get Patreon access token");
    }

    // Step 3: Get user identity from Patreon
    const identityResponse = await fetch("https://www.patreon.com/api/oauth2/v2/identity", {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    });

    const identityData = await identityResponse.json();
    const patreonUserId = identityData?.data?.id;
    
    if (!patreonUserId) {
      throw new Error("Failed to get Patreon user identity");
    }

    // Step 4: Get user's membership tiers
    const campaignsResponse = await fetch(
      "https://www.patreon.com/api/oauth2/v2/campaigns?include=tiers",
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }
    );

    const campaignsData = await campaignsResponse.json();
    
    // Step 5: Get the user's current tier
    const memberResponse = await fetch(
      `https://www.patreon.com/api/oauth2/v2/members?include=currently_entitled_tiers&filter[user_id]=${patreonUserId}`,
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }
    );

    const memberData = await memberResponse.json();
    const tiers = memberData?.included || [];
    
    // Determine tier level based on tier names and prices
    let tierLevel = null;
    
    if (tiers.length > 0) {
      // Map tier names to our tier structure
      const highestTier = tiers.reduce((highest: any, tier: any) => {
        const tierPrice = tier.attributes?.amount_cents || 0;
        const tierTitle = tier.attributes?.title || "";
        const highestPrice = highest?.attributes?.amount_cents || 0;
        
        // Log tier details for debugging
        console.log(`Found tier: ${tierTitle}, price: ${tierPrice} cents`);
        
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

    // Step 6: Get the current user from Supabase
    // Try to get the auth token from query parameters if not provided in headers
    let token = authTokenFromQuery || "";
    
    // If no token is available, redirect to an error page
    if (!token) {
      console.error("No authorization token provided");
      return new Response(JSON.stringify({ 
        error: "Missing authentication token. Please try connecting again." 
      }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      console.error("Failed to get user:", userError?.message || "User not found");
      // Redirect to login page with error
      return new Response(null, {
        status: 302,
        headers: {
          ...corsHeaders,
          Location: `${redirect_url || url.origin}/auth?error=auth_error&message=${encodeURIComponent("Authentication failed. Please login and try again.")}`,
        },
      });
    }

    // Step 7: Update user profile with Patreon information
    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        patreon_id: patreonUserId,
        patreon_connected: true,
        patreon_tier: tierLevel,
        patreon_token: access_token,
        patreon_refresh_token: refresh_token
      })
      .eq("user_id", user.id);

    if (updateError) {
      throw new Error("Failed to update user profile: " + updateError.message);
    }

    // Step 8: Redirect back to app
    return new Response(null, {
      status: 302,
      headers: {
        ...corsHeaders,
        Location: redirect_url || url.origin,
      },
    });
  } catch (error) {
    console.error("Patreon OAuth Error:", error);
    
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";
    
    // Return a more user-friendly error page
    return new Response(
      `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Patreon Connection Error</title>
        <style>
          body { font-family: Arial, sans-serif; background: #121212; color: white; text-align: center; padding: 50px; }
          .container { max-width: 600px; margin: 0 auto; background: #1a1a1a; padding: 30px; border-radius: 8px; }
          .error { color: #ff5555; margin: 20px 0; }
          .button { background: #626AF1; color: white; padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer; text-decoration: none; display: inline-block; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>Patreon Connection Failed</h1>
          <p class="error">${errorMessage}</p>
          <p>There was an issue connecting your Patreon account. Please try again.</p>
          <a href="/" class="button">Return to Home</a>
        </div>
      </body>
      </html>
      `,
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "text/html" },
      }
    );
  }
});
