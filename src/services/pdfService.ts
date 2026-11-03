import fs from 'fs/promises';
import path from 'path';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { CandidateRecord } from '@/types';
import { getCandidatePhotograph } from '@/lib/storage';

export async function generateCandidatePdf(candidate: CandidateRecord): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]); // A4 Size: 595.28 x 841.89 pt
  const { width, height } = page.getSize();

  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const primaryGreen = rgb(0 / 255, 107 / 255, 60 / 255);
  const primaryYellow = rgb(245 / 255, 196 / 255, 0 / 255);
  const darkText = rgb(31 / 255, 41 / 255, 55 / 255);
  const grayText = rgb(100 / 255, 116 / 255, 139 / 255);
  const lightBg = rgb(248 / 255, 250 / 255, 252 / 255);
  const borderColor = rgb(203 / 255, 213 / 255, 225 / 255);

  let currentY = height - 20;

  // 1. Rupeeapex Banner Image
  try {
    const bannerPath = path.join(process.cwd(), 'public', 'logo', 'Rupeeapex-fullBanner.jpeg');
    const bannerBytes = await fs.readFile(bannerPath);
    const bannerImage = await pdfDoc.embedJpg(bannerBytes);
    const bannerWidth = width - 40; // 555.28
    const bannerHeight = 70;
    page.drawImage(bannerImage, {
      x: 20,
      y: currentY - bannerHeight,
      width: bannerWidth,
      height: bannerHeight,
    });
    currentY -= (bannerHeight + 10);
  } catch (err) {
    // Fallback header banner box if image file is not accessible
    page.drawRectangle({
      x: 20,
      y: currentY - 50,
      width: width - 40,
      height: 50,
      color: primaryGreen,
    });
    page.drawText('RUPEEAPEX GROUPS OF COMPANIES', {
      x: 35,
      y: currentY - 32,
      size: 16,
      font: fontBold,
      color: rgb(1, 1, 1),
    });
    currentY -= 60;
  }

  // 2. Title & App ID Bar
  page.drawRectangle({
    x: 20,
    y: currentY - 26,
    width: width - 40,
    height: 26,
    color: primaryGreen,
  });

  page.drawText('JOB APPLICATION FORM', {
    x: 30,
    y: currentY - 18,
    size: 12,
    font: fontBold,
    color: rgb(1, 1, 1),
  });

  const appIdText = `APP ID: ${candidate.applicationId}`;
  const appIdWidth = fontBold.widthOfTextAtSize(appIdText, 11);
  page.drawText(appIdText, {
    x: width - 30 - appIdWidth,
    y: currentY - 18,
    size: 11,
    font: fontBold,
    color: primaryYellow,
  });

  currentY -= 36;

  // 3. Candidate Photo Box (Top-Right)
  const photoBoxWidth = 85;
  const photoBoxHeight = 100;
  const photoX = width - 20 - photoBoxWidth;
  const photoY = currentY - photoBoxHeight + 10;

  page.drawRectangle({
    x: photoX,
    y: photoY,
    width: photoBoxWidth,
    height: photoBoxHeight,
    borderColor: primaryGreen,
    borderWidth: 1.5,
    color: lightBg,
  });

  let photoDrawn = false;
  if (candidate.photographStorageKey) {
    try {
      const photoResult = await getCandidatePhotograph(candidate.photographStorageKey);
      if (photoResult && photoResult.buffer) {
        let photoImg;
        if (photoResult.mimeType === 'image/png') {
          photoImg = await pdfDoc.embedPng(photoResult.buffer);
        } else {
          photoImg = await pdfDoc.embedJpg(photoResult.buffer);
        }
        page.drawImage(photoImg, {
          x: photoX + 2,
          y: photoY + 2,
          width: photoBoxWidth - 4,
          height: photoBoxHeight - 4,
        });
        photoDrawn = true;
      }
    } catch (e) {
      console.warn('Could not embed candidate photo in PDF:', e);
    }
  }

  if (!photoDrawn) {
    page.drawText('CANDIDATE', {
      x: photoX + 10,
      y: photoY + 55,
      size: 9,
      font: fontRegular,
      color: grayText,
    });
    page.drawText('PHOTOGRAPH', {
      x: photoX + 8,
      y: photoY + 42,
      size: 8,
      font: fontRegular,
      color: grayText,
    });
  }

  // Helper function to draw section header
  const drawSectionHeader = (title: string, yPos: number, customWidth?: number) => {
    const w = customWidth || width - 40;
    page.drawRectangle({
      x: 20,
      y: yPos - 16,
      width: w,
      height: 16,
      color: rgb(230 / 255, 244 / 255, 234 / 255),
      borderColor: primaryGreen,
      borderWidth: 0.8,
    });
    page.drawText(title, {
      x: 26,
      y: yPos - 12,
      size: 9,
      font: fontBold,
      color: primaryGreen,
    });
    return yPos - 22;
  };

  // Helper to draw two-column key-value rows
  const drawRow = (
    label1: string,
    val1: string,
    label2: string,
    val2: string,
    yPos: number,
    maxWidth?: number
  ) => {
    const colWidth = (maxWidth || width - 40) / 2;
    // Col 1
    page.drawText(label1 + ':', { x: 26, y: yPos, size: 8, font: fontBold, color: grayText });
    page.drawText(val1 || 'N/A', {
      x: 26 + fontBold.widthOfTextAtSize(label1 + ': ', 8),
      y: yPos,
      size: 8.5,
      font: fontRegular,
      color: darkText,
    });

    // Col 2
    if (label2) {
      const x2 = 20 + colWidth + 10;
      page.drawText(label2 + ':', { x: x2, y: yPos, size: 8, font: fontBold, color: grayText });
      page.drawText(val2 || 'N/A', {
        x: x2 + fontBold.widthOfTextAtSize(label2 + ': ', 8),
        y: yPos,
        size: 8.5,
        font: fontRegular,
        color: darkText,
      });
    }
    return yPos - 13;
  };

  // 4. PREFERRED JOB ROLE BANNER
  page.drawRectangle({
    x: 20,
    y: currentY - 20,
    width: width - 40 - photoBoxWidth - 10,
    height: 20,
    color: rgb(254 / 255, 249 / 255, 231 / 255),
    borderColor: primaryYellow,
    borderWidth: 1.2,
  });

  page.drawText('PREFERRED JOB ROLE: ', {
    x: 28,
    y: currentY - 14,
    size: 9,
    font: fontBold,
    color: primaryGreen,
  });

  page.drawText(candidate.preferredJobRole, {
    x: 155,
    y: currentY - 14,
    size: 11,
    font: fontBold,
    color: rgb(180 / 255, 110 / 255, 0 / 255),
  });

  const statusStr = `Status: ${candidate.applicationStatus}`;
  page.drawText(statusStr, {
    x: width - 40 - photoBoxWidth - 10 - fontBold.widthOfTextAtSize(statusStr, 9) - 10,
    y: currentY - 14,
    size: 9,
    font: fontBold,
    color: primaryGreen,
  });

  currentY -= 28;

  // 5. PERSONAL DETAILS SECTION
  currentY = drawSectionHeader('1. PERSONAL DETAILS', currentY, width - 40 - photoBoxWidth - 10);
  currentY = drawRow(
    'Full Name',
    candidate.personalDetails.fullName,
    'Gender',
    candidate.personalDetails.gender,
    currentY,
    width - 40 - photoBoxWidth - 10
  );
  currentY = drawRow(
    'Date of Birth',
    `${candidate.personalDetails.dateOfBirth} (Age: ${candidate.personalDetails.age} yrs)`,
    'Blood Group',
    candidate.personalDetails.bloodGroup,
    currentY,
    width - 40 - photoBoxWidth - 10
  );
  currentY = drawRow(
    'Marital Status',
    candidate.personalDetails.maritalStatus,
    "Father's Name",
    candidate.personalDetails.fathersName,
    currentY,
    width - 40 - photoBoxWidth - 10
  );
  currentY = drawRow(
    "Mother's Name",
    candidate.personalDetails.mothersName,
    '',
    '',
    currentY,
    width - 40 - photoBoxWidth - 10
  );

  // Resume full width below the photo box
  currentY = Math.min(currentY, photoY - 15);

  // 6. FAMILY DETAILS
  currentY = drawSectionHeader('2. FAMILY DETAILS', currentY);
  currentY = drawRow(
    "Father's Occupation",
    candidate.familyDetails.fathersOccupation || 'N/A',
    "Father's Mobile",
    candidate.familyDetails.fathersMobile || 'N/A',
    currentY
  );
  currentY = drawRow(
    "Mother's Occupation",
    candidate.familyDetails.mothersOccupation || 'N/A',
    "Mother's Mobile",
    candidate.familyDetails.mothersMobile || 'N/A',
    currentY
  );
  if (candidate.personalDetails.maritalStatus === 'Married' || candidate.familyDetails.spouseName) {
    currentY = drawRow(
      'Spouse Name',
      candidate.familyDetails.spouseName || 'N/A',
      'Marriage Date',
      candidate.familyDetails.marriageDate || 'N/A',
      currentY
    );
  }

  // 7. CONTACT DETAILS
  currentY = drawSectionHeader('3. CONTACT DETAILS', currentY);
  currentY = drawRow(
    'Mobile Number',
    candidate.contactDetails.mobileNumber,
    'Alt. Mobile Number',
    candidate.contactDetails.alternativeMobileNumber || 'N/A',
    currentY
  );
  currentY = drawRow(
    'Email Address',
    candidate.contactDetails.email,
    'Alt. Email',
    candidate.contactDetails.alternativeEmail || 'N/A',
    currentY
  );

  // 8. ADDRESS DETAILS
  currentY = drawSectionHeader('4. ADDRESS DETAILS', currentY);
  const perm = candidate.addressDetails.permanentAddress;
  const temp = candidate.addressDetails.temporaryAddress;
  const permStr = `${perm.doorNoStreet}, ${perm.villageOrArea}, ${perm.taluk}, ${perm.district}, ${perm.state} - ${perm.pincode}`;
  const tempStr = candidate.addressDetails.sameAsPermanent
    ? 'Same as Permanent Address'
    : `${temp.doorNoStreet}, ${temp.villageOrArea}, ${temp.taluk}, ${temp.district}, ${temp.state} - ${temp.pincode}`;

  page.drawText('Permanent Address:', { x: 26, y: currentY, size: 8, font: fontBold, color: grayText });
  currentY -= 11;
  page.drawText(permStr.substring(0, 110), { x: 26, y: currentY, size: 8, font: fontRegular, color: darkText });
  currentY -= 13;

  page.drawText('Temporary Address:', { x: 26, y: currentY, size: 8, font: fontBold, color: grayText });
  currentY -= 11;
  page.drawText(tempStr.substring(0, 110), { x: 26, y: currentY, size: 8, font: fontRegular, color: darkText });
  currentY -= 14;

  // 9. EDUCATIONAL DETAILS
  currentY = drawSectionHeader('5. EDUCATIONAL DETAILS', currentY);
  currentY = drawRow(
    'Highest Qualification',
    candidate.educationDetails.highestQualification,
    'Passing Year',
    candidate.educationDetails.passingYear,
    currentY
  );
  currentY = drawRow(
    'School / College Name',
    candidate.educationDetails.institutionName,
    'Addl. Qualification',
    candidate.educationDetails.additionalQualification || 'N/A',
    currentY
  );

  // 10. EMPLOYMENT DETAILS
  currentY = drawSectionHeader('6. EMPLOYMENT DETAILS', currentY);
  const hasExp = candidate.employmentDetails.hasPreviousExperience;
  currentY = drawRow(
    'Previous Experience',
    hasExp ? 'Yes' : 'No (Fresher)',
    'Previous Occupation',
    hasExp ? (candidate.employmentDetails.previousOccupation || 'N/A') : 'N/A',
    currentY
  );
  if (hasExp) {
    const durationStr = `${candidate.employmentDetails.experienceDurationYears || 0} Years, ${candidate.employmentDetails.experienceDurationMonths || 0} Months`;
    currentY = drawRow(
      'Previous Company',
      candidate.employmentDetails.previousCompanyName || 'N/A',
      'Experience Duration',
      durationStr,
      currentY
    );
  }

  // 11. OTHER & REFERENCE INFORMATION
  currentY = drawSectionHeader('7. REFERENCE & OTHER INFORMATION', currentY);
  currentY = drawRow(
    'Referral Source',
    candidate.referenceDetails.referralSource,
    'Referrer Name / Contact',
    `${candidate.referenceDetails.referrerName || 'N/A'} ${candidate.referenceDetails.referrerContact ? `(${candidate.referenceDetails.referrerContact})` : ''}`,
    currentY
  );

  // 12. DECLARATION & SIGNATURE
  currentY = drawSectionHeader('8. DECLARATION', currentY);
  const declarationText =
    'I hereby declare that all the information furnished above is true, complete and correct to the best of my knowledge and belief. I understand that any false or misleading statements may lead to disqualification or dismissal.';
  page.drawText(declarationText.substring(0, 120), { x: 26, y: currentY, size: 7.5, font: fontRegular, color: grayText });
  currentY -= 10;
  page.drawText(declarationText.substring(120), { x: 26, y: currentY, size: 7.5, font: fontRegular, color: grayText });
  currentY -= 20;

  // Bottom Signature Row
  const submittedDateStr = new Date(candidate.submittedAt).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  page.drawText(`Application Date: ${submittedDateStr}`, {
    x: 26,
    y: currentY,
    size: 8.5,
    font: fontBold,
    color: darkText,
  });

  page.drawText('Candidate Signature: __________________________', {
    x: width - 260,
    y: currentY,
    size: 8.5,
    font: fontBold,
    color: darkText,
  });

  currentY -= 18;

  // Footer
  page.drawLine({
    start: { x: 20, y: currentY },
    end: { x: width - 20, y: currentY },
    thickness: 0.8,
    color: borderColor,
  });

  currentY -= 10;
  page.drawText(
    'Rupeeapex Groups of Companies | ResumeFlow Confidential HR Document | Generated securely',
    {
      x: 30,
      y: currentY,
      size: 7,
      font: fontRegular,
      color: grayText,
    }
  );

  return pdfDoc.save();
}
