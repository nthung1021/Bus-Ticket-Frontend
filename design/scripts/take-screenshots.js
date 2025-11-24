#!/usr/bin/env node

const puppeteer = require('puppeteer');
const chalk = require('chalk');
const fs = require('fs').promises;
const path = require('path');

/**
 * Screenshot Generation Script
 * Automatically captures dashboard screenshots for documentation
 */

const SCREENSHOT_CONFIG = {
  viewport: {
    width: 1440,
    height: 900,
    deviceScaleFactor: 2
  },
  baseUrl: 'http://localhost:8000',
  outputDir: path.join(__dirname, '..', 'mockups'),
  delay: 2000, // Wait time for page load
  formats: ['png'],
  quality: 90
};

const SCREENSHOT_TARGETS = [
  {
    name: 'admin-dashboard-light',
    path: '/admin',
    theme: 'light',
    description: 'Admin Dashboard - Light Mode'
  },
  {
    name: 'admin-dashboard-dark',
    path: '/admin',
    theme: 'dark',
    description: 'Admin Dashboard - Dark Mode'
  },
  {
    name: 'user-dashboard-light',
    path: '/user',
    theme: 'light',
    description: 'User Dashboard - Light Mode'
  },
  {
    name: 'user-dashboard-dark',
    path: '/user',
    theme: 'dark',
    description: 'User Dashboard - Dark Mode'
  },
  {
    name: 'login-page',
    path: '/login',
    theme: 'light',
    description: 'Login Page'
  },
  {
    name: 'signup-page',
    path: '/signup',
    theme: 'light',
    description: 'Sign Up Page'
  }
];

async function ensureOutputDirectory() {
  try {
    await fs.access(SCREENSHOT_CONFIG.outputDir);
  } catch {
    await fs.mkdir(SCREENSHOT_CONFIG.outputDir, { recursive: true });
    console.log(chalk.green(`📁 Created output directory: ${SCREENSHOT_CONFIG.outputDir}`));
  }
}

async function setTheme(page, theme) {
  if (theme === 'dark') {
    await page.evaluate(() => {
      localStorage.setItem('theme', 'dark');
      document.documentElement.classList.add('dark');
    });
  } else {
    await page.evaluate(() => {
      localStorage.setItem('theme', 'light');
      document.documentElement.classList.remove('dark');
    });
  }
}

async function takeScreenshot(browser, target) {
  const page = await browser.newPage();
  
  try {
    await page.setViewport(SCREENSHOT_CONFIG.viewport);
    
    console.log(chalk.blue(`📸 Capturing: ${target.description}...`));
    
    // Navigate to page
    const url = `${SCREENSHOT_CONFIG.baseUrl}${target.path}`;
    await page.goto(url, { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });
    
    // Set theme
    await setTheme(page, target.theme);
    
    // Wait for theme to apply and content to load
    await page.waitForTimeout(SCREENSHOT_CONFIG.delay);
    
    // Hide scrollbars for cleaner screenshots
    await page.addStyleTag({
      content: `
        ::-webkit-scrollbar { display: none; }
        * { scrollbar-width: none; }
        body { overflow-x: hidden; }
      `
    });
    
    // Take screenshot in multiple formats
    for (const format of SCREENSHOT_CONFIG.formats) {
      const filename = `${target.name}.${format}`;
      const filepath = path.join(SCREENSHOT_CONFIG.outputDir, filename);
      
      const options = {
        path: filepath,
        type: format,
        fullPage: true
      };
      
      if (format === 'webp') {
        options.quality = SCREENSHOT_CONFIG.quality;
      }
      
      await page.screenshot(options);
      console.log(chalk.green(`  ✅ Saved: ${filename}`));
    }
    
  } catch (error) {
    console.error(chalk.red(`  ❌ Failed to capture ${target.name}:`), error.message);
  } finally {
    await page.close();
  }
}

async function generateScreenshots() {
  console.log(chalk.blue('📸 Bus Ticket Platform - Screenshot Generator'));
  console.log(chalk.gray('─'.repeat(50)));
  
  await ensureOutputDirectory();
  
  console.log(chalk.yellow(`🚀 Starting browser...`));
  const browser = await puppeteer.launch({
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-web-security',
      '--disable-features=VizDisplayCompositor'
    ]
  });
  
  try {
    console.log(chalk.green(`✅ Browser launched successfully`));
    console.log(chalk.cyan(`📍 Target URL: ${SCREENSHOT_CONFIG.baseUrl}`));
    
    for (const target of SCREENSHOT_TARGETS) {
      await takeScreenshot(browser, target);
    }
    
    console.log(chalk.green('\n🎉 All screenshots captured successfully!'));
    console.log(chalk.cyan(`📁 Output directory: ${SCREENSHOT_CONFIG.outputDir}`));
    
    // Generate index file
    await generateScreenshotIndex();
    
  } catch (error) {
    console.error(chalk.red('❌ Screenshot generation failed:'), error.message);
  } finally {
    await browser.close();
    console.log(chalk.gray('🔒 Browser closed'));
  }
}

async function generateScreenshotIndex() {
  const indexContent = `# Dashboard Screenshots

Generated on: ${new Date().toISOString()}

## Available Screenshots

${SCREENSHOT_TARGETS.map(target => 
  `### ${target.description}
- **Light Mode**: ![${target.description}](${target.name}.png)
- **WebP Format**: [${target.name}.webp](${target.name}.webp)
- **Path**: \`${target.path}\`
- **Theme**: \`${target.theme}\`

`).join('')}

## Usage Instructions

1. **For Documentation**: Use PNG format for README files and documentation
2. **For Web**: Use WebP format for better compression in web applications
3. **For Design Reviews**: Use PNG format for sharing with stakeholders

## Updating Screenshots

To regenerate all screenshots:
\`\`\`bash
npm run screenshot
\`\`\`

To capture specific pages, modify the SCREENSHOT_TARGETS array in \`scripts/take-screenshots.js\`.

---

*Auto-generated by screenshot generator*
`;

  const indexPath = path.join(SCREENSHOT_CONFIG.outputDir, 'README.md');
  await fs.writeFile(indexPath, indexContent, 'utf8');
  console.log(chalk.green(`📄 Generated screenshot index: README.md`));
}

// Command line interface
const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h')) {
  console.log(chalk.blue('📸 Screenshot Generator'));
  console.log(chalk.gray('─'.repeat(30)));
  console.log('\nUsage:');
  console.log('  npm run screenshot');
  console.log('\nRequirements:');
  console.log('  • Next.js dev server running on http://localhost:8000');
  console.log('  • All dashboard pages accessible');
  console.log('\nOutput:');
  console.log(`  • Screenshots saved to: ${SCREENSHOT_CONFIG.outputDir}`);
  console.log('  • Formats: PNG (documentation) + WebP (web optimized)');
  console.log('\nConfiguration:');
  console.log(`  • Viewport: ${SCREENSHOT_CONFIG.viewport.width}x${SCREENSHOT_CONFIG.viewport.height}`);
  console.log(`  • Scale: ${SCREENSHOT_CONFIG.viewport.deviceScaleFactor}x (Retina)`);
  console.log('\nTargets:');
  SCREENSHOT_TARGETS.forEach(target => {
    console.log(chalk.cyan(`  ${target.path.padEnd(12)} ${target.description} (${target.theme})`));
  });
} else {
  generateScreenshots().catch(error => {
    console.error(chalk.red('💥 Unhandled error:'), error);
    process.exit(1);
  });
}

module.exports = {
  generateScreenshots,
  SCREENSHOT_CONFIG,
  SCREENSHOT_TARGETS
};