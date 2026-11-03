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
import { seedInitialAdmins, loginAdmin } from '../src/services/adminService';
import {
  submitApplication,
  getCandidates,
  getCandidateById,
  updateCandidateStatus,
  getDashboardStats,
} from '../src/services/candidateService';
import { generateCandidatePdf } from '../src/services/pdfService';
import { candidateApplicationSchema } from '../src/lib/validation';
import { validateImageMagicBytes, saveCandidatePhotograph, getCandidatePhotograph } from '../src/lib/storage';
import { verifySessionToken } from '../src/lib/auth';

let mongod: MongoMemoryServer;

async function setup() {
  console.log('\n==================================================');
  console.log('STARTING RESUMEFLOW AUTOMATED SYSTEM TEST SUITE');
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

    // Test 1.1: Provisioning exactly two authorized HR accounts
    const provisionResult = await seedInitialAdmins();
    assert.strictEqual(
      provisionResult.created.length,
      2,
      'Exactly two HR accounts should be provisioned initially'
    );
    const totalAdmins = await Admin.countDocuments();
    assert.strictEqual(totalAdmins, 2, 'Total HR admin count must be exactly 2');
    console.log('✔ Test 1.1: Exactly two pre-authorized HR accounts provisioned');

    // Test 1.2: Idempotent provisioning (re-running does not duplicate)
    const secondProvision = await seedInitialAdmins();
    assert.strictEqual(secondProvision.created.length, 0, 'No new accounts should be created on second run');
    assert.strictEqual(secondProvision.existing.length, 2, 'Both accounts should be recognized as existing');
    console.log('✔ Test 1.2: Admin provisioning is safely idempotent');

    // Test 1.3: Login with correct credentials
    const admin1Username = process.env.HR_ADMIN_1_USERNAME || 'hr.admin1';
    const admin1Password = process.env.HR_ADMIN_1_PASSWORD || 'RupeeapexHR1@2026';
    const loginSuccess = await loginAdmin(admin1Username, admin1Password);
    assert.strictEqual(loginSuccess.success, true, 'Valid credentials should successfully login');
    assert.ok(loginSuccess.token, 'A valid JWT session token must be returned');

    const sessionPayload = await verifySessionToken(loginSuccess.token!);
    assert.ok(sessionPayload, 'Token must be verifiable');
    assert.strictEqual(sessionPayload.username, admin1Username.toLowerCase());
    assert.strictEqual(sessionPayload.role, 'HR_ADMIN');
    console.log('✔ Test 1.3: Authorized HR login generates valid, secure JWT session');

    // Test 1.4: Login with incorrect password
    const loginFail = await loginAdmin(admin1Username, 'WrongPassword123!');
    assert.strictEqual(loginFail.success, false, 'Invalid credentials must be rejected');
    assert.strictEqual(loginFail.error, 'Invalid username or password');
    console.log('✔ Test 1.4: Incorrect credentials correctly rejected with generic error');

    // Test 1.5: Non-existent user login
    const nonExistent = await loginAdmin('unknown_user', 'AnyPassword123');
    assert.strictEqual(nonExistent.success, false, 'Non-existent username must be rejected');
    console.log('✔ Test 1.5: Non-existent user rejected');

    // ------------------------------------------------------------------
    // TEST SUITE 2: IMAGE VALIDATION & PRIVATE STORAGE SECURITY
    // ------------------------------------------------------------------
    console.log('\n[SUITE 2] File Upload Security & Magic Bytes Validation');

    // Read real image file for full embed tests
    const realPhotoBuffer = await fs.readFile(path.join(process.cwd(), 'public', 'logo', 'rupeeapex-logo.jpeg'));
    const validJpgBuffer = realPhotoBuffer;
    const jpgValidation = validateImageMagicBytes(validJpgBuffer);
    assert.strictEqual(jpgValidation.isValid, true);
    assert.strictEqual(jpgValidation.mimeType, 'image/jpeg');

    // Valid PNG (starts with 89 50 4E 47)
    const validPngBuffer = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    const pngValidation = validateImageMagicBytes(validPngBuffer);
    assert.strictEqual(pngValidation.isValid, true);
    assert.strictEqual(pngValidation.mimeType, 'image/png');

    // Malicious / invalid file (e.g. PHP script or executable disguised as jpg)
    const fakeFileBuffer = Buffer.from('<?php echo "malicious"; ?>');
    const fakeValidation = validateImageMagicBytes(fakeFileBuffer);
    assert.strictEqual(fakeValidation.isValid, false, 'Disguised non-image files must be rejected');
    console.log('✔ Test 2.1: Magic bytes validation strictly enforces real JPEG/PNG');

    // Test 2.2: Private storage saving & retrieval
    const saved = await saveCandidatePhotograph(validJpgBuffer, 'photo.jpg');
    assert.ok(saved.storageKey, 'Storage key must be generated');
    const retrieved = await getCandidatePhotograph(saved.storageKey);
    assert.ok(retrieved, 'Should retrieve photo from private storage');
    assert.strictEqual(retrieved!.buffer.length, validJpgBuffer.length);
    console.log('✔ Test 2.2: Photo saved to private storage and safely retrievable');

    // Test 2.3: Path traversal protection
    const traversalAttempt = await getCandidatePhotograph('../../package.json');
    // path.basename prevents traversal, so it looks for 'package.json' inside storage/uploads which does not exist
    assert.strictEqual(traversalAttempt, null, 'Path traversal must be neutralized');
    console.log('✔ Test 2.3: Storage keys protected against directory traversal attacks');

    // ------------------------------------------------------------------
    // TEST SUITE 3: CANDIDATE APPLICATION & ATOMIC ID GENERATION
    // ------------------------------------------------------------------
    console.log('\n[SUITE 3] Candidate Application Submission & Validation');

    // Test 3.1: Unique Sequential ID Generation
    const id1 = await getNextApplicationId(2026);
    const id2 = await getNextApplicationId(2026);
    assert.strictEqual(id1, 'RAP-2026-000001');
    assert.strictEqual(id2, 'RAP-2026-000002');
    console.log('✔ Test 3.1: Atomic sequence produces RAP-2026-000001 and RAP-2026-000002');

    // Test 3.2: Zod Validation rejection when Preferred Job Role is missing
    const invalidCandidateData: any = {
      personalDetails: {
        fullName: 'Karthik Raja',
        dateOfBirth: '1998-05-12',
        age: 28,
        gender: 'Male',
        bloodGroup: 'B+',
        maritalStatus: 'Single',
        fathersName: 'Raja',
        mothersName: 'Lakshmi',
      },
      contactDetails: {
        mobileNumber: '9876543210',
        email: 'karthik@example.com',
      },
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
      referenceDetails: { referralSource: 'Walk-in Direct' },
      declarationAccepted: true,
      // preferredJobRole is deliberately missing
    };

    const zodMissingRole = candidateApplicationSchema.safeParse(invalidCandidateData);
    assert.strictEqual(zodMissingRole.success, false, 'Missing preferred job role must fail validation');
    console.log('✔ Test 3.2: Preferred Job Role is strictly mandatory in validation');

    // Test 3.3: Submit valid applications for each of the 5 roles
    const sampleCandidates = [
      { name: 'Aravind Kumar', role: 'GOLD', mobile: '9840123456', edu: 'B.Com' },
      { name: 'Priya Sharma', role: 'NIDHI', mobile: '9840234567', edu: 'MBA' },
      { name: 'Suresh Babu', role: 'MFI', mobile: '9840345678', edu: 'B.Sc' },
      { name: 'Deepa Murugan', role: 'CHIT', mobile: '9840456789', edu: 'BBA' },
      { name: 'Vignesh Raman', role: 'INSURANCE', mobile: '9840567890', edu: 'Diploma' },
    ];

    const submittedRecords: any[] = [];

    for (const sc of sampleCandidates) {
      const fullInput: any = {
        personalDetails: {
          fullName: sc.name,
          dateOfBirth: '1999-04-15',
          age: 27,
          gender: sc.name.includes('Priya') || sc.name.includes('Deepa') ? 'Female' : 'Male',
          bloodGroup: 'O+',
          maritalStatus: 'Single',
          fathersName: 'Father of ' + sc.name,
          mothersName: 'Mother of ' + sc.name,
        },
        familyDetails: {
          fathersOccupation: 'Business',
          fathersMobile: '9988776655',
          mothersOccupation: 'Homemaker',
          mothersMobile: '9988776644',
        },
        contactDetails: {
          mobileNumber: sc.mobile,
          email: `${sc.name.toLowerCase().replace(' ', '.')}@example.com`,
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
          institutionName: 'Madurai Kamaraj University',
          passingYear: '2021',
        },
        employmentDetails: {
          hasPreviousExperience: true,
          previousOccupation: 'Sales Officer',
          previousCompanyName: 'ABC Finance',
          experienceDurationYears: 2,
          experienceDurationMonths: 6,
          lastDrawnSalary: '₹22,000',
        },
        preferredJobRole: sc.role,
        referenceDetails: {
          referralSource: 'Advertisement',
          referrerName: 'Newspaper Ad',
        },
        declarationAccepted: true,
      };

      const result = await submitApplication(fullInput, validJpgBuffer, 'passport.jpg');
      assert.ok(result.applicationId.startsWith('RAP-'), 'Application ID must have RAP- prefix');
      submittedRecords.push({ ...result, role: sc.role, name: sc.name });
    }

    assert.strictEqual(submittedRecords.length, 5);
    console.log('✔ Test 3.3: Successfully submitted 5 real candidates across all 5 divisions');

    // ------------------------------------------------------------------
    // TEST SUITE 4: HR SEARCH, FILTERING, & DASHBOARD AGGREGATION
    // ------------------------------------------------------------------
    console.log('\n[SUITE 4] HR Search, Role Filtering & Dashboard Stats');

    // Test 4.1: Search by candidate name
    const searchByName = await getCandidates({ search: 'Aravind' });
    assert.strictEqual(searchByName.candidates.length, 1);
    assert.strictEqual(searchByName.candidates[0].personalDetails.fullName, 'Aravind Kumar');
    console.log('✔ Test 4.1: Search by candidate name returned exact match');

    // Test 4.2: Search by mobile number
    const searchByMobile = await getCandidates({ search: '9840234567' });
    assert.strictEqual(searchByMobile.candidates.length, 1);
    assert.strictEqual(searchByMobile.candidates[0].personalDetails.fullName, 'Priya Sharma');
    console.log('✔ Test 4.2: Search by candidate mobile number returned exact match');

    // Test 4.3: Filter by GOLD role
    const goldFilter = await getCandidates({ role: 'GOLD' });
    assert.strictEqual(goldFilter.candidates.length, 1);
    assert.strictEqual(goldFilter.candidates[0].preferredJobRole, 'GOLD');
    console.log('✔ Test 4.3: Filter by GOLD role returned GOLD candidates only');

    // Test 4.4: Filter by NIDHI role
    const nidhiFilter = await getCandidates({ role: 'NIDHI' });
    assert.strictEqual(nidhiFilter.candidates.length, 1);
    assert.strictEqual(nidhiFilter.candidates[0].preferredJobRole, 'NIDHI');
    console.log('✔ Test 4.4: Filter by NIDHI role returned NIDHI candidates only');

    // Test 4.5: Filter by MFI, CHIT, INSURANCE
    const mfiFilter = await getCandidates({ role: 'MFI' });
    const chitFilter = await getCandidates({ role: 'CHIT' });
    const insFilter = await getCandidates({ role: 'INSURANCE' });
    assert.strictEqual(mfiFilter.candidates.length, 1);
    assert.strictEqual(chitFilter.candidates.length, 1);
    assert.strictEqual(insFilter.candidates.length, 1);
    console.log('✔ Test 4.5: Filters for MFI, CHIT, INSURANCE verified successfully');

    // Test 4.6: Update status
    const firstCandidateId = submittedRecords[0].candidateId;
    const updatedCandidate = await updateCandidateStatus(firstCandidateId, 'SHORTLISTED', 'Strong finance background');
    assert.ok(updatedCandidate);
    assert.strictEqual(updatedCandidate!.applicationStatus, 'SHORTLISTED');
    assert.strictEqual(updatedCandidate!.statusNotes, 'Strong finance background');
    console.log('✔ Test 4.6: HR successfully updated candidate status to SHORTLISTED with notes');

    // Test 4.7: Dashboard statistics aggregation from real MongoDB records
    const stats = await getDashboardStats();
    assert.strictEqual(stats.total, 5, 'Total applications must be 5');
    assert.strictEqual(stats.shortlisted, 1, 'Shortlisted count must be 1');
    assert.strictEqual(stats.new, 4, 'New count must be 4');
    assert.strictEqual(stats.roleCounts.GOLD, 1);
    assert.strictEqual(stats.roleCounts.NIDHI, 1);
    assert.strictEqual(stats.roleCounts.MFI, 1);
    assert.strictEqual(stats.roleCounts.CHIT, 1);
    assert.strictEqual(stats.roleCounts.INSURANCE, 1);
    console.log('✔ Test 4.7: Dashboard aggregation returns exact real MongoDB counts');

    // ------------------------------------------------------------------
    // TEST SUITE 5: PDF GENERATION TEST
    // ------------------------------------------------------------------
    console.log('\n[SUITE 5] Official Rupeeapex Application PDF Generation');

    const candidateRecord = await getCandidateById(firstCandidateId);
    assert.ok(candidateRecord);

    const pdfBuffer = await generateCandidatePdf(candidateRecord!);
    assert.ok(pdfBuffer instanceof Uint8Array);
    assert.ok(pdfBuffer.length > 5000, 'PDF buffer must be non-empty and well-structured');

    // Check PDF header signature '%PDF'
    const pdfHeader = Buffer.from(pdfBuffer.slice(0, 4)).toString();
    assert.strictEqual(pdfHeader, '%PDF', 'Generated document must be a valid PDF file');
    console.log(`✔ Test 5.1: Successfully generated A4 Job Application PDF (${pdfBuffer.length} bytes)`);

    console.log('\n==================================================');
    console.log('ALL 18 TEST CASES PASSED WITH 100% SUCCESS!');
    console.log('==================================================\n');
  } finally {
    await teardown();
  }
}

runTests().catch((e) => {
  console.error('\n❌ Test Suite Failed:', e);
  process.exit(1);
});
