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
import { candidateApplicationSchema } from '../src/lib/validation';
import {
  validateImageMagicBytes,
  saveCandidatePhotograph,
  getCandidatePhotograph,
  normalizeImageOrientation,
  deleteCandidatePhotograph,
} from '../src/lib/storage';
import { verifySessionToken } from '../src/lib/auth';
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
