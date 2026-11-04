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
  const lightGreenBg = rgb(235 / 255, 247 / 255, 238 / 255);
  const borderColor = rgb(203 / 255, 213 / 255, 225 / 255);

  const leftMargin = 24;
  const rightMargin = 24;
  const contentWidth = width - leftMargin - rightMargin;

  let currentY = height - 16;

  // 1. Rupeeapex Logo (Proportionally scaled, centered, not oversized)
  try {
    const bannerPath = path.join(process.cwd(), 'public', 'logo', 'Rupeeapex-fullBanner.jpeg');
    const bannerBytes = await fs.readFile(bannerPath);
    const bannerImage = await pdfDoc.embedJpg(bannerBytes);
    const logoWidth = 145;
    const logoHeight = Math.round(logoWidth / 2.525); // ~57 pt natural aspect ratio
    const logoX = (width - logoWidth) / 2;

    page.drawImage(bannerImage, {
      x: logoX,
      y: currentY - logoHeight,
      width: logoWidth,
      height: logoHeight,
    });
    currentY -= (logoHeight + 6);
  } catch (err) {
    page.drawRectangle({
      x: leftMargin,
      y: currentY - 32,
      width: contentWidth,
      height: 32,
      color: primaryGreen,
    });
    page.drawText('RUPEEAPEX GROUPS OF COMPANIES', {
      x: leftMargin + 12,
      y: currentY - 21,
      size: 13,
      font: fontBold,
      color: rgb(1, 1, 1),
    });
    currentY -= 38;
  }

  // 2. Application Form Header & Application ID Bar
  const barHeight = 20;
  page.drawRectangle({
    x: leftMargin,
    y: currentY - barHeight,
    width: contentWidth,
    height: barHeight,
    color: primaryGreen,
  });

  page.drawText('JOB APPLICATION FORM', {
    x: leftMargin + 10,
    y: currentY - 14,
    size: 9.5,
    font: fontBold,
    color: rgb(1, 1, 1),
  });

  const appIdText = `APP ID: ${candidate.applicationId}`;
  const appIdWidth = fontBold.widthOfTextAtSize(appIdText, 9.5);
  page.drawText(appIdText, {
    x: width - rightMargin - 10 - appIdWidth,
    y: currentY - 14,
    size: 9.5,
    font: fontBold,
    color: primaryYellow,
  });

  currentY -= (barHeight + 10);

  // Section header helper (clean padding, no overlapping text)
  const drawSectionHeader = (title: string, yPos: number, customWidth?: number) => {
    const w = customWidth || contentWidth;
    page.drawRectangle({
      x: leftMargin,
      y: yPos - 15,
      width: w,
      height: 15,
      color: lightGreenBg,
      borderColor: primaryGreen,
      borderWidth: 0.8,
    });
    page.drawText(title, {
      x: leftMargin + 6,
      y: yPos - 11,
      size: 8,
      font: fontBold,
      color: primaryGreen,
    });
    // Return with clean padding below the header box so text never touches it
    return yPos - 25;
  };

  // Two-column aligned row helper (aligned columns, no jagged staircase)
  const drawAlignedRow = (
    label1: string,
    val1: string,
    label2: string,
    val2: string,
    yPos: number,
    opt?: { customWidth?: number; label1Width?: number; label2Width?: number }
  ) => {
    const w = opt?.customWidth || contentWidth;
    const col1X = leftMargin + 6;
    const l1W = opt?.label1Width || 72;
    const v1X = col1X + l1W;

    const col2X = leftMargin + (w / 2) + 6;
    const l2W = opt?.label2Width || 72;
    const v2X = col2X + l2W;

    // Column 1
    page.drawText(label1 + ':', { x: col1X, y: yPos, size: 7.2, font: fontBold, color: grayText });
    page.drawText((val1 || 'N/A').substring(0, 32), {
      x: v1X,
      y: yPos,
      size: 7.6,
      font: fontRegular,
      color: darkText,
    });

    // Column 2
    if (label2) {
      page.drawText(label2 + ':', { x: col2X, y: yPos, size: 7.2, font: fontBold, color: grayText });
      page.drawText((val2 || 'N/A').substring(0, 32), {
        x: v2X,
        y: yPos,
        size: 7.6,
        font: fontRegular,
        color: darkText,
      });
    }

    return yPos - 12;
  };

  // 3. Candidate Photo Box (Top-Right, aligned with Section 1)
  const photoBoxWidth = 85;
  const photoBoxHeight = 98;
  const photoX = width - rightMargin - photoBoxWidth;
  const photoY = currentY - photoBoxHeight;

  page.drawRectangle({
    x: photoX,
    y: photoY,
    width: photoBoxWidth,
    height: photoBoxHeight,
    borderColor: primaryGreen,
    borderWidth: 1.2,
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
      x: photoX + 14,
      y: photoY + 54,
      size: 8,
      font: fontRegular,
      color: grayText,
    });
    page.drawText('PHOTOGRAPH', {
      x: photoX + 11,
      y: photoY + 42,
      size: 7.5,
      font: fontRegular,
      color: grayText,
    });
  }

  // 4. Section 1: Personal Details (Left side beside Photo Box)
  const personalWidth = photoX - leftMargin - 10;
  currentY = drawSectionHeader('1. PERSONAL DETAILS', currentY, personalWidth);

  currentY = drawAlignedRow(
    'Candidate Name',
    candidate.personalDetails.fullName,
    'Gender',
    candidate.personalDetails.gender,
    currentY,
    { customWidth: personalWidth, label1Width: 70, label2Width: 60 }
  );
  currentY = drawAlignedRow(
    'Date of Birth',
    `${candidate.personalDetails.dateOfBirth} (${candidate.personalDetails.age} yrs)`,
    'Marital Status',
    candidate.personalDetails.maritalStatus,
    currentY,
    { customWidth: personalWidth, label1Width: 70, label2Width: 60 }
  );
  currentY = drawAlignedRow(
    "Father's Name",
    candidate.personalDetails.fathersName,
    "Mother's Name",
    candidate.personalDetails.mothersName,
    currentY,
    { customWidth: personalWidth, label1Width: 70, label2Width: 60 }
  );
  currentY = drawAlignedRow(
    'Mobile Number',
    candidate.personalDetails.mobileNumber,
    'Alt Mobile',
    candidate.personalDetails.alternativeMobileNumber || 'N/A',
    currentY,
    { customWidth: personalWidth, label1Width: 70, label2Width: 60 }
  );
  currentY = drawAlignedRow(
    'Email Address',
    candidate.personalDetails.email,
    'Aadhaar No',
    candidate.personalDetails.aadhaarNumber || 'N/A',
    currentY,
    { customWidth: personalWidth, label1Width: 70, label2Width: 60 }
  );
  currentY = drawAlignedRow(
    'PAN Number',
    candidate.personalDetails.panNumber || 'N/A',
    'Spouse Name',
    candidate.personalDetails.spouseName || 'N/A',
    currentY,
    { customWidth: personalWidth, label1Width: 70, label2Width: 60 }
  );

  // Resume full width cleanly below the Photo Box and Personal Details
  currentY = Math.min(currentY, photoY) - 8;

  // 5. Section 2: Family Details
  currentY = drawSectionHeader('2. FAMILY DETAILS', currentY);
  currentY = drawAlignedRow(
    "Father's Occupation",
    candidate.familyDetails?.fathersOccupation || 'N/A',
    "Father's Mobile",
    candidate.familyDetails?.fathersMobile || 'N/A',
    currentY,
    { label1Width: 92, label2Width: 78 }
  );
  currentY = drawAlignedRow(
    "Mother's Occupation",
    candidate.familyDetails?.mothersOccupation || 'N/A',
    "Mother's Mobile",
    candidate.familyDetails?.mothersMobile || 'N/A',
    currentY,
    { label1Width: 92, label2Width: 78 }
  );
  if (candidate.familyDetails?.spouseOccupation || candidate.personalDetails.maritalStatus === 'Married') {
    currentY = drawAlignedRow(
      'Spouse Occupation',
      candidate.familyDetails?.spouseOccupation || 'N/A',
      'Spouse Name',
      candidate.personalDetails?.spouseName || candidate.familyDetails?.spouseName || 'N/A',
      currentY,
      { label1Width: 92, label2Width: 78 }
    );
  }
  currentY -= 4;

  // 6. Section 3: Address Details
  currentY = drawSectionHeader('3. ADDRESS DETAILS', currentY);
  const perm = candidate.addressDetails.permanentAddress;
  const temp = candidate.addressDetails.temporaryAddress;
  const permStr = `${perm.doorNoStreet}, ${perm.villageOrArea}, ${perm.taluk}, ${perm.district}, ${perm.state} - ${perm.pincode}`;
  const tempStr = candidate.addressDetails.sameAsPermanent
    ? 'Same as Permanent Address'
    : `${temp.doorNoStreet}, ${temp.villageOrArea}, ${temp.taluk}, ${temp.district}, ${temp.state} - ${temp.pincode}`;

  page.drawText('Permanent Address:', { x: leftMargin + 6, y: currentY, size: 7.2, font: fontBold, color: grayText });
  currentY -= 10;
  page.drawText(permStr.substring(0, 115), { x: leftMargin + 6, y: currentY, size: 7.5, font: fontRegular, color: darkText });
  currentY -= 12;

  page.drawText('Temporary / Present Address:', { x: leftMargin + 6, y: currentY, size: 7.2, font: fontBold, color: grayText });
  currentY -= 10;
  page.drawText(tempStr.substring(0, 115), { x: leftMargin + 6, y: currentY, size: 7.5, font: fontRegular, color: darkText });
  currentY -= 12;

  // 7. Section 4: Education Details
  currentY = drawSectionHeader('4. EDUCATION DETAILS', currentY);
  currentY = drawAlignedRow(
    'Highest Qualification',
    candidate.educationDetails.highestQualification,
    'Year of Passing',
    candidate.educationDetails.passingYear,
    currentY,
    { label1Width: 95, label2Width: 75 }
  );
  currentY = drawAlignedRow(
    'Institution Name',
    candidate.educationDetails.institutionName,
    'Course / Details',
    candidate.educationDetails.educationDetails || candidate.educationDetails.additionalQualification || 'N/A',
    currentY,
    { label1Width: 95, label2Width: 75 }
  );
  currentY -= 4;

  // 8. Section 5: Experience Details
  currentY = drawSectionHeader('5. EXPERIENCE DETAILS', currentY);
  const hasExp = candidate.employmentDetails.hasPreviousExperience;
  currentY = drawAlignedRow(
    'Previous Experience',
    hasExp ? 'Yes (Experienced)' : 'No (Fresher)',
    'Previous Company',
    hasExp ? (candidate.employmentDetails.previousCompany || candidate.employmentDetails.previousCompanyName || 'N/A') : 'N/A',
    currentY,
    { label1Width: 92, label2Width: 80 }
  );
  if (hasExp) {
    const yearsStr = candidate.employmentDetails.yearsOfExperience !== undefined
      ? `${candidate.employmentDetails.yearsOfExperience} Years`
      : `${candidate.employmentDetails.experienceDurationYears || 0} Yrs, ${candidate.employmentDetails.experienceDurationMonths || 0} Mos`;
    currentY = drawAlignedRow(
      'Previous Designation',
      candidate.employmentDetails.previousDesignation || candidate.employmentDetails.previousOccupation || 'N/A',
      'Years of Experience',
      yearsStr,
      currentY,
      { label1Width: 92, label2Width: 80 }
    );
  }
  currentY -= 4;

  // 9. Section 6: Preferred Job Role (Positioned directly below Experience Details)
  currentY = drawSectionHeader('6. PREFERRED JOB ROLE', currentY);
  const roleDisplay = candidate.preferredJobRole === 'OTHER'
    ? `OTHER: ${candidate.preferredJobRoleOther || 'Specialized Role'}`
    : candidate.preferredJobRole;
  currentY = drawAlignedRow(
    'Preferred Job Role',
    roleDisplay,
    candidate.preferredJobRole === 'OTHER' ? 'Custom Specified Role' : '',
    candidate.preferredJobRole === 'OTHER' ? (candidate.preferredJobRoleOther || 'N/A') : '',
    currentY,
    { label1Width: 92, label2Width: 90 }
  );
  currentY -= 4;

  // 10. Section 7: Other Details & Reference
  currentY = drawSectionHeader('7. OTHER DETAILS & REFERENCE', currentY);
  currentY = drawAlignedRow(
    'Referral Source',
    candidate.referenceDetails.referralSource,
    'Reference Name',
    `${candidate.referenceDetails.referrerName || 'N/A'} ${candidate.referenceDetails.referrerContact ? `(${candidate.referenceDetails.referrerContact})` : ''}`,
    currentY,
    { label1Width: 88, label2Width: 80 }
  );
  if (candidate.referenceDetails.additionalRemarks) {
    page.drawText('Additional Remarks: ' + candidate.referenceDetails.additionalRemarks.substring(0, 95), {
      x: leftMargin + 6,
      y: currentY,
      size: 7.2,
      font: fontRegular,
      color: darkText,
    });
    currentY -= 12;
  }
  currentY -= 4;

  // 11. Section 8: Declaration & Signature
  currentY = drawSectionHeader('8. DECLARATION', currentY);
  const declarationText1 =
    'I hereby declare that all the information furnished above is true, complete and correct to the best of my knowledge and belief.';
  const declarationText2 =
    'I understand that any false or misleading statements may lead to disqualification or dismissal.';
  page.drawText(declarationText1, { x: leftMargin + 6, y: currentY, size: 7, font: fontRegular, color: grayText });
  currentY -= 9;
  page.drawText(declarationText2, { x: leftMargin + 6, y: currentY, size: 7, font: fontRegular, color: grayText });
  currentY -= 16;

  // Signature row
  const submittedDateStr = new Date(candidate.submittedAt).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  page.drawText(`Date: ${submittedDateStr}`, {
    x: leftMargin + 6,
    y: currentY,
    size: 7.8,
    font: fontBold,
    color: darkText,
  });

  page.drawText('Candidate Signature: ________________________________', {
    x: width - rightMargin - 240,
    y: currentY,
    size: 7.8,
    font: fontBold,
    color: darkText,
  });

  currentY -= 12;

  page.drawLine({
    start: { x: leftMargin, y: currentY },
    end: { x: width - rightMargin, y: currentY },
    thickness: 0.6,
    color: borderColor,
  });

  currentY -= 9;
  page.drawText('Rupeeapex Groups of Companies | Official HR Job Application Record', {
    x: leftMargin + 6,
    y: currentY,
    size: 6.5,
    font: fontRegular,
    color: grayText,
  });
  page.drawText('Strictly Confidential - Internal HR Use Only', {
    x: width - rightMargin - 150,
    y: currentY,
    size: 6.5,
    font: fontRegular,
    color: grayText,
  });

  return pdfDoc.save();
}
