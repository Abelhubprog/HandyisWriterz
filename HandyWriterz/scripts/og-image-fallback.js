const fs = require('fs');
const path = require('path');

// Ensure the public/images directory exists
const imagesDir = path.join(__dirname, '../public/images');
if (!fs.existsSync(imagesDir)) {
  fs.mkdirSync(imagesDir, { recursive: true });
}

// Function to create fallback OG image
function createFallbackOgImage() {
  try {
    // Check if the OG image already exists
    const ogImagePath = path.join(imagesDir, 'og-default.jpg');
    if (fs.existsSync(ogImagePath)) {
      console.log('OG image already exists, skipping fallback creation.');
      return;
    }

    // Create a text file with info about the missing image
    fs.writeFileSync(
      path.join(imagesDir, 'og-image-info.txt'),
      'This file indicates that an Open Graph image should be placed here. For production, please add a static og-default.jpg image to this directory.'
    );

    // For Vercel deployment, we'll copy a simple HTML-based image (since we can't generate one without canvas)
    const htmlContent = `
      <svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
        <rect width="1200" height="630" fill="#2563eb"/>
        <text x="600" y="300" font-family="Arial" font-size="60" fill="white" text-anchor="middle">HandyWriterz</text>
        <text x="600" y="380" font-family="Arial" font-size="40" fill="white" text-anchor="middle">Professional Academic Writing Services</text>
      </svg>
    `;
    
    // Write the SVG to a file
    fs.writeFileSync(path.join(imagesDir, 'og-default.svg'), htmlContent.trim());
    
    console.log('Fallback OG image (SVG) created successfully.');
    
    // If deploying without an actual JPEG, note that SVG isn't ideal for OG images
    console.log('Note: For production, please replace this with a proper JPEG image.');
  } catch (error) {
    console.error('Failed to create fallback OG image:', error);
  }
}

createFallbackOgImage(); 