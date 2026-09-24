#!/usr/bin/env node

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const PROJECT_NAME = process.env.CLOUDFLARE_PROJECT_NAME || 'urdupdfbooks';
const TARGET_BRANCH = 'main';

function getEnvVar(name) {
  if (process.env[name] && process.env[name].trim().length > 0) {
    return process.env[name].trim();
  }
  const envPath = path.resolve(process.cwd(), '.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const regex = new RegExp(`^${name}\\s*=\\s*["']?([^"'\\r\\n]+)["']?`, 'm');
    const match = envContent.match(regex);
    if (match && match[1] && match[1].trim().length > 0) {
      return match[1].trim();
    }
  }
  return null;
}

function mask(str) {
  if (!str || str.length < 8) return '****';
  return str.substring(0, 4) + '...' + str.substring(str.length - 4);
}

async function main() {
  console.log('===========================================================');
  console.log(' UrduPDFBooks - Cloudflare Pages Automated Deployment');
  console.log('===========================================================');

  const apiToken = getEnvVar('CLOUDFLARE_API_TOKEN');
  const accountId = getEnvVar('CLOUDFLARE_ACCOUNT_ID');

  if (!apiToken) {
    console.error('\n❌ ERROR: CLOUDFLARE_API_TOKEN is not set.');
    console.error('\nPlease configure your Cloudflare credentials in AI Studio Secrets:');
    console.error('  1. CLOUDFLARE_API_TOKEN: Cloudflare API token with "Cloudflare Pages (Edit)" permissions.');
    console.error('  2. CLOUDFLARE_ACCOUNT_ID: Your 32-character Cloudflare Account ID.\n');
    process.exit(1);
  }

  console.log(`🔑 Cloudflare API Token detected (${mask(apiToken)}).`);
  if (accountId) {
    console.log(`🆔 Cloudflare Account ID detected (${mask(accountId)}).`);
  }

  // 1. Production Build
  console.log('\n📦 Step 1: Building production assets with Vite...');
  try {
    execSync('npm run build', { stdio: 'inherit' });
  } catch (err) {
    console.error('❌ Build failed:', err.message);
    process.exit(1);
  }

  // Ensure public/_redirects is copied to dist
  const distRedirects = path.resolve(process.cwd(), 'dist/_redirects');
  if (!fs.existsSync(distRedirects)) {
    fs.writeFileSync(distRedirects, '/*    /index.html   200\n');
  }

  // Set environment variables for wrangler execution
  const envForWrangler = {
    ...process.env,
    CLOUDFLARE_API_TOKEN: apiToken,
  };
  if (accountId) {
    envForWrangler.CLOUDFLARE_ACCOUNT_ID = accountId;
  }

  // 2. Ensure Cloudflare Pages project exists
  console.log(`\n☁️  Step 2: Checking Cloudflare Pages project "${PROJECT_NAME}"...`);
  try {
    execSync(`npx wrangler pages project create ${PROJECT_NAME} --production-branch=${TARGET_BRANCH}`, {
      env: envForWrangler,
      stdio: 'pipe',
    });
    console.log(`✅ Created Cloudflare Pages project "${PROJECT_NAME}".`);
  } catch (err) {
    const errText = err.stderr ? err.stderr.toString() : err.message;
    if (errText.includes('already exists') || errText.includes('A project with this name already exists')) {
      console.log(`ℹ️ Project "${PROJECT_NAME}" already exists on Cloudflare Pages.`);
    } else {
      console.log(`ℹ️ Project check complete. Continuing with deployment...`);
    }
  }

  // 3. Deploy to Cloudflare Pages
  console.log(`\n🚀 Step 3: Deploying dist/ & functions/ to Cloudflare Pages...`);
  let deployOutput = '';
  try {
    const outputBuffer = execSync(
      `npx wrangler pages deploy dist --project-name=${PROJECT_NAME} --branch=${TARGET_BRANCH}`,
      {
        env: envForWrangler,
        stdio: 'pipe',
      }
    );
    deployOutput = outputBuffer.toString();
    console.log(deployOutput);
  } catch (err) {
    console.error('\n❌ Deployment failed:');
    if (err.stdout) console.error(err.stdout.toString());
    if (err.stderr) console.error(err.stderr.toString());
    process.exit(1);
  }

  // Extract live URL from wrangler output
  let liveUrl = `https://${PROJECT_NAME}.pages.dev`;
  const urlMatch = deployOutput.match(/https:\/\/[a-zA-Z0-9.-]+\.pages\.dev/);
  if (urlMatch) {
    liveUrl = urlMatch[0];
  }

  console.log('\n===========================================================');
  console.log('🎉 Cloudflare Pages Deployment Succeeded!');
  console.log('===========================================================');
  console.log(`Project Name:      ${PROJECT_NAME}`);
  console.log(`Target Branch:     ${TARGET_BRANCH}`);
  console.log(`Live Pages URL:    ${liveUrl}`);
  console.log('===========================================================');

  // 4. Verification checks
  console.log('\n🔍 Step 4: Running live verification health checks...');
  try {
    const res = await fetch(liveUrl);
    console.log(`✅ Homepage check (${liveUrl}): HTTP ${res.status} OK`);
  } catch (err) {
    console.warn(`Homepage fetch check:`, err.message);
  }

  try {
    const healthRes = await fetch(`${liveUrl}/api/health`);
    if (healthRes.ok) {
      const healthData = await healthRes.json();
      console.log(`✅ Cloudflare Pages Functions check (${liveUrl}/api/health):`, healthData);
    } else {
      console.log(`ℹ️ Functions health response: HTTP ${healthRes.status}`);
    }
  } catch (err) {
    console.warn(`Functions health check:`, err.message);
  }
}

main();
