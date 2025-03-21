const fs = require('fs');
const path = require('path');
const { createCanvas, loadImage, registerFont } = require('canvas');

// Ensure the public/images directory exists
const imagesDir = path.join(__dirname, '../public/images');
if (!fs.existsSync(imagesDir)) {
  fs.mkdirSync(imagesDir, { recursive: true });
}

// Set up canvas dimensions (1200x630 is recommended for Open Graph images)
const width = 1200;
const height = 630;
const canvas = createCanvas(width, height);
const context = canvas.getContext('2d');

// Try to register a font if available
try {
  registerFont(path.join(__dirname, '../src/assets/fonts/Inter-Bold.ttf'), { family: 'Inter', weight: 'bold' });
} catch (error) {
  console.warn('Could not load custom font, using system font instead:', error.message);
}

async function generateOgImage() {
  // Create gradient background
  const gradient = context.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, '#2563eb'); // blue-600
  gradient.addColorStop(1, '#4338ca'); // indigo-700
  context.fillStyle = gradient;
  context.fillRect(0, 0, width, height);

  // Add logo if available
  try {
    const logo = await loadImage(path.join(__dirname, '../src/assets/logo.png'));
    const logoWidth = 200;
    const logoHeight = (logo.height / logo.width) * logoWidth;
    context.drawImage(logo, (width - logoWidth) / 2, 120, logoWidth, logoHeight);
  } catch (error) {
    console.warn('Could not load logo, using text instead:', error.message);
    
    // Draw site name as text if logo is not available
    context.font = 'bold 72px "Inter", Arial, sans-serif';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillStyle = '#ffffff';
    context.fillText('HandyWriterz', width / 2, 160);
  }

  // Add tagline
  context.font = 'bold 48px "Inter", Arial, sans-serif';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillStyle = '#ffffff';
  context.fillText('Professional Academic Writing Services', width / 2, height / 2);

  // Add subtitle
  context.font = '32px "Inter", Arial, sans-serif';
  context.fillText('Expert assistance for your academic success', width / 2, height / 2 + 80);

  // Save the image
  const buffer = canvas.toBuffer('image/jpeg');
  fs.writeFileSync(path.join(imagesDir, 'og-default.jpg'), buffer);
  console.log('Open Graph image generated successfully!');
}

generateOgImage().catch(error => {
  console.error('Failed to generate Open Graph image:', error);
  process.exit(1);
}); 