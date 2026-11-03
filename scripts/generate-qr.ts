import { config } from 'dotenv';
config({ path: '.env.local' });
config();

import fs from 'fs/promises';
import path from 'path';
import QRCode from 'qrcode';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

async function generateReceptionAssets() {
  console.log('--- RESUMEFLOW: Generating Reception QR Code & A4 Poster ---');

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const applyUrl = `${appUrl}/apply`;
  console.log(`Target Public Application URL: ${applyUrl}`);

  const qrDir = path.join(process.cwd(), 'public', 'qr');
  await fs.mkdir(qrDir, { recursive: true });

  const qrImagePath = path.join(qrDir, 'reception-qr.png');
  const posterPdfPath = path.join(qrDir, 'reception-poster.pdf');

  // 1. Generate high-resolution PNG QR Code
  await QRCode.toFile(qrImagePath, applyUrl, {
    width: 600,
    margin: 2,
    color: {
      dark: '#006B3C', // Rupeeapex Green
      light: '#FFFFFF',
    },
    errorCorrectionLevel: 'H',
  });
  console.log(`Saved Common QR Code PNG to: ${qrImagePath}`);

  // 2. Generate A4 Reception Poster PDF
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]); // A4 (595.28 x 841.89 pt)
  const { width, height } = page.getSize();

  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const primaryGreen = rgb(0 / 255, 107 / 255, 60 / 255);
  const primaryYellow = rgb(245 / 255, 196 / 255, 0 / 255);
  const darkText = rgb(31 / 255, 41 / 255, 55 / 255);
  const grayText = rgb(100 / 255, 116 / 255, 139 / 255);
  const lightBg = rgb(246 / 255, 250 / 255, 247 / 255);

  // Background card styling
  page.drawRectangle({
    x: 20,
    y: 20,
    width: width - 40,
    height: height - 40,
    color: lightBg,
    borderColor: primaryGreen,
    borderWidth: 2,
  });

  // Inner border
  page.drawRectangle({
    x: 26,
    y: 26,
    width: width - 52,
    height: height - 52,
    borderColor: primaryYellow,
    borderWidth: 1.5,
  });

  let currentY = height - 45;

  // Header Banner Image
  try {
    const bannerPath = path.join(process.cwd(), 'public', 'logo', 'Rupeeapex-fullBanner.jpeg');
    const bannerBytes = await fs.readFile(bannerPath);
    const bannerImage = await pdfDoc.embedJpg(bannerBytes);
    const bWidth = width - 70;
    const bHeight = 85;
    page.drawImage(bannerImage, {
      x: 35,
      y: currentY - bHeight,
      width: bWidth,
      height: bHeight,
    });
    currentY -= (bHeight + 20);
  } catch (err) {
    page.drawRectangle({
      x: 35,
      y: currentY - 70,
      width: width - 70,
      height: 70,
      color: primaryGreen,
    });
    page.drawText('RUPEEAPEX GROUPS OF COMPANIES', {
      x: 50,
      y: currentY - 45,
      size: 20,
      font: fontBold,
      color: rgb(1, 1, 1),
    });
    currentY -= 90;
  }

  // Header: JOB APPLICATION
  const headingText = 'JOB APPLICATION';
  const headingWidth = fontBold.widthOfTextAtSize(headingText, 28);
  page.drawText(headingText, {
    x: (width - headingWidth) / 2,
    y: currentY,
    size: 28,
    font: fontBold,
    color: primaryGreen,
  });

  currentY -= 25;

  const subHeading = 'WELCOME TO RUPEEAPEX RECEPTION';
  const subHeadingWidth = fontBold.widthOfTextAtSize(subHeading, 13);
  page.drawText(subHeading, {
    x: (width - subHeadingWidth) / 2,
    y: currentY,
    size: 13,
    font: fontBold,
    color: rgb(180 / 255, 110 / 255, 0 / 255),
  });

  currentY -= 35;

  // Scan instruction pill
  const instructionBoxWidth = 420;
  page.drawRectangle({
    x: (width - instructionBoxWidth) / 2,
    y: currentY - 28,
    width: instructionBoxWidth,
    height: 34,
    color: primaryGreen,
  });

  const scanText = 'SCAN QR CODE WITH YOUR MOBILE CAMERA';
  const scanTextWidth = fontBold.widthOfTextAtSize(scanText, 14);
  page.drawText(scanText, {
    x: (width - scanTextWidth) / 2,
    y: currentY - 16,
    size: 14,
    font: fontBold,
    color: rgb(1, 1, 1),
  });

  currentY -= 48;

  // QR Code Box in center
  const qrBoxSize = 250;
  const qrBoxX = (width - qrBoxSize) / 2;
  const qrBoxY = currentY - qrBoxSize;

  page.drawRectangle({
    x: qrBoxX - 10,
    y: qrBoxY - 10,
    width: qrBoxSize + 20,
    height: qrBoxSize + 20,
    color: rgb(1, 1, 1),
    borderColor: primaryYellow,
    borderWidth: 3,
  });

  const qrImageBytes = await fs.readFile(qrImagePath);
  const qrImage = await pdfDoc.embedPng(qrImageBytes);
  page.drawImage(qrImage, {
    x: qrBoxX,
    y: qrBoxY,
    width: qrBoxSize,
    height: qrBoxSize,
  });

  currentY = qrBoxY - 25;

  // Direct URL text
  const urlLabel = `Direct Link: ${applyUrl}`;
  const urlWidth = fontRegular.widthOfTextAtSize(urlLabel, 10);
  page.drawText(urlLabel, {
    x: (width - urlWidth) / 2,
    y: currentY,
    size: 10,
    font: fontRegular,
    color: grayText,
  });

  currentY -= 35;

  // 4 Steps Guide
  page.drawRectangle({
    x: 45,
    y: currentY - 95,
    width: width - 90,
    height: 105,
    color: rgb(1, 1, 1),
    borderColor: rgb(226 / 255, 232 / 255, 240 / 255),
    borderWidth: 1,
  });

  page.drawText('APPLICATION PROCESS STEPS:', {
    x: 60,
    y: currentY - 10,
    size: 11,
    font: fontBold,
    color: primaryGreen,
  });

  const steps = [
    '1. Scan this QR code using your smartphone camera or QR scanner app.',
    '2. Fill in your Personal, Family, Address, Education and Previous Employment details.',
    '3. Select your preferred role: GOLD / NIDHI / MFI / CHIT / INSURANCE.',
    '4. Take or upload your photograph, accept declaration and tap Submit Application.',
  ];

  let stepY = currentY - 28;
  steps.forEach((step) => {
    page.drawText(step, {
      x: 60,
      y: stepY,
      size: 9.5,
      font: fontRegular,
      color: darkText,
    });
    stepY -= 18;
  });

  // Footer notes
  page.drawText('Rupeeapex Groups of Companies - Empowering Growth & Prosperity', {
    x: 80,
    y: 42,
    size: 9,
    font: fontBold,
    color: primaryGreen,
  });

  const helpText = 'Need help? Please contact the reception desk.';
  const helpTextWidth = fontRegular.widthOfTextAtSize(helpText, 9);
  page.drawText(helpText, {
    x: (width - helpTextWidth) / 2,
    y: 30,
    size: 8.5,
    font: fontRegular,
    color: grayText,
  });

  const pdfBytes = await pdfDoc.save();
  await fs.writeFile(posterPdfPath, pdfBytes);
  console.log(`Saved Reception Poster PDF to: ${posterPdfPath}`);
  console.log('Reception assets generation complete!');
}

generateReceptionAssets().catch((e) => {
  console.error('Error generating reception assets:', e);
  process.exit(1);
});

