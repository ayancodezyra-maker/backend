/**
 * Test script for Multi-Device Session Management
 * 
 * This script tests:
 * 1. Login from 2 dummy devices (different user-agent strings)
 * 2. /auth/sessions must return 2 devices
 * 3. Delete one session → only 1 remains
 * 4. Admin request → see all sessions of any user
 */

import dotenv from "dotenv";
dotenv.config();

const BASE_URL = process.env.BASE_URL || "http://localhost:5000";
const API_BASE = `${BASE_URL}/api`;

// Test credentials (update these with actual test user)
const TEST_EMAIL = process.env.TEST_EMAIL || "test@example.com";
const TEST_PASSWORD = process.env.TEST_PASSWORD || "Test1234!";

// Admin credentials (update these with actual admin user)
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@example.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "Admin1234!";

// Different user agents to simulate different devices
const USER_AGENTS = {
  device1: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  device2: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
};

let userToken = null;
let adminToken = null;
let userId = null;
let sessions = [];

console.log("🧪 Starting Multi-Device Session Management Tests\n");
console.log(`Base URL: ${BASE_URL}\n`);

// Helper function to make API requests
async function apiRequest(method, endpoint, body = null, token = null, userAgent = null) {
  const headers = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  if (userAgent) {
    headers["User-Agent"] = userAgent;
  }

  const options = {
    method,
    headers,
  };

  if (body && (method === "POST" || method === "PUT")) {
    options.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, options);
    const data = await response.json();
    return { status: response.status, data };
  } catch (error) {
    console.error(`❌ Request failed: ${error.message}`);
    return { status: 500, data: { success: false, message: error.message } };
  }
}

// Test 1: Login from Device 1
async function testLoginDevice1() {
  console.log("📱 Test 1: Login from Device 1 (Windows Chrome)");
  const result = await apiRequest("POST", "/auth/login", {
    email: TEST_EMAIL,
    password: TEST_PASSWORD,
  }, null, USER_AGENTS.device1);

  if (result.status === 200 && result.data.success) {
    userToken = result.data.data.token;
    userId = result.data.data.user.id;
    console.log("✅ Device 1 login successful");
    console.log(`   Token: ${userToken.substring(0, 20)}...`);
    console.log(`   User ID: ${userId}\n`);
    return true;
  } else {
    console.log(`❌ Device 1 login failed: ${result.data.message}\n`);
    return false;
  }
}

// Test 2: Login from Device 2
async function testLoginDevice2() {
  console.log("📱 Test 2: Login from Device 2 (macOS Chrome)");
  const result = await apiRequest("POST", "/auth/login", {
    email: TEST_EMAIL,
    password: TEST_PASSWORD,
  }, null, USER_AGENTS.device2);

  if (result.status === 200 && result.data.success) {
    console.log("✅ Device 2 login successful");
    console.log(`   New Token: ${result.data.data.token.substring(0, 20)}...\n`);
    return true;
  } else {
    console.log(`❌ Device 2 login failed: ${result.data.message}\n`);
    return false;
  }
}

// Test 3: Get all sessions (should return 2 devices)
async function testGetSessions() {
  console.log("📋 Test 3: Get all sessions (should return 2 devices)");
  const result = await apiRequest("GET", "/auth/sessions", null, userToken);

  if (result.status === 200 && result.data.success) {
    sessions = result.data.data;
    console.log(`✅ Retrieved ${sessions.length} session(s)`);
    sessions.forEach((session, index) => {
      console.log(`   Session ${index + 1}:`);
      console.log(`     ID: ${session.id}`);
      console.log(`     Device: ${session.device}`);
      console.log(`     IP: ${session.ip_address}`);
      console.log(`     Login Time: ${session.login_time}`);
    });
    console.log();

    if (sessions.length >= 2) {
      console.log("✅ Test passed: Multiple devices detected\n");
      return true;
    } else {
      console.log(`⚠️  Warning: Expected 2+ sessions, got ${sessions.length}\n`);
      return false;
    }
  } else {
    console.log(`❌ Failed to get sessions: ${result.data.message}\n`);
    return false;
  }
}

// Test 4: Delete one session
async function testDeleteSession() {
  if (sessions.length === 0) {
    console.log("⚠️  Test 4 skipped: No sessions to delete\n");
    return false;
  }

  console.log("🗑️  Test 4: Delete one session");
  const sessionToDelete = sessions[0];
  console.log(`   Deleting session: ${sessionToDelete.id} (${sessionToDelete.device})`);

  const result = await apiRequest("DELETE", `/auth/sessions/${sessionToDelete.id}`, null, userToken);

  if (result.status === 200 && result.data.success) {
    console.log("✅ Session deleted successfully");

    // Verify deletion by getting sessions again
    const verifyResult = await apiRequest("GET", "/auth/sessions", null, userToken);
    if (verifyResult.status === 200 && verifyResult.data.success) {
      const remainingSessions = verifyResult.data.data;
      console.log(`   Remaining sessions: ${remainingSessions.length}`);
      if (remainingSessions.length === sessions.length - 1) {
        console.log("✅ Test passed: Session deleted correctly\n");
        sessions = remainingSessions;
        return true;
      } else {
        console.log(`⚠️  Warning: Expected ${sessions.length - 1} sessions, got ${remainingSessions.length}\n`);
        return false;
      }
    }
  } else {
    console.log(`❌ Failed to delete session: ${result.data.message}\n`);
    return false;
  }
}

// Test 5: Admin view all sessions of a user
async function testAdminGetSessions() {
  console.log("👨‍💼 Test 5: Admin view all sessions of a user");
  
  // First, login as admin
  const adminLoginResult = await apiRequest("POST", "/auth/login", {
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
  });

  if (adminLoginResult.status !== 200 || !adminLoginResult.data.success) {
    console.log(`⚠️  Admin login failed: ${adminLoginResult.data.message}`);
    console.log("   Skipping admin test (update ADMIN_EMAIL and ADMIN_PASSWORD in .env)\n");
    return false;
  }

  adminToken = adminLoginResult.data.data.token;
  console.log("✅ Admin login successful");

  // Get all sessions for the test user
  const result = await apiRequest("GET", `/admin/sessions/${userId}`, null, adminToken);

  if (result.status === 200 && result.data.success) {
    const userSessions = result.data.data;
    console.log(`✅ Retrieved ${userSessions.length} session(s) for user ${userId}`);
    userSessions.forEach((session, index) => {
      console.log(`   Session ${index + 1}:`);
      console.log(`     ID: ${session.id}`);
      console.log(`     Device: ${session.device}`);
      console.log(`     IP: ${session.ip_address}`);
      console.log(`     Active: ${session.is_active}`);
      console.log(`     Login Time: ${session.login_time}`);
    });
    console.log("✅ Test passed: Admin can view user sessions\n");
    return true;
  } else {
    console.log(`❌ Failed to get user sessions: ${result.data.message}\n`);
    return false;
  }
}

// Run all tests
async function runTests() {
  const results = {
    test1: await testLoginDevice1(),
    test2: await testLoginDevice2(),
    test3: await testGetSessions(),
    test4: await testDeleteSession(),
    test5: await testAdminGetSessions(),
  };

  console.log("\n" + "=".repeat(50));
  console.log("📊 Test Results Summary");
  console.log("=".repeat(50));
  console.log(`Test 1 (Login Device 1): ${results.test1 ? "✅ PASS" : "❌ FAIL"}`);
  console.log(`Test 2 (Login Device 2): ${results.test2 ? "✅ PASS" : "❌ FAIL"}`);
  console.log(`Test 3 (Get Sessions): ${results.test3 ? "✅ PASS" : "❌ FAIL"}`);
  console.log(`Test 4 (Delete Session): ${results.test4 ? "✅ PASS" : "❌ FAIL"}`);
  console.log(`Test 5 (Admin Get Sessions): ${results.test5 ? "✅ PASS" : "⚠️  SKIP"}`);
  console.log("=".repeat(50));

  const passed = Object.values(results).filter(r => r === true).length;
  const total = Object.keys(results).length;
  console.log(`\nTotal: ${passed}/${total} tests passed\n`);

  if (passed === total) {
    console.log("🎉 All tests passed!");
    process.exit(0);
  } else {
    console.log("⚠️  Some tests failed. Check the logs above.");
    process.exit(1);
  }
}

// Run tests
runTests().catch((error) => {
  console.error("❌ Test execution error:", error);
  process.exit(1);
});

