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

  // 1. Rupeeapex Banner / Logo Image
  try {
    const bannerPath = path.join(process.cwd(), 'public', 'logo', 'Rupeeapex-fullBanner.jpeg');
    const bannerBytes = await fs.readFile(bannerPath);
    const bannerImage = await pdfDoc.embedJpg(bannerBytes);
    const bannerWidth = width - 40;
    const bannerHeight = 70;
    page.drawImage(bannerImage, {
      x: 20,
      y: currentY - bannerHeight,
      width: bannerWidth,
      height: bannerHeight,
    });
    currentY -= (bannerHeight + 10);
  } catch (err) {
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

  currentY -= 34;

  // 3. Candidate Photo Box (Top-Right)
  const photoBoxWidth = 85;
  const photoBoxHeight = 100;
  const photoX = width - 20 - photoBoxWidth;
  const photoY = currentY - photoBoxHeight + 8;

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
      x: photoX + 12,
      y: photoY + 55,
      size: 9,
      font: fontRegular,
      color: grayText,
    });
    page.drawText('PHOTOGRAPH', {
      x: photoX + 9,
      y: photoY + 42,
      size: 8,
      font: fontRegular,
      color: grayText,
    });
  }

  // Section header helper
  const drawSectionHeader = (title: string, yPos: number, customWidth?: number) => {
    const w = customWidth || width - 40;
    page.drawRectangle({
      x: 20,
      y: yPos - 15,
      width: w,
      height: 15,
      color: rgb(230 / 255, 244 / 255, 234 / 255),
      borderColor: primaryGreen,
      borderWidth: 0.8,
    });
    page.drawText(title, {
      x: 26,
      y: yPos - 11,
      size: 8.5,
      font: fontBold,
      color: primaryGreen,
    });
    return yPos - 20;
  };

  // Two-column row helper
  const drawRow = (
    label1: string,
    val1: string,
    label2: string,
    val2: string,
    yPos: number,
    maxWidth?: number
  ) => {
    const colWidth = (maxWidth || width - 40) / 2;
    page.drawText(label1 + ':', { x: 26, y: yPos, size: 7.5, font: fontBold, color: grayText });
    page.drawText((val1 || 'N/A').substring(0, 32), {
      x: 26 + fontBold.widthOfTextAtSize(label1 + ': ', 7.5),
      y: yPos,
      size: 8,
      font: fontRegular,
      color: darkText,
    });

    if (label2) {
      const x2 = 20 + colWidth + 5;
      page.drawText(label2 + ':', { x: x2, y: yPos, size: 7.5, font: fontBold, color: grayText });
      page.drawText((val2 || 'N/A').substring(0, 32), {
        x: x2 + fontBold.widthOfTextAtSize(label2 + ': ', 7.5),
        y: yPos,
        size: 8,
        font: fontRegular,
        color: darkText,
      });
    }
    return yPos - 12;
  };

  // 4. PREFERRED JOB ROLE BANNER
  const roleDisplay = candidate.preferredJobRole === 'OTHER'
    ? `OTHER: ${candidate.preferredJobRoleOther || 'Specialized Role'}`
    : candidate.preferredJobRole;

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
    size: 8.5,
    font: fontBold,
    color: primaryGreen,
  });

  page.drawText(roleDisplay, {
    x: 145,
    y: currentY - 14,
    size: 10,
    font: fontBold,
    color: rgb(180 / 255, 110 / 255, 0 / 255),
  });

  currentY -= 26;

  // 5. PERSONAL DETAILS
  currentY = drawSectionHeader('1. PERSONAL DETAILS', currentY, width - 40 - photoBoxWidth - 10);
  currentY = drawRow(
    'Candidate Name',
    candidate.personalDetails.fullName,
    'Gender',
    candidate.personalDetails.gender,
    currentY,
    width - 40 - photoBoxWidth - 10
  );
  currentY = drawRow(
    'Date of Birth',
    `${candidate.personalDetails.dateOfBirth} (${candidate.personalDetails.age} yrs)`,
    'Marital Status',
    candidate.personalDetails.maritalStatus,
    currentY,
    width - 40 - photoBoxWidth - 10
  );
  currentY = drawRow(
    "Father's Name",
    candidate.personalDetails.fathersName,
    "Mother's Name",
    candidate.personalDetails.mothersName,
    currentY,
    width - 40 - photoBoxWidth - 10
  );
  currentY = drawRow(
    'Mobile',
    candidate.personalDetails.mobileNumber,
    'Alt Mobile',
    candidate.personalDetails.alternativeMobileNumber || 'N/A',
    currentY,
    width - 40 - photoBoxWidth - 10
  );
  currentY = drawRow(
    'Email',
    candidate.personalDetails.email,
    'Aadhaar No',
    candidate.personalDetails.aadhaarNumber || 'N/A',
    currentY,
    width - 40 - photoBoxWidth - 10
  );
  currentY = drawRow(
    'PAN No',
    candidate.personalDetails.panNumber || 'N/A',
    'Spouse Name',
    candidate.personalDetails.spouseName || 'N/A',
    currentY,
    width - 40 - photoBoxWidth - 10
  );

  // Resume full width below the photo box
  currentY = Math.min(currentY, photoY - 12);

  // 6. FAMILY DETAILS
  currentY = drawSectionHeader('2. FAMILY DETAILS', currentY);
  currentY = drawRow(
    "Father's Occupation",
    candidate.familyDetails?.fathersOccupation || 'N/A',
    "Father's Mobile",
    candidate.familyDetails?.fathersMobile || 'N/A',
    currentY
  );
  currentY = drawRow(
    "Mother's Occupation",
    candidate.familyDetails?.mothersOccupation || 'N/A',
    "Mother's Mobile",
    candidate.familyDetails?.mothersMobile || 'N/A',
    currentY
  );
  if (candidate.familyDetails?.spouseOccupation || candidate.personalDetails.maritalStatus === 'Married') {
    currentY = drawRow(
      'Spouse Occupation',
      candidate.familyDetails?.spouseOccupation || 'N/A',
      'Spouse Name',
      candidate.personalDetails?.spouseName || candidate.familyDetails?.spouseName || 'N/A',
      currentY
    );
  }

  // 7. ADDRESS DETAILS
  currentY = drawSectionHeader('3. ADDRESS DETAILS', currentY);
  const perm = candidate.addressDetails.permanentAddress;
  const temp = candidate.addressDetails.temporaryAddress;
  const permStr = `${perm.doorNoStreet}, ${perm.villageOrArea}, ${perm.taluk}, ${perm.district}, ${perm.state} - ${perm.pincode}`;
  const tempStr = candidate.addressDetails.sameAsPermanent
    ? 'Same as Permanent Address'
    : `${temp.doorNoStreet}, ${temp.villageOrArea}, ${temp.taluk}, ${temp.district}, ${temp.state} - ${temp.pincode}`;

  page.drawText('Permanent Address:', { x: 26, y: currentY, size: 7.5, font: fontBold, color: grayText });
  currentY -= 10;
  page.drawText(permStr.substring(0, 115), { x: 26, y: currentY, size: 7.5, font: fontRegular, color: darkText });
  currentY -= 12;

  page.drawText('Temporary / Present Address:', { x: 26, y: currentY, size: 7.5, font: fontBold, color: grayText });
  currentY -= 10;
  page.drawText(tempStr.substring(0, 115), { x: 26, y: currentY, size: 7.5, font: fontRegular, color: darkText });
  currentY -= 14;

  // 8. EDUCATION DETAILS
  currentY = drawSectionHeader('4. EDUCATION DETAILS', currentY);
  currentY = drawRow(
    'Highest Qualification',
    candidate.educationDetails.highestQualification,
    'Year of Passing',
    candidate.educationDetails.passingYear,
    currentY
  );
  currentY = drawRow(
    'Institution Name',
    candidate.educationDetails.institutionName,
    'Education / Course Details',
    candidate.educationDetails.educationDetails || candidate.educationDetails.additionalQualification || 'N/A',
    currentY
  );

  // 9. EXPERIENCE DETAILS
  currentY = drawSectionHeader('5. EXPERIENCE DETAILS', currentY);
  const hasExp = candidate.employmentDetails.hasPreviousExperience;
  currentY = drawRow(
    'Previous Experience',
    hasExp ? 'Yes (Experienced)' : 'No (Fresher)',
    'Previous Company',
    hasExp ? (candidate.employmentDetails.previousCompany || candidate.employmentDetails.previousCompanyName || 'N/A') : 'N/A',
    currentY
  );
  if (hasExp) {
    const yearsStr = candidate.employmentDetails.yearsOfExperience !== undefined
      ? `${candidate.employmentDetails.yearsOfExperience} Years`
      : `${candidate.employmentDetails.experienceDurationYears || 0} Yrs, ${candidate.employmentDetails.experienceDurationMonths || 0} Mos`;
    currentY = drawRow(
      'Previous Designation',
      candidate.employmentDetails.previousDesignation || candidate.employmentDetails.previousOccupation || 'N/A',
      'Years of Experience',
      yearsStr,
      currentY
    );
  }

  // 10. OTHER DETAILS & REFERENCE
  currentY = drawSectionHeader('6. OTHER DETAILS & REFERENCE', currentY);
  currentY = drawRow(
    'How did you know about this job?',
    candidate.referenceDetails.referralSource,
    'Reference Name / Contact',
    `${candidate.referenceDetails.referrerName || 'N/A'} ${candidate.referenceDetails.referrerContact ? `(${candidate.referenceDetails.referrerContact})` : ''}`,
    currentY
  );
  if (candidate.referenceDetails.additionalRemarks) {
    page.drawText('Additional Details: ' + candidate.referenceDetails.additionalRemarks.substring(0, 90), {
      x: 26,
      y: currentY,
      size: 7.5,
      font: fontRegular,
      color: darkText,
    });
    currentY -= 12;
  }

  // 11. DECLARATION & SIGNATURE
  currentY = drawSectionHeader('7. DECLARATION', currentY);
  const declarationText =
    'I hereby declare that all the information furnished above is true, complete and correct to the best of my knowledge and belief. I understand that any false or misleading statements may lead to disqualification or dismissal.';
  page.drawText(declarationText.substring(0, 125), { x: 26, y: currentY, size: 7, font: fontRegular, color: grayText });
  currentY -= 9;
  page.drawText(declarationText.substring(125), { x: 26, y: currentY, size: 7, font: fontRegular, color: grayText });
  currentY -= 18;

  // Signature row
  const submittedDateStr = new Date(candidate.submittedAt).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  page.drawText(`Date: ${submittedDateStr}`, {
    x: 26,
    y: currentY,
    size: 8,
    font: fontBold,
    color: darkText,
  });

  page.drawText('Candidate Signature: __________________________', {
    x: width - 250,
    y: currentY,
    size: 8,
    font: fontBold,
    color: darkText,
  });

  currentY -= 16;

  page.drawLine({
    start: { x: 20, y: currentY },
    end: { x: width - 20, y: currentY },
    thickness: 0.6,
    color: borderColor,
  });

  currentY -= 9;
  page.drawText('Rupeeapex Groups of Companies | Official HR Job Application Record', {
    x: 26,
    y: currentY,
    size: 6.5,
    font: fontRegular,
    color: grayText,
  });

  return pdfDoc.save();
}
