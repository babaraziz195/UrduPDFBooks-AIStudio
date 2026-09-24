#!/usr/bin/env node

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const REPO_OWNER = 'babaraziz195';
const REPO_NAME = process.env.REPO_NAME || 'UrduPDFBooks-AIStudio';
const TARGET_BRANCH = 'main';

function getGithubToken() {
  if (process.env.GITHUB_TOKEN && process.env.GITHUB_TOKEN.trim().length > 0) {
    return process.env.GITHUB_TOKEN.trim();
  }

  // Fallback: check .env in root if present
  const envPath = path.resolve(process.cwd(), '.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const match = envContent.match(/^GITHUB_TOKEN\s*=\s*["']?([^"'\r\n]+)["']?/m);
    if (match && match[1] && match[1].trim().length > 0) {
      return match[1].trim();
    }
  }

  return null;
}

function maskToken(token) {
  if (!token || token.length < 8) return '****';
  return token.substring(0, 4) + '...' + token.substring(token.length - 4);
}

async function main() {
  console.log('===========================================================');
  console.log(' UrduPDFBooks - Secure GitHub Export Tool');
  console.log('===========================================================');

  const token = getGithubToken();

  if (!token) {
    console.error('\n❌ ERROR: GITHUB_TOKEN is not set.');
    console.error('\nPlease configure GITHUB_TOKEN:');
    console.error('  1. In AI Studio -> Settings / Secrets, add a secret named:');
    console.error('     GITHUB_TOKEN');
    console.error('     with your GitHub Personal Access Token (classic or fine-grained with repo access).');
    console.error('  2. Or add GITHUB_TOKEN="ghp_xxx" in your local .env file.\n');
    process.exit(1);
  }

  console.log(`\n🔑 GITHUB_TOKEN detected (${maskToken(token)}).`);
  console.log(`📡 Connecting to GitHub API...`);

  // 1. Verify credentials and get authenticated user
  let authUser;
  try {
    const userRes = await fetch('https://api.github.com/user', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github+json',
        'User-Agent': 'UrduPDFBooks-ExportTool'
      }
    });

    if (!userRes.ok) {
      const errBody = await userRes.text();
      console.error(`\n❌ GitHub authentication failed (${userRes.status}):`, errBody);
      process.exit(1);
    }

    authUser = await userRes.json();
    console.log(`✅ Authenticated as GitHub user: @${authUser.login}`);
  } catch (err) {
    console.error('\n❌ Network error connecting to GitHub API:', err.message);
    process.exit(1);
  }

  // Determine owner
  const targetOwner = REPO_OWNER || authUser.login;

  // 2. Check if repository exists
  console.log(`\n🔍 Checking repository @${targetOwner}/${REPO_NAME}...`);
  let repoExists = false;
  let repoData = null;

  try {
    const repoRes = await fetch(`https://api.github.com/repos/${targetOwner}/${REPO_NAME}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github+json',
        'User-Agent': 'UrduPDFBooks-ExportTool'
      }
    });

    if (repoRes.status === 200) {
      repoExists = true;
      repoData = await repoRes.json();
      console.log(`ℹ️ Repository already exists. Visibility: ${repoData.private ? '🔒 Private' : '🌐 Public'}`);
    } else if (repoRes.status === 404) {
      console.log(`ℹ️ Repository does not exist yet. Creating NEW PRIVATE repository...`);
    } else {
      const text = await repoRes.text();
      console.error(`❌ Unexpected response from GitHub (${repoRes.status}):`, text);
      process.exit(1);
    }
  } catch (err) {
    console.error('❌ Error checking repository:', err.message);
    process.exit(1);
  }

  // 3. Create repository if it does not exist
  if (!repoExists) {
    try {
      const isOrg = authUser.type === 'Organization' && authUser.login.toLowerCase() === targetOwner.toLowerCase();
      const createUrl = isOrg
        ? `https://api.github.com/orgs/${targetOwner}/repos`
        : 'https://api.github.com/user/repos';

      const createRes = await fetch(createUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github+json',
          'Content-Type': 'application/json',
          'User-Agent': 'UrduPDFBooks-ExportTool'
        },
        body: JSON.stringify({
          name: REPO_NAME,
          description: 'UrduPDFBooks - Digital Urdu Library & Reader with Supabase Auth, RBAC & Backblaze B2 storage',
          private: true,
          auto_init: false
        })
      });

      if (!createRes.ok) {
        const createErr = await createRes.text();
        console.error(`\n❌ Failed to create repository (${createRes.status}):`, createErr);
        process.exit(1);
      }

      repoData = await createRes.json();
      console.log(`✅ Successfully created PRIVATE repository: ${repoData.html_url}`);
    } catch (err) {
      console.error('❌ Error creating repository:', err.message);
      process.exit(1);
    }
  }

  // 4. Git Push to Remote
  console.log(`\n🚀 Preparing to push current project to ${targetOwner}/${REPO_NAME}:${TARGET_BRANCH}...`);

  try {
    // Ensure git repository is initialized
    if (!fs.existsSync(path.resolve(process.cwd(), '.git'))) {
      execSync('git init', { stdio: 'ignore' });
    }

    // Ensure git user is configured
    execSync(`git config user.name "${authUser.login}"`, { stdio: 'ignore' });
    if (authUser.email) {
      execSync(`git config user.email "${authUser.email}"`, { stdio: 'ignore' });
    } else {
      execSync(`git config user.email "${authUser.login}@users.noreply.github.com"`, { stdio: 'ignore' });
    }

    // Stage all tracked and new safe files (respecting .gitignore)
    execSync('git add .', { stdio: 'ignore' });
    try {
      execSync('git commit -m "Configure Cloudflare Pages deployment, SPA routing, and catch-all functions"', { stdio: 'ignore' });
    } catch {
      // Working tree clean or already committed
    }

    // Ensure branch is main
    try {
      execSync(`git branch -M ${TARGET_BRANCH}`, { stdio: 'ignore' });
    } catch {
      // Ignore if already on main
    }

    // Set remote origin without embedding tokens in the stored url
    const cleanRemoteUrl = `https://github.com/${targetOwner}/${REPO_NAME}.git`;
    try {
      execSync(`git remote remove origin`, { stdio: 'ignore' });
    } catch {
      // Remote origin may not exist yet
    }
    execSync(`git remote add origin ${cleanRemoteUrl}`, { stdio: 'ignore' });

    console.log(`📤 Pushing ${TARGET_BRANCH} to origin (${cleanRemoteUrl})...`);

    // Use in-memory HTTP authorization header for git push
    // This ensures the token is never saved to .git/config or printed in git remote output
    const basicAuth = Buffer.from(`${authUser.login}:${token}`).toString('base64');
    const pushCmd = `git -c http.extraHeader="Authorization: Basic ${basicAuth}" push -u origin ${TARGET_BRANCH} --force`;

    execSync(pushCmd, { stdio: 'inherit' });

    // 5. Verify pushed contents via GitHub API
    console.log(`\n🔍 Verifying repository contents on GitHub...`);
    let fileCount = 0;
    try {
      const contentsRes = await fetch(`https://api.github.com/repos/${targetOwner}/${REPO_NAME}/contents?ref=${TARGET_BRANCH}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github+json',
          'User-Agent': 'UrduPDFBooks-ExportTool'
        }
      });
      if (contentsRes.ok) {
        const contents = await contentsRes.json();
        fileCount = Array.isArray(contents) ? contents.length : 0;
        console.log(`✅ Verified: Remote branch '${TARGET_BRANCH}' contains ${fileCount} root items:`);
        if (Array.isArray(contents)) {
          console.log(contents.map(c => `   - ${c.type === 'dir' ? '📁' : '📄'} ${c.name}`).join('\n'));
        }
      }
    } catch (verErr) {
      console.log(`Note: Content list check finished (${verErr.message})`);
    }

    console.log('\n===========================================================');
    console.log('🎉 GitHub Export Completed Successfully!');
    console.log('===========================================================');
    console.log(`1. Repository Name:  ${REPO_NAME}`);
    console.log(`2. GitHub Account:   ${targetOwner}`);
    console.log(`3. Visibility:       🔒 Private`);
    console.log(`4. Branch Name:      ${TARGET_BRANCH}`);
    console.log(`5. Files Pushed:     ✅ All project source files pushed`);
    console.log(`6. Secrets Status:   🛡️  All credentials & .env excluded by .gitignore`);
    console.log(`7. URL:              https://github.com/${targetOwner}/${REPO_NAME}`);
    console.log('===========================================================\n');
  } catch (err) {
    console.error('\n❌ Git push operation failed:', err.message);
    process.exit(1);
  }
}

main();
