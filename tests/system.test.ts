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

    const admin1Username = process.env.HR_ADMIN_1_USERNAME || 'hr.admin1';
    const admin1Password = process.env.HR_ADMIN_1_PASSWORD || 'RupeeapexHR1@2026';
    const loginSuccess = await loginAdmin(admin1Username, admin1Password);
    assert.strictEqual(loginSuccess.success, true, 'Valid credentials should successfully login');
    assert.ok(loginSuccess.token, 'A valid JWT session token must be returned');

    const sessionPayload = await verifySessionToken(loginSuccess.token!);
    assert.ok(sessionPayload, 'Token must be verifiable');
    assert.strictEqual(sessionPayload.username, admin1Username.toLowerCase());
    assert.strictEqual(sessionPayload.role, 'HR_ADMIN');
    console.log('✔ Test 1.2: Authorized HR login generates valid, secure JWT session');

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
    console.log('✔ Test 1.3: Repeated failed logins do not lock an authorized account');

    // ------------------------------------------------------------------
    // TEST SUITE 2: FILE UPLOAD SECURITY
    // ------------------------------------------------------------------
    console.log('\n[SUITE 2] File Upload Security & Magic Bytes Validation');

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
    assert.strictEqual(retrieved!.buffer.length, validJpgBuffer.length);
    console.log('✔ Test 2.2: Photo saved to private storage and safely retrievable');

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
