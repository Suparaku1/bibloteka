import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    if (!supabaseUrl || !serviceRoleKey) {
      return new Response(JSON.stringify({ error: "Konfigurimi i backend-it mungon." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Verify caller is admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Jo i autorizuar" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user: caller } } = await adminClient.auth.getUser(token);
    if (!caller) {
      return new Response(JSON.stringify({ error: "Jo i autorizuar" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check caller is admin
    const { data: roleData } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", caller.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleData) {
      return new Response(JSON.stringify({ error: "Vetëm administratorët mund të kryejnë këtë veprim" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { action, email, password, emri, mbiemri, userId } = body;

    if (action === "list") {
      // List all admin users
      const { data: roles } = await adminClient
        .from("user_roles")
        .select("user_id, created_at")
        .eq("role", "admin");

      if (!roles || roles.length === 0) {
        return new Response(JSON.stringify({ admins: [] }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const admins = [];
      for (const role of roles) {
        const { data: { user: adminUser } } = await adminClient.auth.admin.getUserById(role.user_id);
        admins.push({
          user_id: role.user_id,
          email: adminUser?.email || "—",
          emri: adminUser?.user_metadata?.emri || "—",
          mbiemri: adminUser?.user_metadata?.mbiemri || "—",
          created_at: role.created_at,
        });
      }

      return new Response(JSON.stringify({ admins }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "delete") {
      if (!userId) {
        return new Response(JSON.stringify({ error: "userId i nevojshëm" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Don't allow deleting yourself
      if (userId === caller.id) {
        return new Response(JSON.stringify({ error: "Nuk mund të fshini veten tuaj" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Delete role first, then user
      await adminClient.from("user_roles").delete().eq("user_id", userId);
      const { error: deleteError } = await adminClient.auth.admin.deleteUser(userId);
      if (deleteError) throw deleteError;

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Default action: create
    if (!email || !password) {
      return new Response(JSON.stringify({ error: "Email dhe fjalëkalimi janë të nevojshëm" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if user already exists
    const { data: existingUsers } = await adminClient.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find((u) => u.email?.toLowerCase() === email.toLowerCase());

    if (existingUser) {
      return new Response(JSON.stringify({ error: "Ky email ekziston tashmë" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: createdUser, error: createError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { emri, mbiemri },
    });

    if (createError) throw createError;

    // Assign admin role
    const { error: roleError } = await adminClient
      .from("user_roles")
      .insert({ user_id: createdUser.user.id, role: "admin" });

    if (roleError) throw roleError;

    return new Response(JSON.stringify({
      success: true,
      userId: createdUser.user.id,
      email,
      emri,
      mbiemri,
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gabim i panjohur";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
