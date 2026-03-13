import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
      },
    });
  }

  try {
    const { email, password } = await req.json();

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Find user by email
    const { data: users, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    if (listError) throw listError;

    const user = users.users.find((u) => u.email === email);
    if (!user) throw new Error("User not found");

    // Update password
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(user.id, { password });
    if (updateError) throw updateError;

    // Ensure platform_admin role
    const { data: existingRole } = await supabaseAdmin
      .from("platform_roles")
      .select("id")
      .eq("user_id", user.id)
      .eq("role", "platform_admin")
      .maybeSingle();

    if (!existingRole) {
      await supabaseAdmin.from("platform_roles").insert({ user_id: user.id, role: "platform_admin" });
    }

    return new Response(JSON.stringify({ success: true, user_id: user.id }), {
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 400,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  }
});
