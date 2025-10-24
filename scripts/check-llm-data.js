#!/usr/bin/env node

/**
 * Check LLM data preparation WITHOUT making actual LLM API calls
 * 
 * This script validates:
 * 1. Environment variables are set
 * 2. Report data is fetched correctly
 * 3. Learning outcomes and module tools are fetched
 * 4. No empty/null values in promptData
 * 5. System prompt structure
 * 
 * This is a dry-run that doesn't consume LLM tokens.
 * 
 * Usage:
 *   node scripts/check-llm-data.js <reportType> <reportId> [userId]
 */

const https = require('https');
const http = require('http');
const fs = require('fs');

// Color output helpers
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
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

// Parse arguments
const args = process.argv.slice(2);
const reportType = args[0];
const reportId = args[1];
const userId = args[2];

if (!reportType || !reportId) {
  logError('Usage: node scripts/check-llm-data.js <reportType> <reportId> [userId]');
  process.exit(1);
}

if (reportType === 'student' && !userId) {
  logError('userId is required for student reports');
  process.exit(1);
}

// Load environment variables
require('dotenv').config({ path: '.env.local' });

logSection('🔧 Step 1: Environment Variables');

const LITELLM_API_KEY = process.env.LITELLM_API_KEY;
const LITELLM_BASE_URL = process.env.LITELLM_BASE_URL;
const NEXT_PUBLIC_APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
const NEXT_PUBLIC_SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const NEXT_PUBLIC_SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const TEST_ADMIN_EMAIL = process.env.TEST_ADMIN_EMAIL;
const TEST_ADMIN_PASSWORD = process.env.TEST_ADMIN_PASSWORD;

if (!LITELLM_API_KEY) {
  logError('LITELLM_API_KEY not set');
  process.exit(1);
}
logSuccess(`LITELLM_API_KEY: ${LITELLM_API_KEY.substring(0, 15)}...`);

if (!LITELLM_BASE_URL) {
  logError('LITELLM_BASE_URL not set');
  process.exit(1);
}
logSuccess(`LITELLM_BASE_URL: ${LITELLM_BASE_URL}`);

if (!NEXT_PUBLIC_SUPABASE_URL || !NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  logWarning('NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY not set');
  logWarning('Auto-authentication will not be available');
} else {
  logSuccess('Supabase credentials found');
}

if (!TEST_ADMIN_EMAIL || !TEST_ADMIN_PASSWORD) {
  logWarning('TEST_ADMIN_EMAIL/PASSWORD not set - some API calls may fail with 401');
  logInfo('Add to .env.local: TEST_ADMIN_EMAIL and TEST_ADMIN_PASSWORD');
} else {
  logSuccess(`TEST_ADMIN_EMAIL is set: ${TEST_ADMIN_EMAIL}`);
}

// Helper to make requests
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
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, data });
        }
      });
    });

    req.on('error', reject);
    if (postData) req.write(JSON.stringify(postData));
    req.end();
  });
}

// Deep check for empty values
function checkForEmptyValues(obj, path = '') {
  const issues = [];
  
  if (obj === null) {
    issues.push({ path, issue: 'null value' });
    return issues;
  }
  
  if (obj === undefined) {
    issues.push({ path, issue: 'undefined value' });
    return issues;
  }
  
  if (typeof obj === 'string' && obj.trim() === '') {
    issues.push({ path, issue: 'empty string' });
    return issues;
  }
  
  if (Array.isArray(obj)) {
    if (obj.length === 0) {
      issues.push({ path, issue: 'empty array' });
    }
    obj.forEach((item, index) => {
      issues.push(...checkForEmptyValues(item, `${path}[${index}]`));
    });
    return issues;
  }
  
  if (typeof obj === 'object') {
    Object.keys(obj).forEach(key => {
      const newPath = path ? `${path}.${key}` : key;
      issues.push(...checkForEmptyValues(obj[key], newPath));
    });
  }
  
  return issues;
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

async function runChecks() {
  try {
    // Authenticate if credentials provided
    let accessToken = null;
    
    if (TEST_ADMIN_EMAIL && TEST_ADMIN_PASSWORD && NEXT_PUBLIC_SUPABASE_URL) {
      logSection('🔐 Step 1.5: Authenticating with Supabase');
      try {
        accessToken = await authenticateWithSupabase();
        logSuccess('✅ Authentication successful!');
      } catch (error) {
        logWarning(`Authentication failed: ${error.message}`);
        logWarning('Continuing without authentication - some API calls may fail');
      }
    }
    
    logSection('📊 Step 2: Fetching Report Data');
    
    // Helper to add auth header
    const makeAuthRequest = async (url) => {
      const options = accessToken ? {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      } : {};
      return makeRequest(url, options);
    };
    
    // Fetch base report
    logInfo(`Fetching report: ${reportId}`);
    const reportRes = await makeAuthRequest(`${NEXT_PUBLIC_APP_URL}/api/reports/${reportId}`);
    
    if (reportRes.status !== 200) {
      logError(`Failed to fetch report: ${reportRes.status}`);
      process.exit(1);
    }
    
    const report = reportRes.data.report || reportRes.data;
    if (!report || !report.id) {
      logError('Report data is invalid or missing');
      process.exit(1);
    }
    logSuccess(`Report fetched: ${report.title}`);
    logInfo(`  - Performance data: ${report.performance_data?.length || 0} students`);
    logInfo(`  - Structure data: ${report.structure_data?.length || 0} rows`);
    logInfo(`  - Submissions data: ${report.submissions_data?.length || 0} submissions`);
    
    logSection('🎯 Step 3: Fetching Learning Outcomes & Tools');
    
    // Fetch learning outcomes
    const outcomesRes = await makeAuthRequest(
      `${NEXT_PUBLIC_APP_URL}/api/reports/learning-outcomes?reportId=${reportId}`
    );
    
    if (outcomesRes.status !== 200) {
      logWarning(`Failed to fetch learning outcomes: ${outcomesRes.status}`);
    } else {
      const outcomes = outcomesRes.data.learningOutcomes || [];
      if (outcomes.length === 0) {
        logWarning('No learning outcomes found');
      } else {
        logSuccess(`Learning outcomes fetched: ${outcomes.length} modules`);
        outcomes.forEach(lo => {
          logInfo(`  - Module ${lo.module_id}: ${lo.module_title}`);
          logInfo(`    Outcomes: ${lo.outcomes?.split('\n').length || 0} items`);
        });
      }
    }
    
    // Fetch module tools
    const toolsRes = await makeAuthRequest(
      `${NEXT_PUBLIC_APP_URL}/api/reports/module-tools?reportId=${reportId}`
    );
    
    if (toolsRes.status !== 200) {
      logWarning(`Failed to fetch module tools: ${toolsRes.status}`);
    } else {
      const tools = toolsRes.data.moduleTools || [];
      if (tools.length === 0) {
        logWarning('No module tools found');
      } else {
        logSuccess(`Module tools fetched: ${tools.length} modules`);
        tools.forEach(mt => {
          logInfo(`  - Module ${mt.module_id}: ${mt.tools?.split('\n').length || 0} tools`);
        });
      }
    }
    
    logSection('🔍 Step 4: Validating Report Statistics');
    
    // Validate core statistics
    const stats = {
      students: report.performance_data?.length || 0,
      structureRows: report.structure_data?.length || 0,
      submissions: report.submissions_data?.length || 0,
      meetings: report.meetings_data?.length || 0,
      dynamicData: report.dynamic_data?.length || 0,
      dynamicSeries: report.dynamic_series?.length || 0,
      learningOutcomes: (outcomesRes.data?.learningOutcomes || []).length,
      moduleTools: (toolsRes.data?.moduleTools || []).length,
    };
    
    logInfo('Report Statistics:');
    Object.entries(stats).forEach(([key, value]) => {
      if (value === 0) {
        logWarning(`  ${key}: ${value} (empty)`);
      } else {
        logSuccess(`  ${key}: ${value}`);
      }
    });
    
    // Check for critical empty values
    const criticalFields = ['students', 'structureRows', 'submissions'];
    const emptyCritical = criticalFields.filter(field => stats[field] === 0);
    
    if (emptyCritical.length > 0) {
      logWarning(`\nCritical fields are empty: ${emptyCritical.join(', ')}`);
      logWarning('LLM generation may fail or produce poor results');
    } else {
      logSuccess('\nAll critical statistics are present!');
    }
    
    logSection('🔍 Step 5: Validating Modules with Learning Outcomes');
    
    // Check which modules have learning outcomes and tools
    const modulesWithOutcomes = new Set((outcomesRes.data?.learningOutcomes || []).map(lo => lo.module_id));
    const modulesWithTools = new Set((toolsRes.data?.moduleTools || []).map(mt => mt.module_id));
    
    // Get unique module IDs from structure
    const allModuleIds = new Set(
      (report.structure_data || [])
        .filter(s => s.module_id)
        .map(s => s.module_id)
    );
    
    logInfo(`Total modules in structure: ${allModuleIds.size}`);
    logInfo(`Modules with learning outcomes: ${modulesWithOutcomes.size}`);
    logInfo(`Modules with tools: ${modulesWithTools.size}`);
    
    if (modulesWithOutcomes.size === 0 && allModuleIds.size > 0) {
      logWarning('⚠️  No learning outcomes defined for any module!');
      logWarning('LLM will not be able to reference specific learning outcomes');
      logInfo('Consider generating learning outcomes in Settings page');
    } else if (modulesWithOutcomes.size < allModuleIds.size) {
      const coverage = Math.round((modulesWithOutcomes.size / allModuleIds.size) * 100);
      logInfo(`Learning outcomes coverage: ${coverage}% of modules`);
    } else {
      logSuccess('All modules have learning outcomes! 🎉');
    }
    
    if (modulesWithTools.size === 0 && allModuleIds.size > 0) {
      logWarning('⚠️  No tools defined for any module!');
      logWarning('LLM will not be able to reference specific tools/technologies');
    } else if (modulesWithTools.size < allModuleIds.size) {
      const coverage = Math.round((modulesWithTools.size / allModuleIds.size) * 100);
      logInfo(`Tools coverage: ${coverage}% of modules`);
    } else {
      logSuccess('All modules have tools defined! 🎉');
    }
    
    logSection('📊 Step 5.5: Data Structure Validation');
    
    // Prepare data as the API would
    let promptData = {
      reportTitle: report.title,
      reportDescription: report.description,
      performanceData: report.performance_data,
      dynamicData: report.dynamic_data,
      structureData: report.structure_data,
      submissionsData: report.submissions_data,
      meetingsData: report.meetings_data,
      learningOutcomes: outcomesRes.data?.learningOutcomes || [],
      moduleTools: toolsRes.data?.moduleTools || [],
    };
    
    if (reportType === 'student' && userId) {
      const studentPerformance = report.performance_data?.find(s => s.user_id === userId);
      if (!studentPerformance) {
        logError(`Student ${userId} not found in performance data`);
        process.exit(1);
      }
      logSuccess(`Student found: ${studentPerformance.name}`);
      
      // Check student-specific stats
      const studentSubmissions = (report.submissions_data || []).filter(
        s => String(s.user_id || s.userid) === String(userId)
      );
      const studentMeetings = (report.meetings_data || []).filter(
        m => String(m.user_id || m.userid) === String(userId)
      );
      
      logInfo(`Student submissions: ${studentSubmissions.length}`);
      logInfo(`Student meetings: ${studentMeetings.length}`);
      
      promptData = {
        studentName: studentPerformance.name,
        performance: studentPerformance,
        submissions: studentSubmissions,
        meetings: studentMeetings,
        learningOutcomes: promptData.learningOutcomes,
        moduleTools: promptData.moduleTools,
      };
    }
    
    // Check for empty values
    const issues = checkForEmptyValues(promptData);
    const criticalIssues = issues.filter(i => 
      !i.path.includes('learningOutcomes') && 
      !i.path.includes('moduleTools') &&
      !i.path.includes('comment') &&
      !i.path.includes('description')
    );
    
    if (criticalIssues.length > 0) {
      logWarning(`Found ${criticalIssues.length} potentially problematic empty values:`);
      criticalIssues.slice(0, 10).forEach(issue => {
        logWarning(`  ${issue.path}: ${issue.issue}`);
      });
      if (criticalIssues.length > 10) {
        logWarning(`  ... and ${criticalIssues.length - 10} more`);
      }
    } else {
      logSuccess('No critical empty values found in core data');
    }
    
    if (issues.some(i => i.path.includes('learningOutcomes'))) {
      logInfo('Note: Some learning outcomes data is empty (this may be expected)');
    }
    
    if (issues.some(i => i.path.includes('moduleTools'))) {
      logInfo('Note: Some module tools data is empty (this may be expected)');
    }
    
    logSection('📝 Step 6: System Prompt Validation');
    
    // Read the actual route file to check system prompt
    const routeFile = reportType === 'manager'
      ? 'app/api/llm/generate-manager-report/route.ts'
      : 'app/api/llm/generate-student-report/route.ts';
    
    if (fs.existsSync(routeFile)) {
      const routeContent = fs.readFileSync(routeFile, 'utf8');
      
      // Check for key phrases in system prompt
      const checks = [
        { phrase: 'learningOutcomes', name: 'Learning Outcomes data reference' },
        { phrase: 'moduleTools', name: 'Module Tools data reference' },
        { phrase: 'Learning Outcomes', name: 'Learning Outcomes in prompt' },
        { phrase: 'Module Tools', name: 'Module Tools in prompt' },
        { phrase: 'completion rate', name: 'Completion rate analysis' },
        { phrase: 'success rate', name: 'Success rate analysis' },
      ];
      
      checks.forEach(check => {
        if (routeContent.includes(check.phrase)) {
          logSuccess(`✓ System prompt includes: ${check.name}`);
        } else {
          logWarning(`✗ System prompt may be missing: ${check.name}`);
        }
      });
      
      // Count prompt length
      const promptMatch = routeContent.match(/const systemPrompt = `([\s\S]*?)`\s*;/);
      if (promptMatch) {
        const promptText = promptMatch[1];
        logInfo(`System prompt length: ${promptText.length} characters`);
        logInfo(`System prompt lines: ${promptText.split('\n').length} lines`);
      }
    } else {
      logWarning(`Could not read route file: ${routeFile}`);
    }
    
    logSection('📊 Step 7: Data Summary');
    
    // Summary statistics
    logInfo('\n📈 Final Statistics Summary:');
    logInfo('═'.repeat(60));
    
    // Core data
    logInfo('Core Data:');
    logInfo(`  Students: ${stats.students}`);
    logInfo(`  Structure rows: ${stats.structureRows}`);
    logInfo(`  Submissions: ${stats.submissions}`);
    logInfo(`  Meetings: ${stats.meetings}`);
    
    // Dynamic data (for manager)
    if (reportType === 'manager') {
      logInfo(`  Dynamic data points: ${stats.dynamicData}`);
      logInfo(`  Dynamic series: ${stats.dynamicSeries}`);
    }
    
    // Learning outcomes and tools
    logInfo('\nLearning Outcomes & Tools:');
    logInfo(`  Modules with outcomes: ${modulesWithOutcomes.size}/${allModuleIds.size}`);
    logInfo(`  Modules with tools: ${modulesWithTools.size}/${allModuleIds.size}`);
    
    // Calculate readiness score
    const readinessChecks = [
      stats.students > 0,
      stats.structureRows > 0,
      stats.submissions > 0,
      modulesWithOutcomes.size > 0,
      criticalIssues.length === 0,
    ];
    const readinessScore = Math.round((readinessChecks.filter(Boolean).length / readinessChecks.length) * 100);
    
    logInfo('\n🎯 Data Readiness Score:');
    if (readinessScore === 100) {
      logSuccess(`  ${readinessScore}% - EXCELLENT! Ready for LLM generation 🎉`);
    } else if (readinessScore >= 80) {
      logSuccess(`  ${readinessScore}% - GOOD. LLM generation should work well`);
    } else if (readinessScore >= 60) {
      logWarning(`  ${readinessScore}% - FAIR. LLM may produce limited results`);
    } else {
      logError(`  ${readinessScore}% - POOR. Critical data missing`);
    }
    
    // Save prepared data
    const outputFile = `llm-data-check-${reportType}-${Date.now()}.json`;
    fs.writeFileSync(outputFile, JSON.stringify({
      reportType,
      reportId,
      userId: userId || null,
      timestamp: new Date().toISOString(),
      statistics: stats,
      moduleCoverage: {
        totalModules: allModuleIds.size,
        withOutcomes: modulesWithOutcomes.size,
        withTools: modulesWithTools.size,
      },
      readinessScore,
      promptData,
      issues: criticalIssues,
    }, null, 2));
    
    logSuccess(`\n✅ Data check complete!`);
    logInfo(`📄 Full data saved to: ${outputFile}`);
    
    if (criticalIssues.length === 0 && readinessScore >= 80) {
      logSuccess('\n🎉 Data is ready for LLM generation!');
      logInfo('\nTo test actual LLM generation, run:');
      if (reportType === 'manager') {
        logInfo(`  node scripts/test-llm-generation.js manager ${reportId}`);
      } else {
        logInfo(`  node scripts/test-llm-generation.js student ${reportId} ${userId}`);
      }
    } else {
      logWarning('\n⚠️  Some issues found. Review the output above.');
      if (modulesWithOutcomes.size === 0) {
        logInfo('\n💡 Tip: Add learning outcomes in Settings page for better LLM results');
      }
    }
    
  } catch (error) {
    logError(`\n💥 Error: ${error.message}`);
    console.error(error);
    process.exit(1);
  }
}

runChecks();

