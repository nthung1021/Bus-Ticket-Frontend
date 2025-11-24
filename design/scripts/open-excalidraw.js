#!/usr/bin/env node

const open = require('open');
const chalk = require('chalk');
const path = require('path');

/**
 * Excalidraw Automation Script
 * Opens Excalidraw with predefined templates for wireframing
 */

const EXCALIDRAW_BASE_URL = 'https://excalidraw.com';

// Predefined templates for different components
const TEMPLATES = {
  dashboard: {
    name: 'Dashboard Layout',
    description: 'Admin/User dashboard wireframe template',
    url: `${EXCALIDRAW_BASE_URL}#room=dashboard-template,wireframe-mode`
  },
  components: {
    name: 'Component Wireframes',
    description: 'Individual component mockup template',
    url: `${EXCALIDRAW_BASE_URL}#room=components-template,wireframe-mode`
  },
  flows: {
    name: 'User Flow Diagrams',
    description: 'User journey and interaction flow template',
    url: `${EXCALIDRAW_BASE_URL}#room=user-flows,diagram-mode`
  },
  mobile: {
    name: 'Mobile Layout',
    description: 'Mobile responsive wireframe template',
    url: `${EXCALIDRAW_BASE_URL}#room=mobile-layout,responsive-mode`
  }
};

// Configuration for wireframe guidelines
const WIREFRAME_CONFIG = {
  artboard: {
    width: 1440,
    height: 1024,
    grid: 8
  },
  colors: {
    background: '#FFFFFF',
    borders: '#E5E7EB',
    text: '#374151',
    primary: '#5B5FFF',
    accent: '#4ADE80'
  },
  typography: {
    headings: 'font-bold text-lg',
    body: 'font-normal text-base',
    captions: 'font-normal text-sm'
  }
};

async function openExcalidraw(template = 'dashboard') {
  console.log(chalk.blue('🎨 Bus Ticket Platform - Design Tools'));
  console.log(chalk.gray('─'.repeat(50)));
  
  const selectedTemplate = TEMPLATES[template];
  
  if (!selectedTemplate) {
    console.log(chalk.red('❌ Template not found!'));
    console.log(chalk.yellow('Available templates:'));
    Object.keys(TEMPLATES).forEach(key => {
      const tmpl = TEMPLATES[key];
      console.log(chalk.cyan(`  ${key}: ${tmpl.name} - ${tmpl.description}`));
    });
    return;
  }

  console.log(chalk.green(`🚀 Opening ${selectedTemplate.name}...`));
  console.log(chalk.gray(`   ${selectedTemplate.description}`));
  
  // Create wireframe instructions
  console.log(chalk.yellow('\n📐 Wireframe Guidelines:'));
  console.log(chalk.gray(`• Canvas size: ${WIREFRAME_CONFIG.artboard.width}x${WIREFRAME_CONFIG.artboard.height}px`));
  console.log(chalk.gray(`• Grid: ${WIREFRAME_CONFIG.artboard.grid}px`));
  console.log(chalk.gray('• Use primary color (#5B5FFF) for interactive elements'));
  console.log(chalk.gray('• Use accent color (#4ADE80) for success states'));
  console.log(chalk.gray('• Maintain consistent spacing (16px, 24px, 32px)'));
  
  // Template file mapping
  const templateFiles = {
    dashboard: 'admin-dashboard-template.excalidraw',
    admin: 'admin-dashboard-template.excalidraw', 
    user: 'user-dashboard-template.excalidraw',
    components: 'component-template.excalidraw',
    component: 'component-template.excalidraw',
    flows: null, // Will open blank for user flows
    flow: null
  };
  
  const templateFile = templateFiles[selectedTemplate.type];
  
  try {
    if (templateFile) {
      // Open template file with Excalidraw
      const templatePath = path.join(__dirname, '..', 'wireframes', templateFile);
      
      // Check if template exists
      if (require('fs').existsSync(templatePath)) {
        console.log(chalk.blue(`\n🎨 Opening ${selectedTemplate.name} template...`));
        
        // Open the template file directly
        await open(templatePath);
        console.log(chalk.green('\n✅ Template opened successfully!'));
        
        console.log(chalk.cyan('\n📝 Template Instructions:'));
        console.log('1. The template is pre-loaded with wireframe structure');
        console.log('2. Modify elements as needed for your design');
        console.log('3. Add/remove components following design system');
        console.log('4. Export as PNG when complete (File → Export image)');
        console.log('5. Save to /design/mockups/ folder');
        console.log('6. Update wireframes.md with new designs');
      } else {
        throw new Error(`Template file not found: ${templatePath}`);
      }
    } else {
      // Open blank Excalidraw for user flows
      console.log(chalk.blue(`\n🎨 Opening blank canvas for ${selectedTemplate.name}...`));
      await open(EXCALIDRAW_BASE_URL);
      console.log(chalk.green('\n✅ Excalidraw opened successfully!'));
      
      console.log(chalk.cyan('\n📝 Setup Instructions:'));
      console.log('1. Set canvas size to 1440x1024px (if needed)');
      console.log('2. Enable grid: View → Show grid (20px spacing)');
      console.log('3. Create your user flow following the design system');
      console.log('4. Use arrows to connect screens/states');
      console.log('5. Export as PNG when complete');
      console.log('6. Save to /design/mockups/ folder');
    }
    
  } catch (error) {
    console.error(chalk.red('❌ Failed to open template:'), error.message);
    console.log(chalk.yellow('🔄 Opening blank Excalidraw as fallback...'));
    
    try {
      await open(EXCALIDRAW_BASE_URL);
      console.log(chalk.green('✅ Fallback successful!'));
    } catch (fallbackError) {
      console.log(chalk.yellow(`🌐 Manual URL: ${EXCALIDRAW_BASE_URL}`));
    }
  }
}

// Command line interface
const args = process.argv.slice(2);
const template = args[0] || 'dashboard';
const command = args.includes('--help') || args.includes('-h');

if (command) {
  console.log(chalk.blue('🎨 Excalidraw Automation Script'));
  console.log(chalk.gray('─'.repeat(40)));
  console.log('\nUsage:');
  console.log('  npm run excalidraw [template]');
  console.log('\nTemplates:');
  Object.keys(TEMPLATES).forEach(key => {
    const tmpl = TEMPLATES[key];
    console.log(chalk.cyan(`  ${key.padEnd(12)} ${tmpl.name}`));
    console.log(chalk.gray(`  ${' '.repeat(14)} ${tmpl.description}`));
  });
  console.log('\nExamples:');
  console.log('  npm run excalidraw dashboard');
  console.log('  npm run excalidraw components');
  console.log('  npm run excalidraw mobile');
} else {
  openExcalidraw(template);
}

module.exports = {
  openExcalidraw,
  TEMPLATES,
  WIREFRAME_CONFIG
};