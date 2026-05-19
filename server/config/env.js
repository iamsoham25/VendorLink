// config/env.js - Environment variable validation
require('dotenv').config();

const requiredEnvVars = [
  // JWT_SECRET is optional for demo - uses default if not provided
];

const defaultValues = {
  'JWT_SECRET': 'vendorlink-demo-secret-key-2024',
};

const optionalEnvVars = {
  'PORT': '3000',
  'NODE_ENV': 'development',
  'LOG_LEVEL': 'info',
  'CORS_ORIGIN': '*',
  'REDIS_HOST': 'localhost',
  'REDIS_PORT': '6379',
  'EMAIL_SERVICE': 'gmail',
  'EMAIL_USER': '',
  'EMAIL_PASS': '',
};

function validateEnv() {
  console.log('\n📋 Validating environment variables...');
  
  const missing = [];
  
  requiredEnvVars.forEach(varName => {
    if (!process.env[varName]) {
      missing.push(varName);
    }
  });

  if (missing.length > 0) {
    console.error('\n❌ Missing required environment variables:');
    missing.forEach(varName => {
      console.error(`   • ${varName}`);
    });
    console.error('\n📝 Please add these to your .env file\n');
    process.exit(1);
  }

  // Set defaults for demo mode
  Object.entries(defaultValues).forEach(([key, defaultValue]) => {
    if (!process.env[key]) {
      process.env[key] = defaultValue;
      console.log(`⚠️  Using default ${key} for demo mode`);
    }
  });

  // Set optional defaults
  Object.entries(optionalEnvVars).forEach(([key, defaultValue]) => {
    if (!process.env[key]) {
      process.env[key] = defaultValue;
    }
  });

  console.log('✅ All required environment variables validated\n');
}

module.exports = { validateEnv };
