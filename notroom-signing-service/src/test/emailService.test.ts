/**
 * Test script for Emailit.com email service integration
 * Run this in browser console or as a test
 */

import { captureLeadMagnetEmail, sendTransactionalEmail } from '@/services/emailService';

/**
 * Test email service functions
 */
export async function testEmailService() {
  console.log('🧪 Testing Emailit.com Email Service...\n');

  // Test 1: Check if API key is configured
  const apiKey = import.meta.env.VITE_EMAILIT_API_KEY;
  const apiUrl = import.meta.env.VITE_EMAILIT_API_URL || 'https://api.emailit.com/v1';
  
  console.log('📋 Configuration Check:');
  console.log(`  API Key: ${apiKey ? '✅ Configured' : '❌ Missing'}`);
  console.log(`  API URL: ${apiUrl}`);
  console.log('');

  if (!apiKey) {
    console.error('❌ API key not configured. Please add VITE_EMAILIT_API_KEY to your .env file.');
    return;
  }

  // Test 2: Test lead magnet email
  console.log('📧 Test 1: Lead Magnet Email');
  try {
    const leadResult = await captureLeadMagnetEmail({
      email: 'test@example.com', // Replace with your test email
      name: 'Test User',
      resource: 'Test Resource'
    });
    console.log(`  Result: ${leadResult ? '✅ Success' : '❌ Failed'}`);
  } catch (error) {
    console.error('  Error:', error);
  }
  console.log('');

  // Test 3: Test transactional email
  console.log('📧 Test 2: Transactional Email');
  try {
    const transactionalResult = await sendTransactionalEmail({
      to: 'test@example.com', // Replace with your test email
      subject: 'Test Email from Notroom',
      html: '<h1>Test Email</h1><p>This is a test email from the Emailit.com integration.</p>'
    });
    console.log(`  Result: ${transactionalResult ? '✅ Success' : '❌ Failed'}`);
  } catch (error) {
    console.error('  Error:', error);
  }
  console.log('');

  console.log('✅ Email service tests completed!');
  console.log('📬 Check your email inbox (and spam folder) for test emails.');
}

// Export for use in browser console
if (typeof window !== 'undefined') {
  (window as unknown as { testEmailService: typeof testEmailService }).testEmailService = testEmailService;
}

