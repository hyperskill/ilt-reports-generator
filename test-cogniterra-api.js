// Test script for Cogniterra API
// Run with: node test-cogniterra-api.js

const fetch = require('node-fetch');

async function testCogniterraAPI() {
  const apiUrl = process.env.COGNITERRA_API_URL || 'https://cogniterra.org';
  const clientId = process.env.COGNITERRA_CLIENT_ID;
  const clientSecret = process.env.COGNITERRA_CLIENT_SECRET;
  const courseId = 678;

  console.log('🔍 Testing Cogniterra API...\n');
  console.log('API URL:', apiUrl);
  console.log('Course ID:', courseId);
  console.log('Client ID:', clientId ? '✅ Set' : '❌ Not set');
  console.log('Client Secret:', clientSecret ? '✅ Set' : '❌ Not set');
  console.log('\n---\n');

  if (!clientId || !clientSecret) {
    console.error('❌ Missing credentials. Please set COGNITERRA_CLIENT_ID and COGNITERRA_CLIENT_SECRET');
    process.exit(1);
  }

  try {
    // Step 1: Get access token
    console.log('1️⃣ Getting access token...');
    const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    
    const tokenResponse = await fetch(`${apiUrl}/oauth2/token/`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      throw new Error(`Token request failed: ${tokenResponse.status} ${errorText}`);
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;
    console.log('✅ Access token received');
    console.log('   Token type:', tokenData.token_type);
    console.log('   Expires in:', tokenData.expires_in, 'seconds');
    console.log('\n---\n');

    // Step 2: Fetch sections
    console.log('2️⃣ Fetching sections for course', courseId, '...');
    const sectionsResponse = await fetch(`${apiUrl}/api/sections?course=${courseId}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!sectionsResponse.ok) {
      const errorText = await sectionsResponse.text();
      throw new Error(`Sections request failed: ${sectionsResponse.status} ${errorText}`);
    }

    const sectionsData = await sectionsResponse.json();
    const sections = sectionsData.sections || [];
    
    console.log('✅ Sections received:', sections.length);
    console.log('\n📚 Modules:\n');
    
    sections.forEach((section, idx) => {
      console.log(`${idx + 1}. [ID: ${section.id}] ${section.title}`);
      console.log(`   Position: ${section.position}`);
      console.log(`   Lessons: ${section.lessons ? section.lessons.length : 0}`);
      console.log('');
    });

    console.log('\n---\n');
    console.log('✅ Test completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`   Total modules: ${sections.length}`);
    console.log(`   Module IDs: ${sections.map(s => s.id).join(', ')}`);

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    process.exit(1);
  }
}

testCogniterraAPI();

