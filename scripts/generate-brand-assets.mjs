/**
 * Generates native launcher icons from the BhaiWay app icon source
 * and splash assets from assets/BhaiWay Splash Screen.gif.
 *
 * Icon source:
 *   assets/app-icon-source.jpeg
 *
 * Run: npm run generate:brand-assets
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');

const iconSourcePath = path.join(root, 'assets/app-icon-source.jpeg');
const gifPath = path.join(root, 'assets/BhaiWay Splash Screen.gif');
const ffmpegPath = ffmpegInstaller.path;

const writeSquareIcon = async (outputPath, size, logoScale = 0.72) => {
  const logoSize = Math.round(size * logoScale);
  const logoBuffer = await sharp(iconSourcePath)
    .resize(logoSize, logoSize, {
      fit: 'contain',
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    })
    .png()
    .toBuffer();

  await sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    },
  })
    .composite([{ input: logoBuffer, gravity: 'centre' }])
    .png()
    .toFile(outputPath);
};

const generateSplashVideo = (durationSeconds) => {
  const outputPath = path.join(root, 'assets/splash.mp4');
  const result = spawnSync(
    ffmpegPath,
    [
      '-y',
      '-i',
      gifPath,
      '-t',
      String(durationSeconds),
      '-movflags',
      'faststart',
      '-pix_fmt',
      'yuv420p',
      '-an',
      '-vf',
      'scale=trunc(iw/2)*2:trunc(ih/2)*2',
      outputPath,
    ],
    { stdio: 'inherit' },
  );

  if (result.status !== 0) {
    throw new Error('ffmpeg failed to generate assets/splash.mp4 from the splash GIF');
  }
};

const main = async () => {
  if (!fs.existsSync(iconSourcePath)) {
    throw new Error('Missing app icon source. Place assets/app-icon-source.jpeg');
  }

  console.log('Using icon source:', path.relative(root, iconSourcePath));

  await writeSquareIcon(path.join(root, 'assets/icon.png'), 1024, 0.78);
  await writeSquareIcon(path.join(root, 'assets/adaptive-icon.png'), 1024, 0.66);
  await writeSquareIcon(path.join(root, 'assets/favicon.png'), 48, 0.78);
  // Launcher / marketing logo only — NOT used as the Android 12+ splash icon.
  await writeSquareIcon(path.join(root, 'assets/splash-icon.png'), 512, 0.72);

  // Native system splash: solid canvas color so Android does not show a square logo.
  // The real brand animation is the JS overlay video (assets/splash.mp4).
  await sharp({
    create: {
      width: 512,
      height: 512,
      channels: 3,
      background: { r: 249, g: 251, b: 251 },
    },
  })
    .png()
    .toFile(path.join(root, 'assets/splash-native.png'));

  await sharp(iconSourcePath)
    .resize(1024, 1024, {
      fit: 'contain',
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    })
    .png()
    .toFile(path.join(root, 'assets/brand-logo.png'));

  if (fs.existsSync(gifPath)) {
    const gifMeta = await sharp(gifPath, { animated: true }).metadata();
    const lastFrame = Math.max(0, (gifMeta.pages ?? 1) - 1);
    const background = gifMeta.background ?? { r: 249, g: 251, b: 251 };

    await sharp(gifPath, { animated: false, page: 0 })
      .resize(1284, 2778, { fit: 'contain', background: { ...background, alpha: 1 } })
      .png()
      .toFile(path.join(root, 'assets/splash-static.png'));

    await sharp(gifPath, { animated: true, page: lastFrame })
      .resize(1284, 2778, { fit: 'contain', background: { ...background, alpha: 1 } })
      .png()
      .toFile(path.join(root, 'assets/splash-end.png'));

    generateSplashVideo((gifMeta.delay ?? []).reduce((sum, frame) => sum + frame, 0) / 1000);
  }

  console.log('Brand assets generated in assets/');
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
