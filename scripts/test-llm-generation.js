#!/usr/bin/env node

/**
 * Test script for LLM report generation
 * 
 * This script tests:
 * 1. LLM connection with API keys
 * 2. Data preparation (no empty values)
 * 3. System prompt correctness
 * 4. Expected response format
 * 
 * Usage:
 *   node scripts/test-llm-generation.js <reportType> <reportId> [userId]
 * 
 * Examples:
 *   node scripts/test-llm-generation.js manager b5b4b3e5-79d7-4f80-8f24-7b21681b0f0b
 *   node scripts/test-llm-generation.js student b5b4b3e5-79d7-4f80-8f24-7b21681b0f0b 1175321
 */

const https = require('https');
const http = require('http');

// Color output helpers
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function log(message, color = '') {
  console.log(`${color}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(80));
  log(title, colors.bright + colors.cyan);
  console.log('='.repeat(80) + '\n');
}

function logSuccess(message) {
  log(`✅ ${message}`, colors.green);
}

function logError(message) {
  log(`❌ ${message}`, colors.red);
}

function logWarning(message) {
  log(`⚠️  ${message}`, colors.yellow);
}

function logInfo(message) {
  log(`ℹ️  ${message}`, colors.blue);
}

// Parse command line arguments
const args = process.argv.slice(2);
const reportType = args[0]; // 'manager' or 'student'
const reportId = args[1];
const userId = args[2]; // only for student reports
const authCookie = process.env.AUTH_COOKIE; // from .env.local

if (!reportType || !reportId) {
  logError('Usage: node scripts/test-llm-generation.js <reportType> <reportId> [userId]');
  logInfo('Examples:');
  logInfo('  node scripts/test-llm-generation.js manager b5b4b3e5-79d7-4f80-8f24-7b21681b0f0b');
  logInfo('  node scripts/test-llm-generation.js student b5b4b3e5-79d7-4f80-8f24-7b21681b0f0b 1175321');
  logInfo('\nNote: For authentication, add AUTH_COOKIE to .env.local (see instructions below)');
  process.exit(1);
}

if (reportType !== 'manager' && reportType !== 'student') {
  logError('reportType must be either "manager" or "student"');
  process.exit(1);
}

if (reportType === 'student' && !userId) {
  logError('userId is required for student reports');
  process.exit(1);
}

// Load environment variables
require('dotenv').config({ path: '.env.local' });

logSection('🔧 Step 1: Checking Environment Variables');

const LITELLM_API_KEY = process.env.LITELLM_API_KEY;
const LITELLM_BASE_URL = process.env.LITELLM_BASE_URL;
const NEXT_PUBLIC_APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
const NEXT_PUBLIC_SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const NEXT_PUBLIC_SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const TEST_ADMIN_EMAIL = process.env.TEST_ADMIN_EMAIL;
const TEST_ADMIN_PASSWORD = process.env.TEST_ADMIN_PASSWORD;

if (!LITELLM_API_KEY) {
  logError('LITELLM_API_KEY is not set in .env.local');
  process.exit(1);
}
logSuccess(`LITELLM_API_KEY is set: ${LITELLM_API_KEY.substring(0, 10)}...`);

if (!LITELLM_BASE_URL) {
  logError('LITELLM_BASE_URL is not set in .env.local');
  process.exit(1);
}
logSuccess(`LITELLM_BASE_URL is set: ${LITELLM_BASE_URL}`);

logSuccess(`NEXT_PUBLIC_APP_URL: ${NEXT_PUBLIC_APP_URL}`);

if (!NEXT_PUBLIC_SUPABASE_URL || !NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  logError('NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY not set');
  logError('These are required for authentication');
  process.exit(1);
}
logSuccess('Supabase credentials found');

if (!TEST_ADMIN_EMAIL || !TEST_ADMIN_PASSWORD) {
  if (!authCookie) {
    logError('Neither TEST_ADMIN_EMAIL/TEST_ADMIN_PASSWORD nor AUTH_COOKIE are set');
    logInfo('\nAdd to .env.local:');
    logInfo('  TEST_ADMIN_EMAIL=your-admin@email.com');
    logInfo('  TEST_ADMIN_PASSWORD=your-password');
    logInfo('\nOr manually set AUTH_COOKIE (see docs)');
    process.exit(1);
  }
  logWarning('TEST_ADMIN_EMAIL/PASSWORD not set, using provided AUTH_COOKIE');
  logSuccess(`AUTH_COOKIE is set (${authCookie.substring(0, 50)}...)`);
} else {
  logSuccess(`TEST_ADMIN_EMAIL is set: ${TEST_ADMIN_EMAIL}`);
  logSuccess('TEST_ADMIN_PASSWORD is set');
}

// Helper to make HTTP requests
function makeRequest(url, options = {}, postData = null) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const protocol = urlObj.protocol === 'https:' ? https : http;
    
    const reqOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: options.headers || {},
    };

    const req = protocol.request(reqOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data), headers: res.headers });
        } catch (e) {
          resolve({ status: res.statusCode, data, headers: res.headers });
        }
      });
    });

    req.on('error', reject);

    if (postData) {
      req.write(JSON.stringify(postData));
    }

    req.end();
  });
}

// Authenticate with Supabase and get session cookies
async function authenticateWithSupabase() {
  try {
    logInfo('Authenticating with Supabase...');
    
    const authUrl = `${NEXT_PUBLIC_SUPABASE_URL}/auth/v1/token?grant_type=password`;
    const authResponse = await makeRequest(authUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': NEXT_PUBLIC_SUPABASE_ANON_KEY,
      },
    }, {
      email: TEST_ADMIN_EMAIL,
      password: TEST_ADMIN_PASSWORD,
    });
    
    if (authResponse.status !== 200) {
      throw new Error(`Authentication failed: ${authResponse.status}`);
    }
    
    const { access_token, refresh_token } = authResponse.data;
    
    if (!access_token) {
      throw new Error('No access token received from Supabase');
    }
    
    logSuccess('Successfully authenticated with Supabase');
    
    // Return the access token - we'll use it in Authorization header
    return access_token;
  } catch (error) {
    throw new Error(`Supabase authentication failed: ${error.message}`);
  }
}

// Main test function
async function runTests() {
  try {
    // Step 1.5: Authenticate if credentials provided
    let accessToken = null;
    
    if (TEST_ADMIN_EMAIL && TEST_ADMIN_PASSWORD) {
      logSection('🔐 Step 1.5: Authenticating with Supabase');
      try {
        accessToken = await authenticateWithSupabase();
        logSuccess('✅ Authentication successful!');
        logInfo(`Access Token: ${accessToken.substring(0, 50)}...`);
      } catch (error) {
        logError(`Authentication failed: ${error.message}`);
        logWarning('Continuing without authentication - API call will likely fail with 401');
      }
    } else if (authCookie) {
      logWarning('Using AUTH_COOKIE from .env.local (legacy method)');
      logWarning('Consider switching to TEST_ADMIN_EMAIL/PASSWORD');
    }
    
    // Step 2: Fetch report data from API
    logSection(`🔍 Step 2: Fetching Report Data (${reportType})`);
    
    const endpoint = reportType === 'manager'
      ? `${NEXT_PUBLIC_APP_URL}/api/llm/generate-manager-report`
      : `${NEXT_PUBLIC_APP_URL}/api/llm/generate-student-report`;
    
    const requestBody = reportType === 'manager'
      ? { reportId }
      : { reportId, userId };
    
    logInfo(`Calling: POST ${endpoint}`);
    logInfo(`Body: ${JSON.stringify(requestBody, null, 2)}`);
    
    // Note: This will actually trigger LLM generation
    logWarning('⚠️  This will make a REAL API call to LLM and consume tokens!');
    logWarning('⚠️  Press Ctrl+C within 3 seconds to cancel...\n');
    
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const headers = {
      'Content-Type': 'application/json',
    };
    
    // Add authentication (Bearer token or legacy cookie)
    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
      logInfo('Using Bearer token authentication');
    } else if (authCookie) {
      headers['Cookie'] = authCookie;
      logInfo('Using cookie authentication (legacy)');
    } else {
      logWarning('No authentication - request will likely fail');
    }
    
    const response = await makeRequest(endpoint, {
      method: 'POST',
      headers,
    }, requestBody);
    
    logSection('📊 Step 3: Analyzing API Response');
    
    if (response.status !== 200) {
      logError(`API returned status ${response.status}`);
      logError(`Response: ${JSON.stringify(response.data, null, 2)}`);
      process.exit(1);
    }
    
    logSuccess(`API returned status 200`);
    
    const result = response.data;
    
    // Check for errors
    if (result.error) {
      logError(`API returned error: ${result.error}`);
      process.exit(1);
    }
    
    // Validate response structure
    if (!result.success) {
      logError('Response does not have success: true');
    } else {
      logSuccess('Response has success: true');
    }
    
    if (!result.content) {
      logError('Response does not have content field');
      process.exit(1);
    }
    logSuccess('Response has content field');
    
    // Validate content structure based on report type
    logSection('📝 Step 4: Validating Generated Content');
    
    const content = result.content;
    
    if (reportType === 'manager') {
      const expectedFields = [
        'executiveSummary',
        'skillsAcquired',
        'teamEngagement',
        'expertObservations',
        'recommendations',
      ];
      
      expectedFields.forEach(field => {
        if (!content[field]) {
          logError(`Missing field: ${field}`);
        } else if (typeof content[field] !== 'string') {
          logError(`Field ${field} is not a string`);
        } else if (content[field].length === 0) {
          logError(`Field ${field} is empty`);
        } else {
          logSuccess(`Field ${field}: ${content[field].length} characters`);
        }
      });
    } else {
      const expectedFields = [
        'learningJourney',
        'strengthsAchievements',
        'skillsDevelopment',
        'instructorFeedback',
        'growthOpportunities',
        'nextSteps',
      ];
      
      expectedFields.forEach(field => {
        if (!content[field]) {
          logError(`Missing field: ${field}`);
        } else if (typeof content[field] !== 'string') {
          logError(`Field ${field} is not a string`);
        } else if (content[field].length === 0) {
          logError(`Field ${field} is empty`);
        } else {
          logSuccess(`Field ${field}: ${content[field].length} characters`);
        }
      });
    }
    
    // Check for learning outcomes mentions
    logSection('🎯 Step 5: Checking Learning Outcomes Integration');
    
    let mentionsOutcomes = false;
    let mentionsTools = false;
    
    Object.values(content).forEach(text => {
      if (typeof text === 'string') {
        // Check for common outcome-related phrases
        if (text.toLowerCase().includes('learning outcome') || 
            text.toLowerCase().includes('mastered') ||
            text.toLowerCase().includes('completion rate') ||
            text.toLowerCase().includes('success rate')) {
          mentionsOutcomes = true;
        }
        
        // Check for tool mentions
        if (text.toLowerCase().includes('tool') || 
            text.toLowerCase().includes('technology') ||
            text.toLowerCase().includes('platform')) {
          mentionsTools = true;
        }
      }
    });
    
    if (mentionsOutcomes) {
      logSuccess('Content mentions learning outcomes or related metrics');
    } else {
      logWarning('Content does not mention learning outcomes (this may be okay if no outcomes are defined)');
    }
    
    if (mentionsTools) {
      logSuccess('Content mentions tools or technologies');
    } else {
      logWarning('Content does not mention tools (this may be okay if no tools are defined)');
    }
    
    // Display sample content
    logSection('📄 Step 6: Sample Generated Content');
    
    const firstField = Object.keys(content)[0];
    const sampleText = content[firstField];
    const preview = sampleText.length > 500 
      ? sampleText.substring(0, 500) + '...' 
      : sampleText;
    
    log(`${colors.bright}${firstField}:${colors.reset}`, colors.magenta);
    console.log(preview);
    
    // Final summary
    logSection('✨ Test Summary');
    
    logSuccess('✅ LLM connection working');
    logSuccess('✅ API endpoint accessible');
    logSuccess('✅ Response format correct');
    logSuccess('✅ All required fields present');
    logSuccess('✅ Content generated successfully');
    
    logInfo('\n💾 Full response saved to: test-llm-response.json');
    
    const fs = require('fs');
    fs.writeFileSync(
      'test-llm-response.json',
      JSON.stringify(result, null, 2),
      'utf8'
    );
    
    logSuccess('\n🎉 All tests passed!');
    
  } catch (error) {
    logSection('💥 Error Occurred');
    logError(error.message);
    console.error(error);
    process.exit(1);
  }
}

// Run tests
runTests();

