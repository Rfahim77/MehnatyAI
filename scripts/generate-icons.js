import sharp from 'sharp';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const sizes = [
  { size: 32, name: 'favicon-32x32.png' },
  { size: 180, name: 'apple-touch-icon.png' },
  { size: 192, name: 'icon-192x192.png' },
  { size: 512, name: 'icon-512x512.png' }
];

const inputPath = join(__dirname, '../attached_assets/Minimalist Logo with Angular Patterns (Logo)_1762433252661.png');
const outputDir = join(__dirname, '../client/public/icons');

async function generateIcons() {
  for (const { size, name } of sizes) {
    await sharp(inputPath)
      .resize(size, size, {
        fit: 'contain',
        background: { r: 18, g: 64, b: 52, alpha: 1 } // Match the logo background color
      })
      .png()
      .toFile(join(outputDir, name));
    
    console.log(`Generated ${name} (${size}x${size})`);
  }
  
  console.log('All icons generated successfully!');
}

generateIcons().catch(console.error);
