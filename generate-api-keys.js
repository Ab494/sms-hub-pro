// Generate secure API keys for external companies
import crypto from 'crypto';

// Function to generate a secure API key
function generateApiKey(prefix = 'tumaprime') {
  // Generate 32 random bytes (256 bits)
  const randomBytes = crypto.randomBytes(32);

  // Convert to base64 for readability
  const key = randomBytes.toString('base64');

  // Add prefix and timestamp for identification
  const timestamp = Date.now();
  return `${prefix}_${timestamp}_${key}`;
}

// Generate keys for multiple companies
function generateCompanyKeys(companyNames) {
  const keys = {};
  companyNames.forEach(company => {
    const cleanName = company.toLowerCase().replace(/[^a-z0-9]/g, '');
    keys[company] = generateApiKey(cleanName);
  });
  return keys;
}

// Example usage - customize with your company names
const companies = ['CompanyA', 'CompanyB', 'CompanyC'];
const apiKeys = generateCompanyKeys(companies);

console.log('Generated API Keys:');
Object.entries(apiKeys).forEach(([company, key]) => {
  console.log(`${company}: ${key}`);
});

console.log('\nAdd to VALID_API_KEYS environment variable:');
console.log(Object.values(apiKeys).join(','));

// Export for use in other files
export { generateApiKey, generateCompanyKeys };