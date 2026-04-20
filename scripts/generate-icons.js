import sharp from 'sharp';
import fs from 'fs/promises';
import path from 'path';

const SVG_PATH = './public/icon.svg';
const PNG_PATH = './public/icon.png';
const OUTPUT_DIR = './public';

const ICONS = [
  { name: 'favicon-16x16.png', size: 16 },
  { name: 'favicon-32x32.png', size: 32 },
  { name: 'apple-touch-icon.png', size: 180 },
  { name: 'icon-192x192.png', size: 192 },
  { name: 'icon-512x512.png', size: 512 }
];

async function generateIcons() {
  let sourcePath = SVG_PATH;
  
  try {
    await fs.access(SVG_PATH);
  } catch {
    try {
      await fs.access(PNG_PATH);
      sourcePath = PNG_PATH;
    } catch {
      console.error(`❌ No s'ha trobat cap arxiu font. Has de posar un 'icon.svg' o 'icon.png' a la carpeta public/.`);
      process.exit(1);
    }
  }

  console.log(`Generant icones a partir de ${sourcePath}...`);

  try {
    // Esborrem l'antic .ico si existeix per reemplaçar-lo netament
    await fs.rm(path.join(OUTPUT_DIR, 'favicon.ico')).catch(() => {});

    for (const icon of ICONS) {
      const outPath = path.join(OUTPUT_DIR, icon.name);
      await sharp(sourcePath)
        .resize(icon.size, icon.size)
        // Ensure transparent background where applicable
        .png({ quality: 100 })
        .toFile(outPath);
      console.log(`✅ ${icon.name} creat (${icon.size}x${icon.size})`);
    }

    // Copiem el de 32x32 per fer el .ico modern (només cambiant l'extensió, la majoria de navegadors ho prenen bé)
    // o el dupliquem
    const icoPath = path.join(OUTPUT_DIR, 'favicon.ico');
    await sharp(sourcePath)
      .resize(32, 32)
      .png({ quality: 100 })
      .toFile(icoPath);
    console.log(`✅ favicon.ico creat fallback (32x32)`);

    console.log('🎉 Totes les icones generades amb èxit!');
  } catch (error) {
    console.error('Hi ha hagut un error generant les icones:', error);
  }
}

generateIcons();
