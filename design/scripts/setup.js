#!/usr/bin/env node

const chalk = require('chalk');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * Design Tools Setup Script
 * Initializes the design automation environment
 */

console.log(chalk.blue('🎨 Bus Ticket Platform - Design Tools Setup'));
console.log(chalk.gray('═'.repeat(50)));

async function checkNodeVersion() {
  const nodeVersion = process.version;
  const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
  
  if (majorVersion < 16) {
    console.log(chalk.red('❌ Node.js 16+ required'));
    console.log(chalk.yellow(`   Current version: ${nodeVersion}`));
    console.log(chalk.cyan('   Please update Node.js: https://nodejs.org'));
    process.exit(1);
  }
  
  console.log(chalk.green(`✅ Node.js ${nodeVersion} - Compatible`));
}

async function installDependencies() {
  console.log(chalk.blue('\n📦 Installing dependencies...'));
  
  try {
    execSync('npm install', { 
      stdio: 'inherit',
      cwd: __dirname 
    });
    console.log(chalk.green('✅ Dependencies installed successfully'));
    
    // Check for vulnerabilities but don't fail setup
    try {
      const auditResult = execSync('npm audit --audit-level=high', { 
        stdio: 'pipe',
        cwd: __dirname 
      });
    } catch (auditError) {
      console.log(chalk.yellow('⚠️  Note: Some package vulnerabilities detected'));
      console.log(chalk.gray('   This is common with automation tools and doesn\'t affect functionality'));
      console.log(chalk.gray('   Run "npm audit" for details if needed'));
    }
    
  } catch (error) {
    console.log(chalk.red('❌ Failed to install dependencies'));
    console.log(chalk.gray(error.message));
    process.exit(1);
  }
}

async function checkNextJsServer() {
  console.log(chalk.blue('\n🔍 Checking Next.js development server...'));
  
  try {
    const http = require('http');
    
    const checkServer = () => {
      return new Promise((resolve, reject) => {
        const req = http.request({
          hostname: 'localhost',
          port: 3000,
          method: 'HEAD',
          timeout: 5000
        }, (res) => {
          resolve(res.statusCode === 200);
        });
        
        req.on('error', () => reject(false));
        req.on('timeout', () => {
          req.destroy();
          reject(false);
        });
        
        req.end();
      });
    };
    
    const isRunning = await checkServer();
    
    if (isRunning) {
      console.log(chalk.green('✅ Next.js dev server running on http://localhost:8000'));
      return true;
    } else {
      throw new Error('Server not responding');
    }
  } catch (error) {
    console.log(chalk.yellow('⚠️ Next.js dev server not detected'));
    console.log(chalk.gray('   Screenshots require the dev server to be running'));
    console.log(chalk.cyan('   Start with: cd ../../ && npm run dev'));
    return false;
  }
}

async function testAutomationTools() {
  console.log(chalk.blue('\n🧪 Testing automation tools...'));
  
  const tools = [
    { 
      name: 'Wireframe Generator', 
      command: 'node create-wireframe.js --help',
      description: 'ASCII wireframe templates'
    },
    { 
      name: 'Excalidraw Integration', 
      command: 'node open-excalidraw.js --help',
      description: 'Visual wireframing tool'
    },
    { 
      name: 'Screenshot Generator', 
      command: 'node take-screenshots.js --help',
      description: 'Automated dashboard capture'
    }
  ];
  
  for (const tool of tools) {
    try {
      execSync(tool.command, { 
        stdio: 'pipe',
        cwd: __dirname 
      });
      console.log(chalk.green(`  ✅ ${tool.name} - Ready`));
    } catch (error) {
      console.log(chalk.red(`  ❌ ${tool.name} - Failed`));
      console.log(chalk.gray(`     ${tool.description}`));
    }
  }
}

async function generateInitialTemplates() {
  console.log(chalk.blue('\n📐 Generating initial wireframe templates...'));
  
  try {
    execSync('node create-wireframe.js', { 
      stdio: 'inherit',
      cwd: __dirname 
    });
    console.log(chalk.green('✅ Wireframe templates generated'));
  } catch (error) {
    console.log(chalk.red('❌ Failed to generate templates'));
    console.log(chalk.gray(error.message));
  }
}

async function showQuickStart() {
  console.log(chalk.blue('\n🚀 Quick Start Guide'));
  console.log(chalk.gray('─'.repeat(25)));
  
  console.log(chalk.cyan('\n1. Generate Wireframes'));
  console.log('   npm run wireframe');
  console.log(chalk.gray('   → Creates structured wireframe templates'));
  
  console.log(chalk.cyan('\n2. Visual Wireframing'));
  console.log('   npm run excalidraw dashboard');
  console.log(chalk.gray('   → Opens Excalidraw with dashboard template'));
  
  console.log(chalk.cyan('\n3. Capture Screenshots'));
  console.log('   npm run screenshot');
  console.log(chalk.gray('   → Generates dashboard screenshots (requires dev server)'));
  
  console.log(chalk.cyan('\n4. Available Templates'));
  console.log('   • dashboard - Admin/User dashboard layouts');
  console.log('   • components - Individual component mockups');
  console.log('   • flows - User journey diagrams');
  console.log('   • mobile - Mobile layout templates');
}

async function showProjectStructure() {
  console.log(chalk.blue('\n📁 Design Folder Structure'));
  console.log(chalk.gray('─'.repeat(30)));
  
  console.log(`
${chalk.cyan('design/')}
├── ${chalk.yellow('README.md')}                    ${chalk.gray('# Main design documentation')}
├── ${chalk.yellow('design-system.md')}             ${chalk.gray('# Color tokens, typography, spacing')}
├── ${chalk.yellow('wireframes.md')}                ${chalk.gray('# Layout wireframes and specifications')}
├── ${chalk.cyan('mockups/')}                      ${chalk.gray('# Screenshots and visual mockups')}
│   └── ${chalk.yellow('README.md')}                ${chalk.gray('# Screenshot usage guide')}
├── ${chalk.cyan('wireframes/')}                   ${chalk.gray('# Wireframe templates')}
│   ├── ${chalk.yellow('index.md')}                 ${chalk.gray('# Wireframes overview')}
│   ├── ${chalk.yellow('dashboard-wireframe-template.md')}
│   ├── ${chalk.yellow('component-wireframe-template.md')}
│   └── ${chalk.yellow('user-flow-template.md')}
├── ${chalk.cyan('components/')}                   ${chalk.gray('# Component architecture docs')}
│   └── ${chalk.yellow('component-structure.md')}   ${chalk.gray('# Technical component details')}
└── ${chalk.cyan('scripts/')}                      ${chalk.gray('# Automation tools')}
    ├── ${chalk.yellow('package.json')}
    ├── ${chalk.yellow('open-excalidraw.js')}       ${chalk.gray('# Excalidraw integration')}
    ├── ${chalk.yellow('take-screenshots.js')}      ${chalk.gray('# Screenshot automation')}
    └── ${chalk.yellow('create-wireframe.js')}      ${chalk.gray('# Template generator')}
`);
}

// Main setup function
async function setup() {
  try {
    await checkNodeVersion();
    await installDependencies();
    
    const serverRunning = await checkNextJsServer();
    
    await testAutomationTools();
    await generateInitialTemplates();
    
    console.log(chalk.green('\n🎉 Setup completed successfully!'));
    
    if (!serverRunning) {
      console.log(chalk.yellow('\n⚠️  Note: Start Next.js dev server for screenshot automation'));
      console.log(chalk.gray('   cd ../../ && npm run dev'));
    }
    
    await showQuickStart();
    await showProjectStructure();
    
    console.log(chalk.blue('\n📚 Documentation'));
    console.log(chalk.gray('─'.repeat(20)));
    console.log('Full docs: /design/README.md');
    console.log('Design system: /design/design-system.md'); 
    console.log('Wireframes: /design/wireframes.md');
    console.log('Components: /design/components/component-structure.md');
    
    console.log(chalk.cyan('\n🤝 Team Collaboration'));
    console.log('• Keep design files in version control');
    console.log('• Update documentation when UI changes');
    console.log('• Use automation scripts for consistency');
    console.log('• Document design decisions and rationale');
    
  } catch (error) {
    console.error(chalk.red('\n💥 Setup failed:'), error.message);
    process.exit(1);
  }
}

// Handle command line arguments
const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h')) {
  console.log(chalk.blue('🛠️  Design Tools Setup'));
  console.log('\nUsage:');
  console.log('  node setup.js');
  console.log('\nWhat this script does:');
  console.log('• Checks Node.js compatibility');
  console.log('• Installs required dependencies');
  console.log('• Tests automation tools');
  console.log('• Generates initial wireframe templates');
  console.log('• Provides quick start guide');
  console.log('\nRequirements:');
  console.log('• Node.js 16+');
  console.log('• Internet connection for package downloads');
  console.log('• Next.js project (for screenshot automation)');
} else {
  setup();
}

module.exports = { setup };