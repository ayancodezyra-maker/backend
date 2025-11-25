/**
 * FULL TEST SCRIPT FOR STEP 8 — RATE LIMIT + DDOS PROTECTION
 */

import dotenv from "dotenv";
dotenv.config();

const BASE_URL = process.env.BASE_URL || "http://localhost:5000";
const API = `${BASE_URL}/api`;

console.log("\n============================================================");
console.log("🧪 STEP 8 — RATE LIMITING & DDOS PROTECTION TEST");
console.log("============================================================\n");

async function send(method, endpoint, body = null) {
  const options = {
    method,
    headers: { "Content-Type": "application/json" },
  };

  if (body) options.body = JSON.stringify(body);

  try {
    const res = await fetch(`${API}${endpoint}`, options);
    const json = await res.json().catch(() => null);

    return {
      status: res.status,
      success: json?.success,
      message: json?.message,
    };
  } catch (e) {
    return { status: 500, success: false, message: e.message };
  }
}

async function testGlobalRateLimit() {
  console.log("\n🌍 Test 1: GLOBAL RATE LIMIT (100 requests / 15 min)");

  let failTriggered = false;

  for (let i = 1; i <= 120; i++) {
    const r = await send("GET", "/auth/check");

    if (r.status === 429) {
      console.log(`   ⚠️  Limit triggered at request ${i}`);
      failTriggered = true;
      break;
    }
  }

  console.log(failTriggered ? "   ✅ Global limiter is working" : "   ❌ Failed — No rate limit detected");
}

async function testLoginRateLimit() {
  console.log("\n🔐 Test 2: LOGIN RATE LIMIT (10 requests/min)\n");

  let triggered = false;

  for (let i = 1; i <= 15; i++) {
    const r = await send("POST", "/auth/login", {
      email: "fake@example.com",
      password: "wrongpass",
    });

    console.log(`   Attempt ${i} → Status: ${r.status} Msg: ${r.message}`);

    if (r.status === 429) {
      triggered = true;
      break;
    }
  }

  console.log(triggered ? "   ✅ Login limiter is working" : "   ❌ Login limiter did NOT activate");
}

async function testResetRateLimit() {
  console.log("\n🔁 Test 3: RESET PASSWORD LIMIT (10/hour)");

  let triggered = false;

  for (let i = 1; i <= 12; i++) {
    const r = await send("POST", "/auth/reset-password", {
      token: "fake-token",
      password: "password123",
    });

    if (r.status === 429) {
      console.log(`   ⚠️  Limit triggered at reset attempt ${i}`);
      triggered = true;
      break;
    }
  }

  console.log(triggered ? "   ✅ Reset limiter is working" : "   ❌ Reset limiter FAILED");
}

async function testDDOSDetector() {
  console.log("\n🔥 Test 4: DDoS Burst Detection (>20 requests/second)");

  console.log("   Sending 25 ultra-fast requests...");

  const promises = [];

  for (let i = 0; i < 25; i++) {
    promises.push(send("GET", "/auth/check"));
  }

  const results = await Promise.all(promises);

  const ddosBlocked = results.some(r => r.status === 429 && r.message.includes("blocked due to suspicious"));

  console.log(ddosBlocked ? "   ✅ DDoS detector WORKING" : "   ❌ DDoS detector NOT triggered");
}

async function testBlockedIP() {
  console.log("\n🚫 Test 5: BLOCKED IP CHECK");

  console.log("   (Manual Step Required)");

  console.log(`
   STEP:
     1. Insert your local IP into blocked_ips table:
        
        INSERT INTO blocked_ips (ip, reason, blocked_until)
        VALUES ('::1', 'manual test', NOW() + INTERVAL '10 minutes');

     2. Re-run: node test-ddos-rate-limit.js

   Expected: ALL requests return 429 "Your IP is temporarily blocked"
  `);
}

async function runAll() {
  await testGlobalRateLimit();
  await testLoginRateLimit();
  await testResetRateLimit();
  await testDDOSDetector();
  await testBlockedIP();

  console.log("\n============================================================");
  console.log("✅ STEP 8 SECURITY TEST FINISHED");
  console.log("============================================================\n");
}

runAll();
