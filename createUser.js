import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config();

// Supabase Admin Client (service role key required)
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// All test users with roles
const users = [
  { email: "pm@test.com", name: "Project Manager", role: "PM" },
  { email: "gc@test.com", name: "General Contractor", role: "GC" },
  { email: "sub@test.com", name: "Subcontractor", role: "SUB" },
  { email: "trade@test.com", name: "Trade Specialist", role: "TS" },
  { email: "viewer@test.com", name: "Viewer", role: "VIEWER" },
  { email: "bot@test.com", name: "System Bot", role: "BOT" },

  { email: "superadmin@test.com", name: "Super Admin", role: "SUPER" },
  { email: "admin@test.com", name: "Admin", role: "ADMIN" },
  { email: "finance@test.com", name: "Finance Manager", role: "FIN" },
  { email: "moderator@test.com", name: "Moderator", role: "MOD" },
  { email: "support@test.com", name: "Support Agent", role: "SUPPORT" },
];

async function createAllUsers() {
  console.log("🚀 Creating users...");

  for (const u of users) {
    console.log(`\n➡ Creating: ${u.email}`);

    // Step 1 — Create auth user (email auto-verified)
    const { data: newUser, error: signupError } =
      await supabase.auth.admin.createUser({
        email: u.email,
        password: "Test1234!",
        email_confirm: true, // AUTO VERIFY
      });

    if (signupError) {
      console.log("❌ Error:", signupError.message);
      continue;
    }

    const userId = newUser.user.id;

    // Step 2 — Fetch role id
    const { data: roleRow } = await supabase
      .from("roles")
      .select("id")
      .eq("role_code", u.role)
      .single();

    // Step 3 — Update profiles table
    await supabase
      .from("profiles")
      .update({
        full_name: u.name,
        role_id: roleRow.id,
        email_verified: true, // FORCE VERIFIED
      })
      .eq("id", userId);

    console.log(`✔ Created & verified → ${u.email} (${u.role})`);
  }

  console.log("\n🎉 DONE! All 11 users created & verified.");
}

createAllUsers();