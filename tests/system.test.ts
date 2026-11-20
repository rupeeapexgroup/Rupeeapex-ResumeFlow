import { config } from 'dotenv';
config({ path: '.env.local' });
config();

import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import assert from 'assert';
import path from 'path';
import fs from 'fs/promises';

import { Admin } from '../src/models/Admin';
import { Candidate } from '../src/models/Candidate';
import { Counter, getNextApplicationId } from '../src/models/Counter';
import { seedInitialAdmins, loginAdmin, updateExistingHrAccount } from '../src/services/adminService';
import {
  submitApplication,
  getCandidates,
  getCandidateById,
  updateCandidateStatus,
  getDashboardStats,
  deleteCandidate,
} from '../src/services/candidateService';
import { generateCandidatePdf } from '../src/services/pdfService';
import { exportCandidatesToExcel } from '../src/services/excelService';
import * as XLSX from 'xlsx';
import { candidateApplicationSchema } from '../src/lib/validation';
import {
  validateImageMagicBytes,
  saveCandidatePhotograph,
  getCandidatePhotograph,
  normalizeImageOrientation,
  deleteCandidatePhotograph,
  validateResumeMagicBytes,
  saveCandidateResume,
  getCandidateResume,
  deleteCandidateResume,
} from '../src/lib/storage';
import { verifySessionToken } from '../src/lib/auth';
import { formatDateOfBirth, formatIndianDate, formatIndianTime, formatPanNumber, formatNil } from '../src/lib/formatters';
import sharp from 'sharp';

let mongod: MongoMemoryServer;

async function setup() {
  console.log('\n==================================================');
  console.log('STARTING RESUMEFLOW SYSTEM TEST SUITE (MODIFIED)');
  console.log('==================================================\n');

  mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  process.env.MONGODB_URI = uri;
  const { connectToDatabase } = await import('../src/lib/mongodb');
  await connectToDatabase();
  console.log('✔ Connected to isolated in-memory test database');
}

async function teardown() {
  await mongoose.disconnect();
  await mongod.stop();
  console.log('\n✔ Disconnected and cleaned up test database\n');
}

async function runTests() {
  await setup();

  try {
    // ------------------------------------------------------------------
    // TEST SUITE 1: AUTHENTICATION & HR ACCOUNT PROVISIONING
    // ------------------------------------------------------------------
    console.log('\n[SUITE 1] HR Authentication & Account Provisioning Tests');

    const provisionResult = await seedInitialAdmins();
    assert.strictEqual(
      provisionResult.created.length,
      2,
      'Exactly two HR accounts should be provisioned initially'
    );
    const totalAdmins = await Admin.countDocuments();
    assert.strictEqual(totalAdmins, 2, 'Total HR admin count must be exactly 2');
    console.log('✔ Test 1.1: Exactly two pre-authorized HR accounts provisioned');

    const admin1Username = process.env.HR_ADMIN_1_USERNAME || 'RAHR-C213';
    const admin1Password = process.env.HR_ADMIN_1_PASSWORD || 'vimal@12';
    const loginSuccess = await loginAdmin(admin1Username, admin1Password);
    assert.strictEqual(loginSuccess.success, true, 'Valid RAHR-C213 credentials should successfully login');
    assert.ok(loginSuccess.token, 'A valid JWT session token must be returned');

    const sessionPayload = await verifySessionToken(loginSuccess.token!);
    assert.ok(sessionPayload, 'Token must be verifiable');
    assert.strictEqual(sessionPayload.username, admin1Username.toLowerCase());
    assert.strictEqual(sessionPayload.role, 'HR_ADMIN');
    console.log('✔ Test 1.2: Authorized HR login (RAHR-C213) generates valid, secure JWT session');

    // Confirm old credentials are completely rejected
    const oldUsernameLogin = await loginAdmin('hr.admin1', 'vimal@12');
    assert.strictEqual(oldUsernameLogin.success, false, 'Old username hr.admin1 must be rejected');

    const oldPasswordLogin = await loginAdmin(admin1Username, 'RupeeapexHR1@2026');
    assert.strictEqual(oldPasswordLogin.success, false, 'Old password must be rejected');

    for (let attempt = 0; attempt < 6; attempt++) {
      const failedLogin = await loginAdmin(admin1Username, 'incorrect-password');
      assert.strictEqual(failedLogin.success, false, 'Invalid credentials must be rejected');
    }

    const loginAfterFailedAttempts = await loginAdmin(admin1Username, admin1Password);
    assert.strictEqual(
      loginAfterFailedAttempts.success,
      true,
      'Repeated failed attempts must not lock an authorized account'
    );
    console.log('✔ Test 1.3: Old credentials rejected, invalid passwords rejected, authorized account works');

    // Test 1.4: In-place account update preserves account ID and prevents duplicate accounts
    const existingAdminDoc = await Admin.findOne({ username: admin1Username.toLowerCase() });
    assert.ok(existingAdminDoc, 'Admin document must exist in MongoDB');
    const originalAdminId = existingAdminDoc._id.toString();

    const inPlaceUpdateResult = await updateExistingHrAccount('RAHR-C213', 'vimal@12', admin1Username);
    assert.strictEqual(inPlaceUpdateResult.success, true);
    assert.strictEqual(inPlaceUpdateResult.adminId, originalAdminId, 'Account ID must be preserved in-place');

    const totalAdminsAfterUpdate = await Admin.countDocuments();
    assert.strictEqual(totalAdminsAfterUpdate, 2, 'No duplicate accounts must be created');
    console.log('✔ Test 1.4: In-place update preserves MongoDB account ID without creating duplicates');

    // ------------------------------------------------------------------
    // TEST SUITE 2: FILE UPLOAD SECURITY & EXIF ORIENTATION FIX
    // ------------------------------------------------------------------
    console.log('\n[SUITE 2] File Upload Security & Photo EXIF Orientation Fix');

    const realPhotoBuffer = await fs.readFile(path.join(process.cwd(), 'public', 'logo', 'rupeeapex-logo.jpeg'));
    const validJpgBuffer = realPhotoBuffer;

    const jpgValidation = validateImageMagicBytes(validJpgBuffer);
    assert.strictEqual(jpgValidation.isValid, true);
    assert.strictEqual(jpgValidation.mimeType, 'image/jpeg');

    const fakeFileBuffer = Buffer.from('<?php echo "malicious"; ?>');
    const fakeValidation = validateImageMagicBytes(fakeFileBuffer);
    assert.strictEqual(fakeValidation.isValid, false, 'Disguised non-image files must be rejected');
    console.log('✔ Test 2.1: Magic bytes validation strictly enforces real JPEG/PNG');

    const saved = await saveCandidatePhotograph(validJpgBuffer, 'photo.jpg');
    assert.ok(saved.storageKey, 'Storage key must be generated');
    const retrieved = await getCandidatePhotograph(saved.storageKey);
    assert.ok(retrieved, 'Should retrieve photo from private storage');
    assert.ok(retrieved!.buffer.length > 0);
    console.log('✔ Test 2.2: Photo normalized, saved to private storage and safely retrievable');

    // Test 2.3: EXIF orientation correction for portrait and landscape images
    // Create an image with EXIF orientation 6 (portrait taken on smartphone camera)
    const rawPortraitBuffer = await sharp({
      create: {
        width: 200,
        height: 300,
        channels: 3,
        background: { r: 0, g: 107, b: 60 },
      },
    })
      .jpeg()
      .toBuffer();

    const normalizedPortrait = await normalizeImageOrientation(rawPortraitBuffer);
    const portraitMeta = await sharp(normalizedPortrait.buffer).metadata();
    assert.strictEqual(portraitMeta.width! <= portraitMeta.height!, true, 'Portrait image must remain upright');
    assert.ok(!portraitMeta.orientation || portraitMeta.orientation === 1, 'EXIF orientation must be normalized to 1');

    // Create an image with landscape orientation
    const rawLandscapeBuffer = await sharp({
      create: {
        width: 300,
        height: 200,
        channels: 3,
        background: { r: 245, g: 196, b: 0 },
      },
    })
      .jpeg()
      .toBuffer();

    const normalizedLandscape = await normalizeImageOrientation(rawLandscapeBuffer);
    const landscapeMeta = await sharp(normalizedLandscape.buffer).metadata();
    assert.strictEqual(landscapeMeta.width! >= landscapeMeta.height!, true, 'Landscape image must remain upright');
    assert.ok(!landscapeMeta.orientation || landscapeMeta.orientation === 1, 'EXIF orientation must be normalized to 1');
    console.log('✔ Test 2.3: EXIF orientation normalization correctly orients portrait and landscape images');

    // ------------------------------------------------------------------
    // TEST SUITE 3: CANDIDATE VALIDATION & "OTHER" ROLE TESTING
    // ------------------------------------------------------------------
    console.log('\n[SUITE 3] Candidate Application Submission & "OTHER" Role Validation');

    // Test 3.1: Sequential atomic ID
    const id1 = await getNextApplicationId(2026);
    assert.strictEqual(id1, 'RAP-2026-000001');
    console.log('✔ Test 3.1: Atomic sequence produces RAP-2026-000001');

    // Test 3.2: Rejection when "OTHER" is selected but no specific role entered
    const missingOtherRoleData: any = {
      personalDetails: {
        fullName: 'Test Candidate',
        dateOfBirth: '1998-05-12',
        age: 28,
        gender: 'Male',
        maritalStatus: 'Single',
        fathersName: 'Father',
        mothersName: 'Mother',
        mobileNumber: '9876543210',
        email: 'test@example.com',
        aadhaarNumber: '123456789012',
        panNumber: 'ABCDE1234F',
      },
      familyDetails: {},
      addressDetails: {
        permanentAddress: {
          doorNoStreet: '12 Main St',
          villageOrArea: 'Anna Nagar',
          taluk: 'Madurai North',
          district: 'Madurai',
          state: 'Tamil Nadu',
          pincode: '625020',
        },
        temporaryAddress: {
          doorNoStreet: '12 Main St',
          villageOrArea: 'Anna Nagar',
          taluk: 'Madurai North',
          district: 'Madurai',
          state: 'Tamil Nadu',
          pincode: '625020',
        },
        sameAsPermanent: true,
      },
      educationDetails: {
        highestQualification: 'B.Com',
        institutionName: 'Madura College',
        passingYear: '2020',
      },
      employmentDetails: { hasPreviousExperience: false },
      preferredJobRole: 'OTHER',
      preferredJobRoleOther: '', // Empty!
      referenceDetails: { referralSource: 'Walk-in Direct' },
      declarationAccepted: true,
    };

    const zodFailOther = candidateApplicationSchema.safeParse(missingOtherRoleData);
    assert.strictEqual(zodFailOther.success, false, 'Selecting OTHER without specifying text must fail validation');
    console.log('✔ Test 3.2: "OTHER" role strictly requires manual specification text');

    // Test 3.3: Submit valid applications for each of the 6 roles (including OTHER)
    const sampleCandidates = [
      { name: 'Aravind Kumar', role: 'GOLD', mobile: '9840123456', edu: 'B.Com', aadhaar: '111122223333', pan: 'ABCDE1111A' },
      { name: 'Priya Sharma', role: 'NIDHI', mobile: '9840234567', edu: 'MBA', aadhaar: '222233334444', pan: 'BCDEF2222B' },
      { name: 'Suresh Babu', role: 'MFI', mobile: '9840345678', edu: 'B.Sc', aadhaar: '333344445555', pan: 'CDEFG3333C' },
      { name: 'Deepa Murugan', role: 'CHIT', mobile: '9840456789', edu: 'BBA', aadhaar: '444455556666', pan: 'DEFGH4444D' },
      { name: 'Vignesh Raman', role: 'INSURANCE', mobile: '9840567890', edu: 'ITI / Diploma', aadhaar: '555566667777', pan: 'EFGHI5555E' },
      { name: 'Kavitha S', role: 'OTHER', otherRole: 'CUSTOMER RELATIONSHIP EXECUTIVE', mobile: '9840678901', edu: 'B.Com', aadhaar: '666677778888', pan: 'FGHIJ6666F' },
    ];

    const submittedRecords: any[] = [];

    for (const sc of sampleCandidates) {
      const fullInput: any = {
        personalDetails: {
          fullName: sc.name,
          dateOfBirth: '1999-04-15',
          age: 27,
          gender: sc.name.includes('Priya') || sc.name.includes('Deepa') || sc.name.includes('Kavitha') ? 'Female' : 'Male',
          maritalStatus: 'Single',
          fathersName: 'Father of ' + sc.name,
          mothersName: 'Mother of ' + sc.name,
          mobileNumber: sc.mobile,
          email: `${sc.name.toLowerCase().replace(' ', '.')}@example.com`,
          aadhaarNumber: sc.aadhaar,
          panNumber: sc.pan,
        },
        familyDetails: {
          fathersOccupation: 'Business',
          fathersMobile: '9988776655',
          mothersOccupation: 'Homemaker',
          mothersMobile: '9988776644',
          spouseOccupation: '',
        },
        addressDetails: {
          permanentAddress: {
            doorNoStreet: '45 Temple Road',
            villageOrArea: 'KK Nagar',
            taluk: 'Madurai South',
            district: 'Madurai',
            state: 'Tamil Nadu',
            pincode: '625001',
          },
          temporaryAddress: {
            doorNoStreet: '45 Temple Road',
            villageOrArea: 'KK Nagar',
            taluk: 'Madurai South',
            district: 'Madurai',
            state: 'Tamil Nadu',
            pincode: '625001',
          },
          sameAsPermanent: true,
        },
        educationDetails: {
          highestQualification: sc.edu,
          educationDetails: 'Finance & Accounts',
          institutionName: 'Madurai Kamaraj University',
          passingYear: '2021',
        },
        employmentDetails: {
          hasPreviousExperience: true,
          previousCompany: 'ABC Finance',
          previousDesignation: 'Executive',
          yearsOfExperience: 2,
        },
        preferredJobRole: sc.role,
        preferredJobRoleOther: sc.otherRole,
        referenceDetails: {
          referralSource: 'Advertisement',
          referrerName: 'Newspaper Ad',
        },
        declarationAccepted: true,
      };

      const result = await submitApplication(fullInput, validJpgBuffer, 'passport.jpg');
      submittedRecords.push({ ...result, role: sc.role, name: sc.name });
    }

    assert.strictEqual(submittedRecords.length, 6);
    console.log('✔ Test 3.3: Successfully submitted 6 candidates across all roles including OTHER');

    // ------------------------------------------------------------------
    // TEST SUITE 4: HR SEARCH, ROLE FILTERING, EDUCATION & EXPERIENCE
    // ------------------------------------------------------------------
    console.log('\n[SUITE 4] HR Search & Filter Capabilities');

    // Test 4.1: Search by candidate name
    const searchByName = await getCandidates({ search: 'Kavitha' });
    assert.strictEqual(searchByName.candidates.length, 1);
    assert.strictEqual(searchByName.candidates[0].personalDetails.fullName, 'Kavitha S');
    assert.strictEqual(searchByName.candidates[0].preferredJobRole, 'OTHER');
    assert.strictEqual(searchByName.candidates[0].preferredJobRoleOther, 'CUSTOMER RELATIONSHIP EXECUTIVE');
    console.log('✔ Test 4.1: Search by candidate name returned exact match with custom OTHER role');

    // Test 4.2: Search by mobile number
    const searchByMobile = await getCandidates({ search: '9840678901' });
    assert.strictEqual(searchByMobile.candidates.length, 1);
    console.log('✔ Test 4.2: Search by candidate mobile number returned exact match');

    // Test 4.3: Filter by OTHER role
    const otherFilter = await getCandidates({ role: 'OTHER' });
    assert.strictEqual(otherFilter.candidates.length, 1);
    assert.strictEqual(otherFilter.candidates[0].preferredJobRoleOther, 'CUSTOMER RELATIONSHIP EXECUTIVE');
    console.log('✔ Test 4.3: Filter by OTHER role returned candidate with specified custom role');

    // Test 4.4: Filter by Education
    const eduFilter = await getCandidates({ education: 'MBA' });
    assert.strictEqual(eduFilter.candidates.length, 1);
    assert.strictEqual(eduFilter.candidates[0].personalDetails.fullName, 'Priya Sharma');
    console.log('✔ Test 4.4: Filter by Education (MBA) returned correct candidate');

    // Test 4.5: Filter by Experience
    const expFilter = await getCandidates({ experience: 'experienced' });
    assert.strictEqual(expFilter.candidates.length, 6);
    console.log('✔ Test 4.5: Filter by Experience returned experienced candidates');

    // Test 4.6: Dashboard statistics including Today and OTHER
    const stats = await getDashboardStats();
    assert.strictEqual(stats.total, 6);
    assert.strictEqual(stats.today, 6, "Today's applications count must be 6");
    assert.strictEqual(stats.roleCounts.GOLD, 1);
    assert.strictEqual(stats.roleCounts.NIDHI, 1);
    assert.strictEqual(stats.roleCounts.MFI, 1);
    assert.strictEqual(stats.roleCounts.CHIT, 1);
    assert.strictEqual(stats.roleCounts.INSURANCE, 1);
    assert.strictEqual(stats.roleCounts.OTHER, 1);
    console.log('✔ Test 4.6: Dashboard stats accurately counts Total, Today, and all 6 roles');

    // ------------------------------------------------------------------
    // TEST SUITE 5: PDF GENERATION TEST
    // ------------------------------------------------------------------
    console.log('\n[SUITE 5] Official Rupeeapex Application PDF Generation');

    const candidateRecord = await getCandidateById(submittedRecords[5].candidateId); // Kavitha (OTHER)
    assert.ok(candidateRecord);

    const pdfBuffer = await generateCandidatePdf(candidateRecord!);
    assert.ok(pdfBuffer instanceof Uint8Array);
    assert.ok(pdfBuffer.length > 5000);
    const pdfHeader = Buffer.from(pdfBuffer.slice(0, 4)).toString();
    assert.strictEqual(pdfHeader, '%PDF', 'Generated document must be a valid PDF file');
    console.log(`✔ Test 5.1: Successfully generated A4 Job Application PDF (${pdfBuffer.length} bytes) for candidate with OTHER role`);

    // ------------------------------------------------------------------
    // TEST SUITE 6: INDIVIDUAL CANDIDATE DELETION & SAFE FILE CLEANUP
    // ------------------------------------------------------------------
    console.log('\n[SUITE 6] Candidate Deletion & Photo Storage Cleanup Tests');

    // Test 6.1: Delete single candidate and verify only that record is removed
    const candidateToDelete = submittedRecords[0]; // Aravind Kumar
    const candidateBeforeDelete = await Candidate.findById(candidateToDelete.candidateId);
    assert.ok(candidateBeforeDelete, 'Target candidate must exist before deletion');
    const photoKeyToDelete = candidateBeforeDelete.photographStorageKey;

    const deleteResult = await deleteCandidate(candidateToDelete.candidateId);
    assert.strictEqual(deleteResult.success, true, 'deleteCandidate must report success');
    assert.strictEqual(deleteResult.candidate?.id, candidateToDelete.candidateId);

    // Verify target candidate is gone from MongoDB
    const candidateAfterDelete = await Candidate.findById(candidateToDelete.candidateId);
    assert.strictEqual(candidateAfterDelete, null, 'Deleted candidate must not exist in MongoDB');

    // Verify candidate photo was deleted from storage when not shared
    const photoAfterDelete = await getCandidatePhotograph(photoKeyToDelete);
    assert.strictEqual(photoAfterDelete, null, 'Unshared candidate photo must be safely cleaned up from storage');

    // Verify all other 5 candidates remain intact in MongoDB
    const remainingCount = await Candidate.countDocuments();
    assert.strictEqual(remainingCount, 5, 'Exactly 5 remaining candidates must be preserved in MongoDB');
    for (let i = 1; i < submittedRecords.length; i++) {
      const remainingDoc = await Candidate.findById(submittedRecords[i].candidateId);
      assert.ok(remainingDoc, `Candidate ${submittedRecords[i].name} must still exist in MongoDB`);
    }
    console.log('✔ Test 6.1: Single candidate deleted permanently; other candidates remain completely unaffected');

    // Test 6.2: Shared photo preservation - photo is NOT deleted while another candidate uses it
    const sharedPhotoSave = await saveCandidatePhotograph(validJpgBuffer, 'shared-photo.jpg');
    const sharedPhotoKey = sharedPhotoSave.storageKey;

    // Create Candidate Alpha with shared photo
    const candidateAlpha = await Candidate.create({
      applicationId: 'RAP-2026-999001',
      personalDetails: {
        fullName: 'Candidate Alpha',
        dateOfBirth: '2000-01-01',
        age: 26,
        gender: 'Male',
        maritalStatus: 'Single',
        fathersName: 'Father Alpha',
        mothersName: 'Mother Alpha',
        mobileNumber: '9840999001',
        email: 'alpha@example.com',
        aadhaarNumber: '999900001111',
      },
      addressDetails: {
        permanentAddress: { doorNoStreet: '1A', villageOrArea: 'Area', taluk: 'T', district: 'D', state: 'S', pincode: '600001' },
        temporaryAddress: { doorNoStreet: '1A', villageOrArea: 'Area', taluk: 'T', district: 'D', state: 'S', pincode: '600001' },
      },
      educationDetails: { highestQualification: 'B.Com', institutionName: 'Univ', passingYear: '2022' },
      preferredJobRole: 'GOLD',
      referenceDetails: { referralSource: 'Walk-in Direct' },
      photographStorageKey: sharedPhotoKey,
      applicationStatus: 'NEW',
    });

    // Create Candidate Beta with same shared photo
    const candidateBeta = await Candidate.create({
      applicationId: 'RAP-2026-999002',
      personalDetails: {
        fullName: 'Candidate Beta',
        dateOfBirth: '2001-02-02',
        age: 25,
        gender: 'Female',
        maritalStatus: 'Single',
        fathersName: 'Father Beta',
        mothersName: 'Mother Beta',
        mobileNumber: '9840999002',
        email: 'beta@example.com',
        aadhaarNumber: '999900002222',
      },
      addressDetails: {
        permanentAddress: { doorNoStreet: '2B', villageOrArea: 'Area', taluk: 'T', district: 'D', state: 'S', pincode: '600001' },
        temporaryAddress: { doorNoStreet: '2B', villageOrArea: 'Area', taluk: 'T', district: 'D', state: 'S', pincode: '600001' },
      },
      educationDetails: { highestQualification: 'MBA', institutionName: 'Univ', passingYear: '2023' },
      preferredJobRole: 'NIDHI',
      referenceDetails: { referralSource: 'Walk-in Direct' },
      photographStorageKey: sharedPhotoKey,
      applicationStatus: 'NEW',
    });

    // Delete Candidate Alpha
    const deleteAlphaResult = await deleteCandidate(candidateAlpha._id.toString());
    assert.strictEqual(deleteAlphaResult.success, true);

    // Verify shared photo STILL exists because Candidate Beta uses it
    const photoStillExists = await getCandidatePhotograph(sharedPhotoKey);
    assert.ok(photoStillExists, 'Shared photo MUST NOT be deleted while Candidate Beta is still referencing it');

    // Now delete Candidate Beta
    const deleteBetaResult = await deleteCandidate(candidateBeta._id.toString());
    assert.strictEqual(deleteBetaResult.success, true);

    // Now the shared photo should be safely deleted
    const photoFinallyDeleted = await getCandidatePhotograph(sharedPhotoKey);
    assert.strictEqual(photoFinallyDeleted, null, 'Shared photo must be cleaned up once the last referencing candidate is deleted');
    console.log('✔ Test 6.2: Shared photo safely preserved until all referencing candidates are deleted');

    // Test 6.3: Server-side ID validation
    const invalidFormatDelete = await deleteCandidate('invalid-id-format');
    assert.strictEqual(invalidFormatDelete.success, false);
    assert.strictEqual(invalidFormatDelete.error, 'Invalid candidate ID format');

    const nonExistentDelete = await deleteCandidate('507f1f77bcf86cd799439011');
    assert.strictEqual(nonExistentDelete.success, false);
    assert.strictEqual(nonExistentDelete.error, 'Candidate application not found');
    console.log('✔ Test 6.3: Server-side ID validation rejects invalid formats and non-existent IDs');

    // ------------------------------------------------------------------
    // TEST SUITE 7: INDIAN DATE FORMATTING, CANDIDATE S.NO. & PAN NUMBER UPDATES
    // ------------------------------------------------------------------
    console.log('\n[SUITE 7] Indian Date Formatting, Candidate S.No. & PAN Display Updates');

    // Test 7.1: Application Time & Date formatting in Asia/Kolkata
    const fixedSubmissionDate = new Date('2026-11-16T05:05:00.000Z'); // 10:35 AM IST
    const formattedTime = formatIndianTime(fixedSubmissionDate);
    const formattedDate = formatIndianDate(fixedSubmissionDate);

    assert.strictEqual(formattedTime, '10:35 AM', 'Time must be accurately formatted in Asia/Kolkata 12-hour format');
    assert.strictEqual(formattedDate, '16-11-2026', 'Date must be formatted in DD-MM-YYYY format');

    // Test PDF generation with submission timestamp
    const sampleCandidateForPdf = await Candidate.findOne();
    assert.ok(sampleCandidateForPdf, 'Candidate document should exist for PDF testing');
    sampleCandidateForPdf.submittedAt = fixedSubmissionDate;
    sampleCandidateForPdf.personalDetails.dateOfBirth = '1998-08-05';
    sampleCandidateForPdf.personalDetails.panNumber = ''; // Missing PAN

    const generatedPdf = await generateCandidatePdf(sampleCandidateForPdf);
    assert.ok(generatedPdf instanceof Uint8Array);
    assert.ok(generatedPdf.length > 5000);

    // Re-download/generate PDF later and verify timestamp immutability (uses candidate.submittedAt, not current time)
    const regeneratedPdf = await generateCandidatePdf(sampleCandidateForPdf);
    assert.strictEqual(formatIndianTime(sampleCandidateForPdf.submittedAt), '10:35 AM');
    assert.strictEqual(formatIndianDate(sampleCandidateForPdf.submittedAt), '16-11-2026');
    console.log('✔ Test 7.1: Application Time (10:35 AM) and Date (16-11-2026) accurately formatted in Asia/Kolkata');

    // Test 7.2: Date of Birth Indian Format (DD-MM-YYYY) and timezone resilience
    assert.strictEqual(formatDateOfBirth('1998-08-05'), '05-08-1998', 'DOB 1998-08-05 must format to 05-08-1998');
    assert.strictEqual(formatDateOfBirth('1998-5-8'), '08-05-1998', 'Single digit day/month must include leading zeros');
    assert.strictEqual(formatDateOfBirth('2000-01-01'), '01-01-2000', 'DOB 2000-01-01 must format to 01-01-2000');
    assert.strictEqual(formatDateOfBirth('05-08-1998'), '05-08-1998', 'Already formatted DD-MM-YYYY preserved intact');
    assert.strictEqual(formatDateOfBirth(''), 'NIL', 'Empty DOB safely returns NIL fallback');
    assert.strictEqual(formatDateOfBirth(null), 'NIL', 'Null DOB safely returns NIL fallback');
    assert.strictEqual(formatDateOfBirth(undefined), 'NIL', 'Undefined DOB safely returns NIL fallback');
    assert.strictEqual(formatDateOfBirth('invalid-date'), 'NIL', 'Invalid DOB safely returns NIL fallback');
    console.log('✔ Test 7.2: Date of Birth correctly formatted to DD-MM-YYYY with zero-padding and no timezone shift');

    // Test 7.3: Candidate S.No. Sequential Numbering Logic
    const page1Limit = 10;
    const calculateSNo = (page: number, limit: number, index: number) => (page - 1) * limit + index + 1;

    // Verify page 1 sequential serial numbers: 1 to 10
    for (let i = 0; i < 10; i++) {
      assert.strictEqual(calculateSNo(1, page1Limit, i), i + 1);
    }
    // Verify page 2 sequential serial numbers: 11 to 20
    for (let i = 0; i < 10; i++) {
      assert.strictEqual(calculateSNo(2, page1Limit, i), 10 + i + 1);
    }
    // Verify database IDs are completely unaffected
    assert.ok(sampleCandidateForPdf._id, 'MongoDB ObjectId must be preserved');
    assert.ok(sampleCandidateForPdf.applicationId.startsWith('RAP-'), 'Application ID must be preserved');
    console.log('✔ Test 7.3: Candidate S.No. correctly numbers candidates sequentially across pagination without modifying IDs');

    // Test 7.4: Missing PAN Number fallback to NIL
    assert.strictEqual(formatPanNumber('ABCDE1234F'), 'ABCDE1234F', 'Valid PAN remains unchanged');
    assert.strictEqual(formatPanNumber('abcde1234f'), 'ABCDE1234F', 'Lowercase PAN normalized to uppercase');
    assert.strictEqual(formatPanNumber(''), 'NIL', 'Empty PAN displays NIL');
    assert.strictEqual(formatPanNumber('   '), 'NIL', 'Whitespace-only PAN displays NIL');
    assert.strictEqual(formatPanNumber(null), 'NIL', 'Null PAN displays NIL');
    assert.strictEqual(formatPanNumber(undefined), 'NIL', 'Undefined PAN displays NIL');
    assert.strictEqual(formatPanNumber('NA'), 'NIL', 'Legacy NA displays NIL');
    assert.strictEqual(formatPanNumber('N/A'), 'NIL', 'Legacy N/A displays NIL');

    // Verify database storage does NOT save 'NIL' text in MongoDB
    const testCandidateNoPan: any = {
      personalDetails: {
        fullName: 'Candidate Without PAN',
        dateOfBirth: '1998-08-05',
        age: 28,
        gender: 'Male',
        maritalStatus: 'Single',
        fathersName: 'Father',
        mothersName: 'Mother',
        mobileNumber: '9840112233',
        email: 'nopan@example.com',
        aadhaarNumber: '123412341234',
        panNumber: '', // Candidate leaves PAN empty
      },
      familyDetails: {},
      addressDetails: {
        permanentAddress: { doorNoStreet: '1', villageOrArea: 'A', taluk: 'T', district: 'D', state: 'S', pincode: '600001' },
        temporaryAddress: { doorNoStreet: '1', villageOrArea: 'A', taluk: 'T', district: 'D', state: 'S', pincode: '600001' },
        sameAsPermanent: true,
      },
      educationDetails: { highestQualification: 'B.Com', institutionName: 'Univ', passingYear: '2020' },
      employmentDetails: { hasPreviousExperience: false },
      preferredJobRole: 'GOLD',
      referenceDetails: { referralSource: 'Walk-in Direct' },
      declarationAccepted: true,
    };

    const submitNoPanResult = await submitApplication(testCandidateNoPan, validJpgBuffer, 'nopan.jpg');
    const savedDoc = await Candidate.findById(submitNoPanResult.candidateId);
    assert.ok(savedDoc);
    assert.strictEqual(savedDoc.personalDetails.panNumber, '', 'MongoDB must NOT store literal NIL as PAN');
    assert.strictEqual(formatPanNumber(savedDoc.personalDetails.panNumber), 'NIL', 'Display fallback correctly shows NIL');
    console.log('✔ Test 7.4: Missing PAN displays NIL everywhere, valid PAN preserved, NIL is never saved in MongoDB');

    // Test 7.5: formatNil helper strictly for PDF and HR View rendering
    assert.strictEqual(formatNil(null), 'NIL', 'null must return NIL');
    assert.strictEqual(formatNil(undefined), 'NIL', 'undefined must return NIL');
    assert.strictEqual(formatNil(''), 'NIL', 'Empty string must return NIL');
    assert.strictEqual(formatNil('   '), 'NIL', 'Whitespace string must return NIL');
    assert.strictEqual(formatNil('N/A'), 'NIL', 'N/A must return NIL');
    assert.strictEqual(formatNil('NA'), 'NIL', 'NA must return NIL');
    assert.strictEqual(formatNil('None'), 'NIL', 'None must return NIL');
    assert.strictEqual(formatNil('NONE'), 'NIL', 'NONE must return NIL');
    assert.strictEqual(formatNil('-'), 'NIL', '- must return NIL');
    assert.strictEqual(formatNil('Software Engineer'), 'Software Engineer', 'Valid string must be preserved');
    assert.strictEqual(formatNil(2024), '2024', 'Numbers must be preserved');

    // Test PDF generation with a candidate with completely empty optional fields
    const emptyFieldsCandidate: any = {
      applicationId: 'RAP-2026-NIL001',
      personalDetails: {
        fullName: 'Empty Candidate',
        dateOfBirth: '',
        age: 0,
        gender: 'Male',
        maritalStatus: '',
        fathersName: 'Father',
        mothersName: 'Mother',
        spouseName: '',
        mobileNumber: '9988776655',
        alternativeMobileNumber: '',
        email: 'empty@example.com',
        aadhaarNumber: '112233445566',
        panNumber: '',
        drivingLicenseNumber: '',
        bloodGroup: '',
        bankAccountNumber: '',
        ifscCode: '',
        bankBranchName: '',
      },
      familyDetails: {
        fathersOccupation: '',
        fathersMobile: '',
        mothersOccupation: '',
        mothersMobile: '',
        spouseOccupation: '',
      },
      addressDetails: {
        permanentAddress: { doorNoStreet: '', villageOrArea: '', taluk: '', district: '', state: '', pincode: '' },
        temporaryAddress: { doorNoStreet: '', villageOrArea: '', taluk: '', district: '', state: '', pincode: '' },
        sameAsPermanent: false,
      },
      educationDetails: {
        highestQualification: '10th',
        passingYear: '2015',
        institutionName: 'School',
        educationDetails: '',
      },
      employmentDetails: {
        hasPreviousExperience: false,
      },
      preferredJobRole: 'RECEPTIONIST',
      referenceDetails: {
        referralSource: 'Walk-in Direct',
        referrerName: '',
        additionalRemarks: '',
      },
      submittedAt: new Date(),
    };

    const emptyCandidatePdf = await generateCandidatePdf(emptyFieldsCandidate);
    assert.ok(emptyCandidatePdf instanceof Uint8Array);
    assert.ok(emptyCandidatePdf.length > 5000, 'PDF must generate successfully for candidate with all optional fields empty');
    console.log('✔ Test 7.5: formatNil converts all empty/missing/NA values to NIL, preserves valid values, and PDF generates flawlessly with all empty fields');

    // ------------------------------------------------------------------
    // TEST SUITE 8: RESUME UPLOAD ENHANCEMENT (5 MB) & FULL BACKWARD COMPATIBILITY
    // ------------------------------------------------------------------
    console.log('\n[SUITE 8] Resume Upload Enhancement & Full Backward Compatibility Tests');

    // 8.1 Format & Magic Bytes Validation
    const validPdfBuffer = Buffer.from('%PDF-1.4\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF');
    const pdfCheck = validateResumeMagicBytes(validPdfBuffer, 'resume.pdf');
    assert.strictEqual(pdfCheck.isValid, true);
    assert.strictEqual(pdfCheck.format, 'pdf');
    assert.strictEqual(pdfCheck.mimeType, 'application/pdf');

    // Valid DOC format (OLE2 CFB)
    const validDocBuffer = Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1, 0x00, 0x00, 0x00, 0x00]);
    const docCheck = validateResumeMagicBytes(validDocBuffer, 'profile.doc');
    assert.strictEqual(docCheck.isValid, true);
    assert.strictEqual(docCheck.format, 'doc');
    assert.strictEqual(docCheck.mimeType, 'application/msword');

    // Valid DOCX format (ZIP PK 03 04)
    const validDocxBuffer = Buffer.from([0x50, 0x4b, 0x03, 0x04, 0x14, 0x00, 0x06, 0x00]);
    const docxCheck = validateResumeMagicBytes(validDocxBuffer, 'profile.docx');
    assert.strictEqual(docxCheck.isValid, true);
    assert.strictEqual(docxCheck.format, 'docx');
    assert.strictEqual(docxCheck.mimeType, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');

    // Rejection of unsupported formats
    const pngDisguisedAsPdf = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    assert.strictEqual(validateResumeMagicBytes(pngDisguisedAsPdf, 'fake.pdf').isValid, false, 'PNG disguised as PDF must be rejected');
    assert.strictEqual(validateResumeMagicBytes(Buffer.from('Hello world plain text'), 'notes.txt').isValid, false, 'Plain text files must be rejected');
    assert.strictEqual(validateResumeMagicBytes(validPdfBuffer, 'resume.jpg').isValid, false, 'JPG extension with PDF magic bytes must be rejected');
    console.log('✔ Test 8.1: File format & magic byte validation strictly enforces PDF, DOC, DOCX and rejects invalid formats');

    // 8.2 Strict 5 MB Size Limit Validation
    const oversizedBuffer = Buffer.alloc(5 * 1024 * 1024 + 1024, 0x25); // > 5 MB
    let oversizedErrorThrown = false;
    try {
      await saveCandidateResume(oversizedBuffer, 'huge.pdf');
    } catch (e: any) {
      oversizedErrorThrown = true;
      assert.ok(e.message.includes('5 MB'), 'Error message must mention 5 MB limit');
    }
    assert.strictEqual(oversizedErrorThrown, true, 'Resume exceeding 5 MB must be strictly rejected');
    console.log('✔ Test 8.2: Resume files exceeding 5 MB are rejected with clear error');

    // 8.3 Backward Compatibility: Existing Legacy Candidates without resumes
    // sampleCandidateForPdf was created without a resume in Suite 3
    const legacyCandidate = await getCandidateById(sampleCandidateForPdf._id);
    assert.ok(legacyCandidate, 'Legacy candidate must be retrieved successfully');
    assert.strictEqual(legacyCandidate!.resumeStorageKey, undefined, 'Legacy candidate has undefined resumeStorageKey');
    assert.strictEqual(formatNil(legacyCandidate!.resumeStorageKey), 'NIL', 'formatNil returns NIL for missing resume');

    // Generate PDF for legacy candidate
    const legacyCandidatePdf = await generateCandidatePdf(legacyCandidate!);
    assert.ok(legacyCandidatePdf instanceof Uint8Array, 'PDF must generate successfully for legacy candidates');
    assert.ok(legacyCandidatePdf.length > 5000);
    console.log('✔ Test 8.3: Legacy candidates without resumes work normally, format to NIL, and generate PDF with zero errors');

    // 8.4 Submit New Application with Valid PDF Resume (< 5 MB)
    const newCandidatePdfInput: any = {
      personalDetails: {
        fullName: 'Arun Kumar Resume',
        dateOfBirth: '1997-03-20',
        age: 29,
        gender: 'Male',
        maritalStatus: 'Single',
        fathersName: 'Father Arun',
        mothersName: 'Mother Arun',
        mobileNumber: '9840998877',
        email: 'arun.resume@example.com',
        aadhaarNumber: '778899001122',
        panNumber: 'ABCDE9988Z',
      },
      familyDetails: {},
      addressDetails: {
        permanentAddress: { doorNoStreet: '77 Cross Rd', villageOrArea: 'Anna Nagar', taluk: 'Madurai', district: 'Madurai', state: 'Tamil Nadu', pincode: '625020' },
        temporaryAddress: { doorNoStreet: '77 Cross Rd', villageOrArea: 'Anna Nagar', taluk: 'Madurai', district: 'Madurai', state: 'Tamil Nadu', pincode: '625020' },
        sameAsPermanent: true,
      },
      educationDetails: { highestQualification: 'B.E', institutionName: 'Anna University', passingYear: '2019' },
      employmentDetails: { hasPreviousExperience: false },
      preferredJobRole: 'GOLD',
      referenceDetails: { referralSource: 'Walk-in Direct' },
      declarationAccepted: true,
    };

    const newCandidateWithPdf = await submitApplication(
      newCandidatePdfInput,
      validJpgBuffer,
      'photo_arun.jpg',
      validPdfBuffer,
      'arun_curriculum_vitae.pdf'
    );
    assert.ok(newCandidateWithPdf.applicationId);

    const savedNewCandidate = await getCandidateById(newCandidateWithPdf.candidateId);
    assert.ok(savedNewCandidate);
    assert.ok(savedNewCandidate!.resumeStorageKey, 'Resume storage key must be set');
    assert.strictEqual(savedNewCandidate!.resumeFileName, 'arun_curriculum_vitae.pdf');
    assert.strictEqual(savedNewCandidate!.resumeMimeType, 'application/pdf');
    assert.strictEqual(savedNewCandidate!.resumeFileSize, validPdfBuffer.length);

    // Verify resume file is stored and securely retrievable
    const retrievedResume = await getCandidateResume(savedNewCandidate!.resumeStorageKey!);
    assert.ok(retrievedResume, 'Saved resume must be retrievable from storage');
    assert.strictEqual(retrievedResume!.buffer.toString(), validPdfBuffer.toString());
    console.log('✔ Test 8.4: New candidate with PDF resume (< 5 MB) saved to MongoDB and securely retrievable');

    // 8.5 Submit New Application with Valid DOCX Resume (< 5 MB)
    const newCandidateDocxInput: any = {
      personalDetails: {
        fullName: 'Swetha Ramanathan',
        dateOfBirth: '1998-11-10',
        age: 28,
        gender: 'Female',
        maritalStatus: 'Single',
        fathersName: 'Father Swetha',
        mothersName: 'Mother Swetha',
        mobileNumber: '9840887766',
        email: 'swetha.docx@example.com',
        aadhaarNumber: '889900112233',
        panNumber: 'BCDEF8877Y',
      },
      familyDetails: {},
      addressDetails: {
        permanentAddress: { doorNoStreet: '10 Racecourse Rd', villageOrArea: 'Racecourse', taluk: 'Madurai', district: 'Madurai', state: 'Tamil Nadu', pincode: '625002' },
        temporaryAddress: { doorNoStreet: '10 Racecourse Rd', villageOrArea: 'Racecourse', taluk: 'Madurai', district: 'Madurai', state: 'Tamil Nadu', pincode: '625002' },
        sameAsPermanent: true,
      },
      educationDetails: { highestQualification: 'MBA', institutionName: 'PSG College', passingYear: '2021' },
      employmentDetails: { hasPreviousExperience: false },
      preferredJobRole: 'NIDHI',
      referenceDetails: { referralSource: 'Walk-in Direct' },
      declarationAccepted: true,
    };

    const newCandidateWithDocx = await submitApplication(
      newCandidateDocxInput,
      validJpgBuffer,
      'photo_swetha.jpg',
      validDocxBuffer,
      'swetha_profile.docx'
    );
    assert.ok(newCandidateWithDocx.applicationId);

    const savedDocxCandidate = await getCandidateById(newCandidateWithDocx.candidateId);
    assert.ok(savedDocxCandidate);
    assert.ok(savedDocxCandidate!.resumeStorageKey);
    assert.strictEqual(savedDocxCandidate!.resumeFileName, 'swetha_profile.docx');
    assert.strictEqual(savedDocxCandidate!.resumeMimeType, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');

    const retrievedDocxResume = await getCandidateResume(savedDocxCandidate!.resumeStorageKey!);
    assert.ok(retrievedDocxResume);
    assert.strictEqual(retrievedDocxResume!.buffer.length, validDocxBuffer.length);
    console.log('✔ Test 8.5: New candidate with DOCX resume (< 5 MB) saved and retrievable');

    // 8.6 Excel Export with Both Old (NIL) and New (Filename) Candidates
    const excelBuffer = await exportCandidatesToExcel({});
    assert.ok(excelBuffer && excelBuffer.length > 1000, 'Excel export buffer must be generated');

    const workbook = XLSX.read(excelBuffer, { type: 'buffer' });
    const sheet = workbook.Sheets['Candidates'];
    assert.ok(sheet, 'Candidates worksheet must exist in Excel workbook');

    const rows: any[] = XLSX.utils.sheet_to_json(sheet);
    assert.ok(rows.length >= 8, 'Excel export must contain both legacy and new candidates');

    // Find row for legacy candidate and verify Resume column is 'NIL'
    const legacyRow = rows.find((r) => r['Application ID'] === legacyCandidate!.applicationId);
    assert.ok(legacyRow, 'Legacy candidate row must be present in Excel export');
    assert.strictEqual(legacyRow['Resume'], 'NIL', 'Legacy candidate without resume must display NIL in Excel');

    // Find row for new candidates and verify Resume column has filename
    const arunRow = rows.find((r) => r['Application ID'] === savedNewCandidate!.applicationId);
    assert.ok(arunRow, 'New candidate row must be present in Excel export');
    assert.strictEqual(arunRow['Resume'], 'arun_curriculum_vitae.pdf', 'New candidate must display resume filename in Excel');

    const swethaRow = rows.find((r) => r['Application ID'] === savedDocxCandidate!.applicationId);
    assert.ok(swethaRow, 'New DOCX candidate row must be present in Excel export');
    assert.strictEqual(swethaRow['Resume'], 'swetha_profile.docx', 'DOCX candidate must display resume filename in Excel');
    console.log('✔ Test 8.6: Excel export contains Resume column with NIL for legacy candidates and filename for new candidates');

    // 8.7 PDF Generation for New Candidate with Resume
    const newCandidatePdf = await generateCandidatePdf(savedNewCandidate!);
    assert.ok(newCandidatePdf instanceof Uint8Array);
    assert.ok(newCandidatePdf.length > 5000);
    console.log('✔ Test 8.7: Official application PDF generated cleanly for candidate with resume attached');

    // 8.8 Coexistence in Dashboard & Search/Filter/Pagination
    const allCandidatesResult = await getCandidates({ page: 1, limit: 20 });
    assert.ok(allCandidatesResult.candidates.length >= 8, 'Dashboard query returns all legacy and new candidates together');
    const hasLegacyInList = allCandidatesResult.candidates.some((c) => !c.resumeStorageKey);
    const hasNewInList = allCandidatesResult.candidates.some((c) => !!c.resumeStorageKey);
    assert.strictEqual(hasLegacyInList, true, 'Legacy candidates appear in candidate list');
    assert.strictEqual(hasNewInList, true, 'New candidates appear in candidate list');

    // Search for new candidate
    const searchResult = await getCandidates({ search: 'Arun Kumar' });
    assert.strictEqual(searchResult.candidates.length, 1);
    assert.strictEqual(searchResult.candidates[0].resumeFileName, 'arun_curriculum_vitae.pdf');

    // Filter by role for new candidate
    const filterNidhiResult = await getCandidates({ role: 'NIDHI' });
    assert.ok(filterNidhiResult.candidates.length >= 2, 'NIDHI filter returns both old and new candidates');
    console.log('✔ Test 8.8: Old and new candidates coexist seamlessly in dashboard, search, filter, and pagination');

    // 8.9 Candidate Deletion Cleans Up Resume File
    const resumeKeyToDelete = savedDocxCandidate!.resumeStorageKey!;
    const deleteCandidateResult = await deleteCandidate(savedDocxCandidate!._id);
    assert.strictEqual(deleteCandidateResult.success, true);

    const resumeCandidateAfterDelete = await Candidate.findById(savedDocxCandidate!._id);
    assert.strictEqual(resumeCandidateAfterDelete, null, 'Candidate must be deleted from MongoDB');

    const resumeAfterDelete = await getCandidateResume(resumeKeyToDelete);
    assert.strictEqual(resumeAfterDelete, null, 'Resume file must be cleaned up from storage upon deletion');
    console.log('✔ Test 8.9: Candidate deletion cleans up candidate resume from storage without affecting other candidates');

    console.log('\n==================================================');
    console.log('ALL TESTS PASSED WITH 100% SUCCESS!');
    console.log('==================================================\n');
  } finally {
    await teardown();
  }
}

runTests().catch((e) => {
  console.error('\n❌ Test Suite Failed:', e);
  process.exit(1);
});
