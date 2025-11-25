/**
 * COMPREHENSIVE API TEST SUITE (Hardened)
 * Tests all BidRoom Backend APIs automatically
 *
 * Usage: node tests/api-test-suite.js
 */

import https from 'https';
import http from 'http';
import fs from 'fs';
import path from 'path';

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:5000';
const API_BASE = `${BASE_URL}/api/v1`;

// Test results storage
const testResults = {
  passed: [],
  failed: [],
  skipped: [],
  total: 0,
};

// Detailed test report storage
const detailedReport = {
  timestamp: new Date().toISOString(),
  baseUrl: BASE_URL,
  apiBase: API_BASE,
  tests: [],
  summary: {
    total: 0,
    passed: 0,
    failed: 0,
    skipped: 0,
    successRate: 0,
  },
};

// Test users (update these with your actual test user credentials if different)
const TEST_USERS = {
  admin: { email: 'admin@bidroom.com', password: 'Test123!@#' },
  gc: { email: 'gc@bidroom.com', password: 'Test123!@#' },
  pm: { email: 'pm@bidroom.com', password: 'Test123!@#' },
  sub: { email: 'sub@bidroom.com', password: 'Test123!@#' },
  viewer: { email: 'viewer@bidroom.com', password: 'Test123!@#' },
};

// Tokens storage
const tokens = {};

// Test data storage (will be populated during tests)
const testData = {
  admin_id: null,
  gc_id: null,
  pm_id: null,
  sub_id: null,
  viewer_id: null,
  project_id: null,
  milestone_id: null,
  bid_id: null,
  job_id: null,
  payment_id: null,
  conversation_id: null,
  message_id: null,
  notification_id: null,
  review_id: null,
  dispute_id: null,
  contractor_id: null,
  application_id: null,
  payout_id: null,
  progress_update_id: null,
};

/**
 * HTTP Request Helper
 */
function makeRequest(method, url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === 'https:';
    const client = isHttps ? https : http;

    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      timeout: options.timeout || 15000,
    };

    const req = client.request(requestOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const parsed = data ? JSON.parse(data) : {};
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: parsed,
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: data,
          });
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    if (options.body) {
      try {
        req.write(JSON.stringify(options.body));
      } catch (err) {
        req.write(options.body);
      }
    }

    req.end();
  });
}

/**
 * Test Helper Functions
 */
function logTest(name, status, message = '', details = {}) {
  testResults.total++;
  const result = {
    name,
    status,
    message,
    timestamp: new Date().toISOString(),
    ...details,
  };

  detailedReport.tests.push({
    name,
    status,
    message,
    timestamp: result.timestamp,
    endpoint: details.endpoint || '',
    method: details.method || '',
    requestData: details.requestData || null,
    responseData: details.responseData || null,
    statusCode: details.statusCode || null,
    error: details.error || null,
  });

  if (status === 'PASS') {
    testResults.passed.push(result);
    console.log(`✅ PASS: ${name}`);
  } else if (status === 'FAIL') {
    testResults.failed.push(result);
    console.log(`❌ FAIL: ${name} - ${message}`);
  } else {
    testResults.skipped.push(result);
    console.log(`⏭️  SKIP: ${name} - ${message}`);
  }
}

/**
 * Try multiple endpoints sequentially until one returns success (2xx)
 * returns { success, response, usedPath }.
 */
async function attemptFallbacks(method, paths, options = {}) {
  for (const p of paths) {
    const url = options.useBaseUrl ? `${BASE_URL}${p}` : `${API_BASE}${p}`;
    try {
      const resp = await makeRequest(method, url, options);
      if (resp.status >= 200 && resp.status < 300) {
        return { success: true, response: resp, usedPath: p };
      }
      // if expected a failure and got >=400, return that as concrete failure
      if (options.acceptNon2xxAsResult) {
        return { success: false, response: resp, usedPath: p };
      }
    } catch (err) {
      // continue to next fallback
    }
  }
  return { success: false, response: null, usedPath: null };
}

/**
 * Generic testEndpoint improved:
 * - accept2xx: treat any 2xx as success
 * - fallbackPaths: optional array of paths to try sequentially (full path part after base)
 */
async function testEndpoint(name, method, path, options = {}) {
  try {
    const requestPaths = options.fallbackPaths ? options.fallbackPaths : [path];
    const usedBase = options.useBaseUrl || false;

    // If fallbackPaths provided, attempt them
    let attemptResult;
    if (requestPaths.length > 1) {
      attemptResult = await attemptFallbacks(method, requestPaths, {
        ...options,
        useBaseUrl: usedBase,
      });
    } else {
      const url = (usedBase ? BASE_URL : API_BASE) + requestPaths[0];
      attemptResult = { success: false };
      try {
        const response = await makeRequest(method, url, options);
        attemptResult = { success: true, response, usedPath: requestPaths[0] };
      } catch (err) {
        attemptResult = { success: false, error: err, usedPath: requestPaths[0] };
      }
    }

    if (!attemptResult || attemptResult.success === false) {
      const resp = attemptResult.response;
      if (resp) {
        logTest(
          name,
          'FAIL',
          `No success; last status: ${resp.status}`,
          {
            endpoint: requestPaths.join(' | '),
            method,
            requestData: options.body || null,
            responseData: resp.data || null,
            statusCode: resp.status,
          }
        );
        return { success: false, response: resp };
      } else {
        logTest(name, 'FAIL', `Request error or no response`, {
          endpoint: requestPaths.join(' | '),
          method,
          requestData: options.body || null,
          error: attemptResult.error || null,
        });
        return { success: false, error: attemptResult.error || null };
      }
    }

    const response = attemptResult.response;
    const expectedStatus = options.expectedStatus || 200;
    const accept2xx = options.accept2xx !== undefined ? options.accept2xx : true;

    // Normalize response data for logs
    let responseData = response.data;
    if (typeof responseData === 'object') {
      try {
        responseData = JSON.parse(JSON.stringify(responseData));
      } catch (e) {}
    }

    if (accept2xx && response.status >= 200 && response.status < 300) {
      logTest(name, 'PASS', '', {
        endpoint: attemptResult.usedPath,
        method,
        requestData: options.body || null,
        responseData,
        statusCode: response.status,
      });
      return { success: true, response };
    }

    // If expectedStatus explicitly specified and matches
    if (!accept2xx && response.status === expectedStatus) {
      logTest(name, 'PASS', '', {
        endpoint: attemptResult.usedPath,
        method,
        requestData: options.body || null,
        responseData,
        statusCode: response.status,
      });
      return { success: true, response };
    }

    // If expectedStatus provided and matches (even if not accept2xx)
    if (Array.isArray(expectedStatus) ? expectedStatus.includes(response.status) : response.status === expectedStatus) {
      logTest(name, 'PASS', '', {
        endpoint: attemptResult.usedPath,
        method,
        requestData: options.body || null,
        responseData,
        statusCode: response.status,
      });
      return { success: true, response };
    }

    // Otherwise FAIL
    logTest(name, 'FAIL', `Expected ${expectedStatus} or 2xx, got ${response.status}`, {
      endpoint: attemptResult.usedPath,
      method,
      requestData: options.body || null,
      responseData,
      statusCode: response.status,
    });
    return { success: false, response };
  } catch (error) {
    logTest(name, 'FAIL', error.message, {
      endpoint: path,
      method,
      requestData: options.body || null,
      error: {
        message: error.message,
        stack: error.stack,
      },
    });
    return { success: false, error };
  }
}

/**
 * Authentication Tests
 */
async function testAuthentication() {
  console.log('\n🔐 TESTING AUTHENTICATION APIs...\n');

  // Login as Admin
  const adminLogin = await testEndpoint('Login as Admin', 'POST', '/auth/login', {
    body: TEST_USERS.admin,
    expectedStatus: 200,
    accept2xx: true,
  });
  if (adminLogin.success && adminLogin.response?.data?.data?.token) {
    tokens.admin = adminLogin.response.data.data.token;
    testData.admin_id = adminLogin.response.data.data.user?.id;
  }

  // Login as GC
  const gcLogin = await testEndpoint('Login as GC', 'POST', '/auth/login', {
    body: TEST_USERS.gc,
    expectedStatus: 200,
    accept2xx: true,
  });
  if (gcLogin.success && gcLogin.response?.data?.data?.token) {
    tokens.gc = gcLogin.response.data.data.token;
    testData.gc_id = gcLogin.response.data.data.user?.id;
  }

  // Login as PM
  const pmLogin = await testEndpoint('Login as PM', 'POST', '/auth/login', {
    body: TEST_USERS.pm,
    expectedStatus: 200,
    accept2xx: true,
  });
  if (pmLogin.success && pmLogin.response?.data?.data?.token) {
    tokens.pm = pmLogin.response.data.data.token;
    testData.pm_id = pmLogin.response.data.data.user?.id;
  }

  // Login as SUB
  const subLogin = await testEndpoint('Login as SUB', 'POST', '/auth/login', {
    body: TEST_USERS.sub,
    expectedStatus: 200,
    accept2xx: true,
  });
  if (subLogin.success && subLogin.response?.data?.data?.token) {
    tokens.sub = subLogin.response.data.data.token;
    testData.sub_id = subLogin.response.data.data.user?.id;
  }

  // Get Current User (try fallbacks)
  if (tokens.admin) {
    await testEndpoint('Get Current User (Me)', 'GET', '/auth/me', {
      headers: { Authorization: `Bearer ${tokens.admin}` },
      fallbackPaths: ['/auth/me', '/users/me', '/auth/profile', '/me'],
      expectedStatus: 200,
      accept2xx: true,
    });
  }

  // Update Profile (try /auth/update-profile or /users/update)
  if (tokens.admin) {
    await testEndpoint('Update Profile', 'PUT', '/auth/update-profile', {
      headers: { Authorization: `Bearer ${tokens.admin}` },
      fallbackPaths: ['/auth/update-profile', '/users/update', '/auth/profile'],
      body: {
        full_name: 'Updated Admin Name',
      },
      expectedStatus: 200,
      accept2xx: true,
    });
  }

  // Change Password (POST)
  if (tokens.admin) {
    await testEndpoint('Change Password (POST)', 'POST', '/auth/change-password', {
      headers: { Authorization: `Bearer ${tokens.admin}` },
      body: {
        current_password: 'Test123!@#',
        new_password: 'Test123!@#',
      },
      expectedStatus: 200,
      accept2xx: true,
    });
  }

  // Get Sessions
  if (tokens.admin) {
    await testEndpoint('Get User Sessions', 'GET', '/auth/sessions', {
      headers: { Authorization: `Bearer ${tokens.admin}` },
      expectedStatus: 200,
      accept2xx: true,
    });
  }

  // Signup (expect 201 or 200)
  await testEndpoint('Signup New User', 'POST', '/auth/signup', {
    body: {
      email: `test${Date.now()}@bidroom.com`,
      password: 'Test123!@#',
      full_name: 'Test User',
      role_code: 'VIEWER',
    },
    expectedStatus: [200, 201],
    accept2xx: true,
  });

  // Forgot Password
  await testEndpoint('Forgot Password', 'POST', '/auth/forgot-password', {
    body: {
      email: 'admin@bidroom.com',
    },
    expectedStatus: 200,
    accept2xx: true,
  });

  // Resend Verification
  if (tokens.admin) {
    await testEndpoint('Resend Verification Email', 'POST', '/auth/resend-verification', {
      headers: { Authorization: `Bearer ${tokens.admin}` },
      body: {
        email: 'admin@bidroom.com',
      },
      expectedStatus: 200,
      accept2xx: true,
    });
  }

  // Health Check (try /api/health and /health)
  await testEndpoint('Health Check', 'GET', '/api/health', {
    fallbackPaths: ['/api/health', '/health', '/status'],
    useBaseUrl: true,
    expectedStatus: 200,
    accept2xx: true,
  });
}

/**
 * Projects Tests
 */
async function testProjects() {
  console.log('\n📁 TESTING PROJECTS APIs...\n');

  if (!tokens.admin) {
    logTest('Projects Tests', 'SKIP', 'Admin token not available');
    return;
  }

  // Create Project - use 'budget' field (matches schema)
  const createProject = await testEndpoint('Create Project', 'POST', '/projects', {
    headers: { Authorization: `Bearer ${tokens.admin}` },
    body: {
      title: 'Test Project - API Testing',
      description: 'Project created by automated test suite',
      owner_id: testData.admin_id || null,
      contractor_id: testData.gc_id || null,
      budget: 50000,
      status: 'open',
    },
    expectedStatus: [200, 201],
    accept2xx: true,
  });
  if (createProject.success && createProject.response?.data?.data?.id) {
    testData.project_id = createProject.response.data.data.id;
  }

  // Get All Projects
  await testEndpoint('Get All Projects', 'GET', '/projects', {
    headers: { Authorization: `Bearer ${tokens.admin}` },
    expectedStatus: 200,
    accept2xx: true,
  });

  // If project exists, CRUD
  if (testData.project_id) {
    await testEndpoint('Get Project by ID', 'GET', `/projects/${testData.project_id}`, {
      headers: { Authorization: `Bearer ${tokens.admin}` },
      expectedStatus: 200,
      accept2xx: true,
    });

    await testEndpoint('Update Project', 'PUT', `/projects/${testData.project_id}`, {
      headers: { Authorization: `Bearer ${tokens.admin}` },
      body: {
        title: 'Updated Test Project',
        status: 'in_progress',
      },
      expectedStatus: [200, 201],
      accept2xx: true,
    });

    await testEndpoint('Delete Project', 'DELETE', `/projects/${testData.project_id}`, {
      headers: { Authorization: `Bearer ${tokens.admin}` },
      expectedStatus: 200,
      accept2xx: true,
    });
  }
}

/**
 * Milestones Tests
 */
async function testMilestones() {
  console.log('\n🎯 TESTING MILESTONES APIs...\n');

  if (!tokens.admin || !testData.project_id) {
    logTest('Milestones Tests', 'SKIP', 'Admin token or project_id not available');
    return;
  }

  const createMilestone = await testEndpoint('Create Milestone', 'POST', `/milestones/projects/${testData.project_id}`, {
    headers: { Authorization: `Bearer ${tokens.admin}` },
    body: {
      title: 'Foundation Complete',
      description: 'Foundation milestone',
      due_date: '2024-12-31',
      payment_amount: 15000,
      order_number: 1,
    },
    expectedStatus: [200, 201],
    accept2xx: true,
  });
  if (createMilestone.success && createMilestone.response?.data?.data?.id) {
    testData.milestone_id = createMilestone.response.data.data.id;
  }

  await testEndpoint('Get Project Milestones', 'GET', `/milestones/projects/${testData.project_id}`, {
    headers: { Authorization: `Bearer ${tokens.admin}` },
    expectedStatus: 200,
    accept2xx: true,
  });

  if (testData.milestone_id) {
    await testEndpoint('Update Milestone', 'PUT', `/milestones/${testData.milestone_id}`, {
      headers: { Authorization: `Bearer ${tokens.admin}` },
      body: { status: 'not_started' },
      expectedStatus: [200, 201],
      accept2xx: true,
    });

    await testEndpoint('Submit Milestone', 'POST', `/milestones/${testData.milestone_id}/submit`, {
      headers: { Authorization: `Bearer ${tokens.gc}` },
      expectedStatus: [200, 201],
      accept2xx: true,
    });

    await testEndpoint('Approve Milestone', 'POST', `/milestones/${testData.milestone_id}/approve`, {
      headers: { Authorization: `Bearer ${tokens.admin}` },
      expectedStatus: [200, 201],
      accept2xx: true,
    });
  }
}

/**
 * Bids Tests
 */
async function testBids() {
  console.log('\n💰 TESTING BIDS APIs...\n');

  if (!tokens.gc || !testData.project_id) {
    logTest('Bids Tests', 'SKIP', 'GC token or project_id not available');
    return;
  }

  const createBid = await testEndpoint('Create Bid', 'POST', '/bids', {
    headers: { Authorization: `Bearer ${tokens.gc}` },
    body: {
      project_id: testData.project_id,
      amount: 48000,
      notes: 'Test bid from automated test',
    },
    expectedStatus: [200, 201],
    accept2xx: true,
  });
  if (createBid.success && createBid.response?.data?.data?.id) {
    testData.bid_id = createBid.response.data.data.id;
  }

  await testEndpoint('Get All Bids', 'GET', '/bids', {
    headers: { Authorization: `Bearer ${tokens.gc}` },
    expectedStatus: 200,
    accept2xx: true,
  });

  if (testData.bid_id) {
    await testEndpoint('Get Bid by ID', 'GET', `/bids/${testData.bid_id}`, {
      headers: { Authorization: `Bearer ${tokens.gc}` },
      expectedStatus: 200,
      accept2xx: true,
    });

    await testEndpoint('Update Bid', 'PUT', `/bids/${testData.bid_id}`, {
      headers: { Authorization: `Bearer ${tokens.gc}` },
      body: { amount: 50000 },
      expectedStatus: [200, 201],
      accept2xx: true,
    });

    await testEndpoint('Submit Bid Submission', 'POST', `/bids/${testData.bid_id}/submit`, {
      headers: { Authorization: `Bearer ${tokens.sub}` },
      body: {
        amount: 45000,
        timeline_days: 60,
        proposal: 'Test proposal',
      },
      expectedStatus: [200, 201],
      accept2xx: true,
    });

    await testEndpoint('Get Bid Submissions', 'GET', `/bids/${testData.bid_id}/submissions`, {
      headers: { Authorization: `Bearer ${tokens.gc}` },
      expectedStatus: 200,
      accept2xx: true,
    });
  }

  if (tokens.sub) {
    await testEndpoint('Get My Bid Submissions', 'GET', '/bids/submissions/my', {
      headers: { Authorization: `Bearer ${tokens.sub}` },
      expectedStatus: 200,
      accept2xx: true,
    });
  }
}

/**
 * Jobs Tests
 */
async function testJobs() {
  console.log('\n💼 TESTING JOBS APIs...\n');

  if (!tokens.pm) {
    logTest('Jobs Tests', 'SKIP', 'PM token not available');
    return;
  }

  const createJob = await testEndpoint('Create Job', 'POST', '/jobs', {
    headers: { Authorization: `Bearer ${tokens.pm}` },
    body: {
      title: 'Electrician Needed - Test',
      description: 'Need licensed electrician for test project',
      location: 'Los Angeles, CA',
      trade_type: 'Electrical',
      specialization: 'Commercial',
      budget_min: 5000,
      budget_max: 15000,
      project_manager_id: testData.pm_id || null,
    },
    expectedStatus: [200, 201],
    accept2xx: true,
  });
  if (createJob.success && createJob.response?.data?.data?.id) {
    testData.job_id = createJob.response.data.data.id;
  }

  await testEndpoint('Get All Jobs', 'GET', '/jobs', {
    headers: { Authorization: `Bearer ${tokens.pm}` },
    expectedStatus: 200,
    accept2xx: true,
  });

  if (testData.job_id) {
    await testEndpoint('Get Job by ID', 'GET', `/jobs/${testData.job_id}`, {
      headers: { Authorization: `Bearer ${tokens.pm}` },
      expectedStatus: 200,
      accept2xx: true,
    });

    await testEndpoint('Update Job', 'PUT', `/jobs/${testData.job_id}`, {
      headers: { Authorization: `Bearer ${tokens.pm}` },
      body: { status: 'open' },
      expectedStatus: [200, 201],
      accept2xx: true,
    });
  }
}

/**
 * Payments, Payouts, Contractors, Conversations, Messages, Notifications...
 * We'll follow same pattern: accept 2xx and use fallback paths where necessary
 */

async function testPayments() {
  console.log('\n💳 TESTING PAYMENTS APIs...\n');
  if (!tokens.admin || !testData.milestone_id || !testData.admin_id || !testData.gc_id) {
    logTest('Payments Tests', 'SKIP', 'Required data not available');
    return;
  }

  const createPayment = await testEndpoint('Create Payment', 'POST', '/payments', {
    headers: { Authorization: `Bearer ${tokens.admin}` },
    body: {
      milestone_id: testData.milestone_id,
      amount: 15000,
      released_by: testData.admin_id,
      released_to: testData.gc_id,
      status: 'escrow',
    },
    expectedStatus: [200, 201],
    accept2xx: true,
  });
  if (createPayment.success && createPayment.response?.data?.data?.id) {
    testData.payment_id = createPayment.response.data.data.id;
  }

  await testEndpoint('Get All Payments', 'GET', '/payments', {
    headers: { Authorization: `Bearer ${tokens.admin}` },
    expectedStatus: 200,
    accept2xx: true,
  });

  if (testData.payment_id) {
    await testEndpoint('Get Payment by ID', 'GET', `/payments/${testData.payment_id}`, {
      headers: { Authorization: `Bearer ${tokens.admin}` },
      expectedStatus: 200,
      accept2xx: true,
    });

    await testEndpoint('Update Payment', 'PUT', `/payments/${testData.payment_id}`, {
      headers: { Authorization: `Bearer ${tokens.admin}` },
      body: { status: 'released' },
      expectedStatus: [200, 201],
      accept2xx: true,
    });
  }
}

async function testPayouts() {
  console.log('\n💵 TESTING PAYOUTS APIs...\n');
  if (!tokens.admin || !testData.payment_id || !testData.gc_id) {
    logTest('Payouts Tests', 'SKIP', 'Required data not available');
    return;
  }

  const createPayout = await testEndpoint('Create Payout', 'POST', '/payouts', {
    headers: { Authorization: `Bearer ${tokens.admin}` },
    body: {
      contractor_id: testData.gc_id,
      project_id: testData.project_id,
      amount: 15000,
      payment_id: testData.payment_id,
    },
    expectedStatus: [200, 201],
    accept2xx: true,
  });
  if (createPayout.success && createPayout.response?.data?.data?.id) {
    testData.payout_id = createPayout.response.data.data.id;
  }

  await testEndpoint('Get All Payouts', 'GET', '/payouts', {
    headers: { Authorization: `Bearer ${tokens.admin}` },
    expectedStatus: 200,
    accept2xx: true,
  });

  if (testData.payout_id) {
    await testEndpoint('Get Payout by ID', 'GET', `/payouts/${testData.payout_id}`, {
      headers: { Authorization: `Bearer ${tokens.admin}` },
      expectedStatus: 200,
      accept2xx: true,
    });

    await testEndpoint('Update Payout Status', 'PUT', `/payouts/${testData.payout_id}/status`, {
      headers: { Authorization: `Bearer ${tokens.admin}` },
      body: { status: 'completed' },
      expectedStatus: [200, 201],
      accept2xx: true,
    });
  }
}

async function testContractors() {
  console.log('\n👷 TESTING CONTRACTORS APIs...\n');

  if (!tokens.admin) {
    logTest('Contractors Tests', 'SKIP', 'Admin token not available');
    return;
  }

  await testEndpoint('Get All Contractors', 'GET', '/contractors', {
    headers: { Authorization: `Bearer ${tokens.admin}` },
    expectedStatus: 200,
    accept2xx: true,
  });

  await testEndpoint('Search Contractors', 'GET', '/contractors/search?trade=Electrical', {
    headers: { Authorization: `Bearer ${tokens.admin}` },
    expectedStatus: 200,
    accept2xx: true,
  });

  if (testData.gc_id) {
    await testEndpoint('Get Contractor by ID', 'GET', `/contractors/${testData.gc_id}`, {
      headers: { Authorization: `Bearer ${tokens.admin}` },
      expectedStatus: 200,
      accept2xx: true,
    });

    await testEndpoint('Update Contractor', 'PUT', `/contractors/${testData.gc_id}`, {
      headers: { Authorization: `Bearer ${tokens.gc}` },
      body: { full_name: 'Updated GC Name' },
      expectedStatus: [200, 201],
      accept2xx: true,
    });

    await testEndpoint('Get Contractor Profile', 'GET', `/contractors/profiles/${testData.gc_id}`, {
      headers: { Authorization: `Bearer ${tokens.admin}` },
      expectedStatus: 200,
      accept2xx: true,
    });

    await testEndpoint('Upsert Contractor Profile', 'POST', '/contractors/profiles', {
      headers: { Authorization: `Bearer ${tokens.gc}` },
      body: {
        user_id: testData.gc_id,
        bio: 'Experienced contractor',
        license_number: 'LIC123456',
      },
      expectedStatus: [200, 201],
      accept2xx: true,
    });

    await testEndpoint('Update Verification Status', 'PUT', `/contractors/profiles/${testData.gc_id}/verify`, {
      headers: { Authorization: `Bearer ${tokens.admin}` },
      body: {
        license_verified: true,
      },
      expectedStatus: [200, 201],
      accept2xx: true,
    });
  }
}

async function testConversations() {
  console.log('\n💬 TESTING CONVERSATIONS APIs...\n');

  if (!tokens.admin || !testData.project_id) {
    logTest('Conversations Tests', 'SKIP', 'Required data not available');
    return;
  }

  const createConv = await testEndpoint('Create Conversation', 'POST', '/conversations', {
    headers: { Authorization: `Bearer ${tokens.admin}` },
    body: {
      subject: 'Test Conversation',
      project_id: testData.project_id,
      participants: [],
    },
    expectedStatus: [200, 201],
    accept2xx: true,
  });
  if (createConv.success && createConv.response?.data?.data?.id) {
    testData.conversation_id = createConv.response.data.data.id;
  }

  await testEndpoint('Get User Conversations', 'GET', '/conversations', {
    headers: { Authorization: `Bearer ${tokens.admin}` },
    expectedStatus: 200,
    accept2xx: true,
  });

  if (testData.conversation_id) {
    await testEndpoint('Get Conversation by ID', 'GET', `/conversations/${testData.conversation_id}`, {
      headers: { Authorization: `Bearer ${tokens.admin}` },
      expectedStatus: 200,
      accept2xx: true,
    });
  }
}

async function testMessages() {
  console.log('\n📨 TESTING MESSAGES APIs...\n');

  if (!tokens.admin || !testData.conversation_id || !testData.gc_id) {
    logTest('Messages Tests', 'SKIP', 'Required data not available');
    return;
  }

  const sendMessage = await testEndpoint('Send Message', 'POST', '/messages', {
    headers: { Authorization: `Bearer ${tokens.admin}` },
    body: {
      conversation_id: testData.conversation_id,
      message: 'Test message from automated test suite',
      receiver_id: testData.gc_id,
    },
    expectedStatus: [200, 201],
    accept2xx: true,
  });
  if (sendMessage.success && sendMessage.response?.data?.data?.id) {
    testData.message_id = sendMessage.response.data.data.id;
  }

  await testEndpoint('Get Conversation Messages', 'GET', `/messages/conversations/${testData.conversation_id}`, {
    headers: { Authorization: `Bearer ${tokens.admin}` },
    expectedStatus: 200,
    accept2xx: true,
  });

  if (testData.conversation_id) {
    await testEndpoint('Mark Messages as Read', 'PUT', `/messages/conversations/${testData.conversation_id}/read`, {
      headers: { Authorization: `Bearer ${tokens.admin}` },
      expectedStatus: [200, 201],
      accept2xx: true,
    });
  }

  await testEndpoint('Get Unread Count', 'GET', '/messages/unread/count', {
    headers: { Authorization: `Bearer ${tokens.admin}` },
    expectedStatus: 200,
    accept2xx: true,
  });
}

/**
 * Notifications: try both payload variants (message vs body)
 */
async function testNotifications() {
  console.log('\n🔔 TESTING NOTIFICATIONS APIs...\n');

  if (!tokens.admin || !testData.gc_id) {
    logTest('Notifications Tests', 'SKIP', 'Required data not available');
    return;
  }

  // Try payload variant 1 (message)
  const payloadVariants = [
    {
      user_id: testData.gc_id,
      type: 'info',
      title: 'Test Notification - message',
      message: 'This is a test notification (message)',
    },
    {
      user_id: testData.gc_id,
      type: 'info',
      title: 'Test Notification - body',
      body: 'This is a test notification (body)',
    },
  ];

  let created = false;
  for (const payload of payloadVariants) {
    const createNotif = await testEndpoint('Create Notification (try variant)', 'POST', '/notifications', {
      headers: { Authorization: `Bearer ${tokens.admin}` },
      body: payload,
      expectedStatus: [200, 201],
      accept2xx: true,
    });
    if (createNotif.success && createNotif.response?.data?.data?.id) {
      testData.notification_id = createNotif.response.data.data.id;
      created = true;
      break;
    }
  }
  if (!created) {
    logTest('Create Notification', 'FAIL', 'All payload variants failed', {});
  }

  // Get User Notifications
  await testEndpoint('Get User Notifications', 'GET', '/notifications', {
    headers: { Authorization: `Bearer ${tokens.gc}` },
    expectedStatus: 200,
    accept2xx: true,
  });

  // Mark as Read
  if (testData.notification_id) {
    await testEndpoint('Mark Notification as Read', 'PUT', `/notifications/${testData.notification_id}/read`, {
      headers: { Authorization: `Bearer ${tokens.gc}` },
      expectedStatus: [200, 201],
      accept2xx: true,
    });

    await testEndpoint('Delete Notification', 'DELETE', `/notifications/${testData.notification_id}`, {
      headers: { Authorization: `Bearer ${tokens.gc}` },
      expectedStatus: [200, 201],
      accept2xx: true,
    });
  }

  await testEndpoint('Mark All Notifications as Read', 'PUT', '/notifications/read/all', {
    headers: { Authorization: `Bearer ${tokens.gc}` },
    expectedStatus: [200, 201],
    accept2xx: true,
  });

  await testEndpoint('Get Unread Notification Count', 'GET', '/notifications/unread/count', {
    headers: { Authorization: `Bearer ${tokens.gc}` },
    expectedStatus: 200,
    accept2xx: true,
  });
}

/**
 * Progress Updates, Reviews, Disputes
 */
async function testProgressUpdates() {
  console.log('\n📊 TESTING PROGRESS UPDATES APIs...\n');
  if (!tokens.gc || !testData.project_id) {
    logTest('Progress Updates Tests', 'SKIP', 'Required data not available');
    return;
  }

  await testEndpoint('Create Progress Update', 'POST', '/progress-updates', {
    headers: { Authorization: `Bearer ${tokens.gc}` },
    body: {
      project_id: testData.project_id,
      work_completed: 'Completed foundation work',
      work_planned: 'Start framing next week',
      hours_worked: 8.5,
      crew_members: 3,
    },
    expectedStatus: [200, 201],
    accept2xx: true,
  });

  await testEndpoint('Get Project Progress Updates', 'GET', `/progress-updates/projects/${testData.project_id}`, {
    headers: { Authorization: `Bearer ${tokens.gc}` },
    expectedStatus: 200,
    accept2xx: true,
  });
}

async function testReviews() {
  console.log('\n⭐ TESTING REVIEWS APIs...\n');
  if (!tokens.admin || !testData.project_id || !testData.gc_id) {
    logTest('Reviews Tests', 'SKIP', 'Required data not available');
    return;
  }

  const createReview = await testEndpoint('Create Review', 'POST', '/reviews', {
    headers: { Authorization: `Bearer ${tokens.admin}` },
    body: {
      project_id: testData.project_id,
      reviewee_id: testData.gc_id,
      rating_overall: 5,
      rating_quality: 5,
      rating_communication: 4,
      title: 'Excellent work!',
      body: 'Very professional and completed on time',
    },
    expectedStatus: [200, 201],
    accept2xx: true,
  });
  if (createReview.success && createReview.response?.data?.data?.id) {
    testData.review_id = createReview.response.data.data.id;
  }

  await testEndpoint('Get Contractor Reviews', 'GET', `/reviews/contractors/${testData.gc_id}`, {
    headers: { Authorization: `Bearer ${tokens.admin}` },
    expectedStatus: 200,
    accept2xx: true,
  });
}

/**
 * Disputes
 */
async function testDisputes() {
  console.log('\n⚖️ TESTING DISPUTES APIs...\n');
  if (!tokens.admin || !testData.project_id) {
    logTest('Disputes Tests', 'SKIP', 'Required data not available');
    return;
  }

  const fileDispute = await testEndpoint('File Dispute', 'POST', '/disputes', {
    headers: { Authorization: `Bearer ${tokens.admin}` },
    body: {
      project_id: testData.project_id,
      reason: 'Work quality issues - test dispute',
    },
    expectedStatus: [200, 201],
    accept2xx: true,
  });
  if (fileDispute.success && fileDispute.response?.data?.data?.id) {
    testData.dispute_id = fileDispute.response.data.data.id;
  }

  await testEndpoint('Get Project Disputes', 'GET', `/disputes/projects/${testData.project_id}`, {
    headers: { Authorization: `Bearer ${tokens.admin}` },
    expectedStatus: 200,
    accept2xx: true,
  });
}

/**
 * Admin Tests (fallbacks for change-role, suspend/unsuspend)
 */
async function testAdmin() {
  console.log('\n👑 TESTING ADMIN APIs...\n');

  if (!tokens.admin) {
    logTest('Admin Tests', 'SKIP', 'Admin token not available');
    return;
  }

  await testEndpoint('List All Users', 'GET', '/admin/all-users', {
    headers: { Authorization: `Bearer ${tokens.admin}` },
    expectedStatus: 200,
    accept2xx: true,
  });

  await testEndpoint('Get Login Logs', 'GET', '/admin/login-logs', {
    headers: { Authorization: `Bearer ${tokens.admin}` },
    expectedStatus: 200,
    accept2xx: true,
  });

  await testEndpoint('Get Login Stats', 'GET', '/admin/login-stats', {
    headers: { Authorization: `Bearer ${tokens.admin}` },
    expectedStatus: 200,
    accept2xx: true,
  });

  // Change User Role - try fallback endpoints
  if (testData.sub_id) {
    await testEndpoint('Change User Role', 'PUT', '/admin/update-role', {
      headers: { Authorization: `Bearer ${tokens.admin}` },
      fallbackPaths: ['/admin/update-role', '/admin/change-role', '/admin/users/change-role'],
      body: {
        user_id: testData.sub_id,
        role_code: 'VIEWER',
      },
      expectedStatus: [200, 201],
      accept2xx: true,
    });
  }

  if (testData.sub_id) {
    await testEndpoint('Get User Sessions (admin)', 'GET', `/admin/sessions/${testData.sub_id}`, {
      headers: { Authorization: `Bearer ${tokens.admin}` },
      expectedStatus: 200,
      accept2xx: true,
    });
  }

  if (testData.sub_id) {
    await testEndpoint('Verify User', 'POST', '/admin/verify-user', {
      headers: { Authorization: `Bearer ${tokens.admin}` },
      body: { user_id: testData.sub_id },
      expectedStatus: [200, 201],
      accept2xx: true,
    });
  }

  // Suspend / Unsuspend user - try fallback paths
  if (testData.sub_id) {
    await testEndpoint('Suspend User', 'PUT', `/admin/users/${testData.sub_id}/suspend`, {
      headers: { Authorization: `Bearer ${tokens.admin}` },
      fallbackPaths: [
        `/admin/users/${testData.sub_id}/suspend`,
        `/admin/suspend/${testData.sub_id}`,
        `/admin/users/suspend/${testData.sub_id}`,
      ],
      expectedStatus: [200, 204],
      accept2xx: true,
    });

    await testEndpoint('Unsuspend User', 'PUT', `/admin/users/${testData.sub_id}/unsuspend`, {
      headers: { Authorization: `Bearer ${tokens.admin}` },
      fallbackPaths: [
        `/admin/users/${testData.sub_id}/unsuspend`,
        `/admin/unsuspend/${testData.sub_id}`,
        `/admin/users/unsuspend/${testData.sub_id}`,
      ],
      expectedStatus: [200, 204],
      accept2xx: true,
    });
  }
}

/**
 * User Routes Tests
 */
async function testUserRoutes() {
  console.log('\n👤 TESTING USER APIs...\n');

  if (!tokens.admin) {
    logTest('User Routes Tests', 'SKIP', 'Admin token not available');
    return;
  }

  // Get User Profile (try fallbacks)
  await testEndpoint('Get User Profile', 'GET', '/users/me', {
    headers: { Authorization: `Bearer ${tokens.admin}` },
    fallbackPaths: ['/users/me', '/auth/me', '/auth/profile', '/me'],
    expectedStatus: 200,
    accept2xx: true,
  });

  await testEndpoint('Update User Profile', 'PUT', '/users/update', {
    headers: { Authorization: `Bearer ${tokens.admin}` },
    fallbackPaths: ['/users/update', '/auth/update-profile', '/profiles/update'],
    body: {
      full_name: 'Updated Name',
    },
    expectedStatus: [200, 201],
    accept2xx: true,
  });
}

/**
 * Permission Tests
 */
async function testPermissions() {
  console.log('\n🔒 TESTING PERMISSIONS...\n');

  if (tokens.sub) {
    await testEndpoint('SUB cannot create bid (Permission Test)', 'POST', '/bids', {
      headers: { Authorization: `Bearer ${tokens.sub}` },
      body: {
        project_id: testData.project_id,
        amount: 10000,
      },
      shouldFail: true,
      // we expect failure; accept any 4xx/5xx as pass for this check
      accept2xx: false,
      expectedStatus: 403,
    });
  }

  if (tokens.sub) {
    await testEndpoint('SUB cannot create job (Permission Test)', 'POST', '/jobs', {
      headers: { Authorization: `Bearer ${tokens.sub}` },
      body: {
        title: 'Test Job',
        description: 'Test',
        location: 'Test',
        trade_type: 'Electrical',
      },
      shouldFail: true,
      accept2xx: false,
      expectedStatus: 403,
    });
  }

  if (tokens.viewer) {
    await testEndpoint('VIEWER cannot create project (Permission Test)', 'POST', '/projects', {
      headers: { Authorization: `Bearer ${tokens.viewer}` },
      body: { title: 'Test Project' },
      shouldFail: true,
      accept2xx: false,
      expectedStatus: 403,
    });
  }
}

/**
 * Generate Detailed Report
 */
async function generateDetailedReport() {
  // Update summary
  detailedReport.summary = {
    total: testResults.total,
    passed: testResults.passed.length,
    failed: testResults.failed.length,
    skipped: testResults.skipped.length,
    successRate: testResults.total > 0 ? ((testResults.passed.length / testResults.total) * 100).toFixed(2) : '0.00',
  };

  // Build markdown
  let reportContent = `# 📊 API TEST REPORT\n\n`;
  reportContent += `**Generated:** ${new Date(detailedReport.timestamp).toLocaleString()}\n`;
  reportContent += `**Base URL:** ${detailedReport.baseUrl}\n`;
  reportContent += `**API Base:** ${detailedReport.apiBase}\n\n`;
  reportContent += `---\n\n`;
  reportContent += `## 📈 SUMMARY\n\n`;
  reportContent += `| Metric | Count |\n`;
  reportContent += `|--------|-------|\n`;
  reportContent += `| Total Tests | ${detailedReport.summary.total} |\n`;
  reportContent += `| ✅ Passed | ${detailedReport.summary.passed} |\n`;
  reportContent += `| ❌ Failed | ${detailedReport.summary.failed} |\n`;
  reportContent += `| ⏭️ Skipped | ${detailedReport.summary.skipped} |\n`;
  reportContent += `| Success Rate | ${detailedReport.summary.successRate}% |\n\n`;

  reportContent += `## 🗄️ TEST DATA CREATED\n\n`;
  reportContent += `| Key | Value |\n`;
  reportContent += `|-----|-------|\n`;
  Object.entries(testData).forEach(([key, value]) => {
    if (value) reportContent += `| ${key} | ${value} |\n`;
  });
  reportContent += `\n---\n\n`;

  reportContent += `## 🧪 ALL TESTS\n\n`;
  detailedReport.tests.forEach((test, index) => {
    const statusIcon = test.status === 'PASS' ? '✅' : test.status === 'FAIL' ? '❌' : '⏭️';
    reportContent += `### ${index + 1}. ${statusIcon} ${test.name}\n\n`;
    reportContent += `**Status:** ${test.status}\n`;
    if (test.statusCode) reportContent += `**HTTP Status:** ${test.statusCode}\n`;
    if (test.message) reportContent += `**Message:** ${test.message}\n`;
    if (test.requestData) {
      reportContent += `\n**Request Data:**\n\`\`\`json\n${JSON.stringify(test.requestData, null, 2)}\n\`\`\`\n`;
    }
    if (test.responseData) {
      reportContent += `\n**Response Data:**\n\`\`\`json\n${JSON.stringify(test.responseData, null, 2)}\n\`\`\`\n`;
    }
    if (test.error) {
      reportContent += `\n**Error:**\n\`\`\`\n${test.error.message || JSON.stringify(test.error)}\n\`\`\`\n`;
    }
    reportContent += `\n---\n\n`;
  });

  if (testResults.failed.length > 0) {
    reportContent += `## ❌ FAILED TESTS SUMMARY\n\n`;
    testResults.failed.forEach((test, index) => {
      reportContent += `${index + 1}. **${test.name}** - ${test.message}\n\n`;
    });
  }

  if (testResults.skipped.length > 0) {
    reportContent += `## ⏭️ SKIPPED TESTS SUMMARY\n\n`;
    testResults.skipped.forEach((test, index) => {
      reportContent += `${index + 1}. **${test.name}** - ${test.message}\n\n`;
    });
  }

  const reportPath = path.join(process.cwd(), 'tests', 'API_TEST_REPORT.md');
  fs.writeFileSync(reportPath, reportContent, 'utf8');
  console.log(`\n📄 Detailed report saved to: ${reportPath}`);
}

/**
 * Print Test Summary
 */
function printSummary() {
  console.log('\n' + '='.repeat(60));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total Tests: ${testResults.total}`);
  console.log(`✅ Passed: ${testResults.passed.length}`);
  console.log(`❌ Failed: ${testResults.failed.length}`);
  console.log(`⏭️  Skipped: ${testResults.skipped.length}`);
  console.log(
    `Success Rate: ${testResults.total > 0 ? ((testResults.passed.length / testResults.total) * 100).toFixed(2) : '0.00'}%`
  );

  if (testResults.failed.length > 0) {
    console.log('\n❌ FAILED TESTS:');
    testResults.failed.forEach((test) => {
      console.log(`  - ${test.name}: ${test.message}`);
    });
  }

  if (testResults.skipped.length > 0) {
    console.log('\n⏭️  SKIPPED TESTS:');
    testResults.skipped.forEach((test) => {
      console.log(`  - ${test.name}: ${test.message}`);
    });
  }

  console.log('\n' + '='.repeat(60));
}

/**
 * Main Test Runner
 */
async function runAllTests() {
  console.log('🚀 Starting BidRoom API Test Suite (Hardened)...');
  console.log(`📍 Base URL: ${BASE_URL}`);
  console.log(`📍 API Base: ${API_BASE}`);
  console.log('='.repeat(60));

  try {
    // Run test suites
    await testAuthentication();
    await testProjects();
    await testMilestones();
    await testBids();
    await testJobs();
    await testPayments();
    await testPayouts();
    await testContractors();
    await testConversations();
    await testMessages();
    await testNotifications();
    await testProgressUpdates();
    await testReviews();
    await testDisputes();
    await testAdmin();
    await testUserRoutes();
    await testPermissions();

    // Summary + report
    printSummary();
    await generateDetailedReport();

    process.exit(testResults.failed.length > 0 ? 1 : 0);
  } catch (error) {
    console.error('\n❌ Test suite crashed:', error);
    process.exit(1);
  }
}

// Run tests
runAllTests();
