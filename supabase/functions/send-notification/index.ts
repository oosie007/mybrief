import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface NotificationPayload {
  userId: string;
  title: string;
  body: string;
  data?: Record<string, any>;
  type: 'daily_digest' | 'new_content' | 'reminder' | 'system';
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get request body
    const { userId, title, body, data, type }: NotificationPayload = await req.json()

    if (!userId || !title || !body) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: userId, title, body' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Get user's push token
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('expo_push_token, notification_enabled')
      .eq('id', userId)
      .single()

    if (userError || !userData) {
      return new Response(
        JSON.stringify({ error: 'User not found' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Check if notifications are enabled for this user
    if (!userData.notification_enabled) {
      return new Response(
        JSON.stringify({ message: 'Notifications disabled for user' }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Check if user has a push token
    if (!userData.expo_push_token) {
      return new Response(
        JSON.stringify({ error: 'No push token found for user' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Send push notification via Expo
    const expoResponse = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Accept-encoding': 'gzip, deflate',
      },
      body: JSON.stringify({
        to: userData.expo_push_token,
        title,
        body,
        data: { ...data, type },
        sound: 'default',
        priority: 'high',
      }),
    })

    if (!expoResponse.ok) {
      const errorText = await expoResponse.text()
      console.error('Expo push notification error:', errorText)
      return new Response(
        JSON.stringify({ error: 'Failed to send push notification' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const expoResult = await expoResponse.json()

    // Log notification in database
    await supabase
      .from('notification_logs')
      .insert({
        user_id: userId,
        title,
        body,
        type,
        data: data || {},
        sent_at: new Date().toISOString(),
        expo_response: expoResult,
      })

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Notification sent successfully',
        expoResult 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error sending notification:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
}) 