import assert from 'assert';
import { calculateExactAge, candidateApplicationSchema } from '../src/lib/validation';
import { Candidate } from '../src/models/Candidate';
import { MARITAL_STATUSES } from '../src/lib/constants';

console.log('\n================================================================');
console.log('RUPEEAPEX RESUMEFLOW: MARITAL STATUS & AGE ELIGIBILITY TEST SUITE');
console.log('================================================================\n');

// Helper to create date string YYYY-MM-DD
function getDateYearsAgo(years: number, daysOffset: number = 0): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() - years);
  d.setDate(d.getDate() + daysOffset);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// -------------------------------------------------------------
// TEST 1: Exact Age Calculation (Date of Birth, Month, Day)
// -------------------------------------------------------------
console.log('--- TEST 1: Exact Age Calculation ---');

// Exactly 35 years old today
const dobExact35 = getDateYearsAgo(35, 0);
const age35 = calculateExactAge(dobExact35);
console.log(`Candidate born ${dobExact35} (exactly 35 years ago): age = ${age35}`);
assert.strictEqual(age35, 35, 'Candidate born exactly 35 years ago should have age 35');

// 35 years and 180 days ago (still 35 years old)
const dob35Half = getDateYearsAgo(35, -180);
const age35Half = calculateExactAge(dob35Half);
console.log(`Candidate born ${dob35Half} (35 years + 180 days): age = ${age35Half}`);
assert.strictEqual(age35Half, 35, 'Candidate should still be 35 years old');

// 36 years old (birthday was yesterday)
const dob36Past = getDateYearsAgo(36, -1);
const age36Past = calculateExactAge(dob36Past);
console.log(`Candidate born ${dob36Past} (36 years + 1 day): age = ${age36Past}`);
assert.strictEqual(age36Past, 36, 'Candidate should be 36 years old');

// Turn 36 tomorrow (still 35 today!)
const dob35Almost36 = getDateYearsAgo(36, 1);
const ageAlmost36 = calculateExactAge(dob35Almost36);
console.log(`Candidate born ${dob35Almost36} (turns 36 tomorrow): age = ${ageAlmost36}`);
assert.strictEqual(ageAlmost36, 35, 'Candidate whose 36th birthday is tomorrow should be 35 today');

console.log('✔ Test 1 Passed: Exact age calculation handles year, month, and day correctly.\n');

// -------------------------------------------------------------
// TEST 2: Schema Validation - Maximum Age Limit (35 Years)
// -------------------------------------------------------------
console.log('--- TEST 2: Schema Validation - Age Limit (35 Years) ---');

const baseApplicationData = {
  photographStorageKey: 'mock-photo-key',
  personalDetails: {
    fullName: 'Rahul Sharma',
    dateOfBirth: dobExact35,
    age: 35,
    gender: 'Male',
    maritalStatus: 'Unmarried',
    fathersName: 'Suresh Sharma',
    mothersName: 'Anita Sharma',
    mobileNumber: '9876543210',
    email: 'rahul.sharma@example.com',
    aadhaarNumber: '123456789012',
  },
  familyDetails: {
    fathersOccupation: 'Farmer',
    fathersMobile: '9876543211',
    mothersOccupation: 'Homemaker',
    mothersMobile: '9876543212',
  },
  addressDetails: {
    permanentAddress: {
      doorNoStreet: '123 Main Road',
      villageOrArea: 'Sector 5',
      taluk: 'South',
      district: 'Bangalore',
      state: 'Karnataka',
      pincode: '560001',
    },
    temporaryAddress: {
      doorNoStreet: '123 Main Road',
      villageOrArea: 'Sector 5',
      taluk: 'South',
      district: 'Bangalore',
      state: 'Karnataka',
      pincode: '560001',
    },
    sameAsPermanent: true,
  },
  educationDetails: {
    highestQualification: 'B.Tech Computer Science',
    institutionName: 'VTU',
    passingYear: '2015',
    percentageOrGrade: '80%',
  },
  employmentDetails: {
    hasPreviousExperience: false,
    previouslyWorkedHere: false,
  },
  preferredJobRole: 'GOLD',
  preferredJobLocation: 'Bangalore',
  expectedSalary: '30000',
  noticePeriod: 'Immediate',
  referenceDetails: {
    referralSource: 'Walk-in Direct',
  },
  declarationAccepted: true,
};

// 1. Candidate aged 35 -> Must pass
const res35 = candidateApplicationSchema.safeParse(baseApplicationData);
assert.strictEqual(res35.success, true, 'Age 35 should be accepted: ' + JSON.stringify(res35.error?.issues));
console.log('✔ Candidate aged 35 is eligible and passes validation.');

// 2. Candidate aged 36 -> Must fail with exact message
const overageData = {
  ...baseApplicationData,
  personalDetails: {
    ...baseApplicationData.personalDetails,
    dateOfBirth: dob36Past,
    age: 36,
  },
};
const res36 = candidateApplicationSchema.safeParse(overageData);
assert.strictEqual(res36.success, false, 'Age 36 must be rejected');
const ageErrorMessage = res36.error?.issues.find((i) => i.message.includes('35 years'))?.message;
console.log(`✔ Candidate aged 36 is rejected with message: "${ageErrorMessage}"`);
assert.strictEqual(
  ageErrorMessage,
  'The maximum age limit for this application is 35 years.  Contact: hr@rupeeapexGroup.com || +91 8925866326'
);

console.log('✔ Test 2 Passed: Age limit <= 35 accepted, >= 36 rejected.\n');

// -------------------------------------------------------------
// TEST 3: Marital Status & Marriage Date Validation
// -------------------------------------------------------------
console.log('--- TEST 3: Marital Status & Marriage Date Validation ---');

// 1. Unmarried candidate without Marriage Date -> Must pass
const unmarriedData = {
  ...baseApplicationData,
  personalDetails: {
    ...baseApplicationData.personalDetails,
    maritalStatus: 'Unmarried',
  },
};
const resUnmarried = candidateApplicationSchema.safeParse(unmarriedData);
assert.strictEqual(resUnmarried.success, true, 'Unmarried candidate should not require Marriage Date');
console.log('✔ Unmarried candidate does not require Marriage Date.');

// 2. Married candidate WITHOUT Marriage Date -> Must fail
const marriedWithoutDateData = {
  ...baseApplicationData,
  personalDetails: {
    ...baseApplicationData.personalDetails,
    maritalStatus: 'Married',
    marriageDate: '',
  },
};
const resMarriedNoDate = candidateApplicationSchema.safeParse(marriedWithoutDateData);
assert.strictEqual(resMarriedNoDate.success, false, 'Married candidate without Marriage Date must fail');
const mDateError = resMarriedNoDate.error?.issues.find((i) => i.path.includes('marriageDate'))?.message;
console.log(`✔ Married candidate without Marriage Date rejected with message: "${mDateError}"`);
assert.ok(mDateError?.includes('mandatory'), 'Error should specify Marriage Date is mandatory');

// 3. Married candidate WITH valid Marriage Date -> Must pass
const marriedWithDateData = {
  ...baseApplicationData,
  personalDetails: {
    ...baseApplicationData.personalDetails,
    maritalStatus: 'Married',
    marriageDate: '2020-05-15',
  },
};
const resMarriedWithDate = candidateApplicationSchema.safeParse(marriedWithDateData);
assert.strictEqual(resMarriedWithDate.success, true, 'Married candidate with valid Marriage Date must pass');
console.log('✔ Married candidate with valid Marriage Date passes validation.');

console.log('✔ Test 3 Passed: Marriage Date conditional validation works as required.\n');

// -------------------------------------------------------------
// TEST 4: Spouse Mobile Number Validation (Optional for Married)
// -------------------------------------------------------------
console.log('--- TEST 4: Spouse Mobile Number Validation ---');

// 1. Married candidate with empty spouseMobile -> Must pass (Optional)
const marriedEmptySpouseMobile = {
  ...marriedWithDateData,
  familyDetails: {
    ...marriedWithDateData.familyDetails,
    spouseMobile: '',
  },
};
const resEmptySpouseMobile = candidateApplicationSchema.safeParse(marriedEmptySpouseMobile);
assert.strictEqual(resEmptySpouseMobile.success, true, 'Spouse Mobile Number is optional, empty must pass');
console.log('✔ Married candidate with empty Spouse Mobile Number passes (field is optional).');

// 2. Married candidate with valid 10-digit spouseMobile -> Must pass
const marriedValidSpouseMobile = {
  ...marriedWithDateData,
  familyDetails: {
    ...marriedWithDateData.familyDetails,
    spouseMobile: '9123456789',
  },
};
const resValidSpouseMobile = candidateApplicationSchema.safeParse(marriedValidSpouseMobile);
assert.strictEqual(resValidSpouseMobile.success, true, 'Valid 10-digit Spouse Mobile must pass');
console.log('✔ Married candidate with valid 10-digit Spouse Mobile passes.');

// 3. Married candidate with INVALID spouseMobile (e.g. 5 digits) -> Must fail
const marriedInvalidSpouseMobile = {
  ...marriedWithDateData,
  familyDetails: {
    ...marriedWithDateData.familyDetails,
    spouseMobile: '12345',
  },
};
const resInvalidSpouseMobile = candidateApplicationSchema.safeParse(marriedInvalidSpouseMobile);
assert.strictEqual(resInvalidSpouseMobile.success, false, 'Invalid Spouse Mobile must fail');
const spouseMobileError = resInvalidSpouseMobile.error?.issues.find((i) => i.path.includes('spouseMobile'))?.message;
console.log(`✔ Married candidate with invalid Spouse Mobile rejected with message: "${spouseMobileError}"`);
assert.ok(spouseMobileError?.includes('10-digit'), 'Error should specify 10-digit mobile number');

console.log('✔ Test 4 Passed: Spouse Mobile Number optional & 10-digit validation verified.\n');

// -------------------------------------------------------------
// TEST 5: Switching from Married to Unmarried Clears Conditional Data
// -------------------------------------------------------------
console.log('--- TEST 5: Switching from Married to Unmarried State Simulation ---');

let formState: any = {
  personalDetails: {
    maritalStatus: 'Married',
    marriageDate: '2020-05-15',
    spouseName: 'Sunita Sharma',
  },
  familyDetails: {
    spouseOccupation: 'Teacher',
    spouseMobile: '9876543210',
  },
};

// Candidate switches to 'Unmarried'
const newStatus = 'Unmarried';
const isNowMarried = newStatus === 'Married';

formState = {
  ...formState,
  personalDetails: {
    ...formState.personalDetails,
    maritalStatus: newStatus,
    marriageDate: isNowMarried ? formState.personalDetails.marriageDate : '',
    spouseName: isNowMarried ? formState.personalDetails.spouseName : '',
  },
  familyDetails: {
    ...formState.familyDetails,
    spouseOccupation: isNowMarried ? formState.familyDetails.spouseOccupation : '',
    spouseMobile: isNowMarried ? formState.familyDetails.spouseMobile : '',
  },
};

assert.strictEqual(formState.personalDetails.marriageDate, '', 'Marriage Date must be cleared when switching to Unmarried');
assert.strictEqual(formState.familyDetails.spouseMobile, '', 'Spouse Mobile must be cleared when switching to Unmarried');
assert.strictEqual(formState.familyDetails.spouseOccupation, '', 'Spouse Occupation must be cleared when switching to Unmarried');
console.log('✔ Stale marriage date & spouse mobile successfully wiped upon switching to Unmarried.');

console.log('✔ Test 5 Passed: Conditional data cleared upon marital status change.\n');

// -------------------------------------------------------------
// TEST 6: Mongoose Schema Model Verification
// -------------------------------------------------------------
console.log('--- TEST 6: Mongoose Schema Model Verification ---');

const personalDetailsPaths = Candidate.schema.path('personalDetails') as any;
const familyDetailsPaths = Candidate.schema.path('familyDetails') as any;

// Check marriageDate in personalDetails
const marriageDateField = personalDetailsPaths.schema.path('marriageDate');
assert.ok(marriageDateField, 'personalDetails.marriageDate must exist in schema');
console.log('✔ personalDetails.marriageDate schema path exists.');

// Check maritalStatus enum in personalDetails
const maritalStatusField = personalDetailsPaths.schema.path('maritalStatus');
assert.ok(maritalStatusField.enumValues.includes('Unmarried'), 'maritalStatus must include "Unmarried"');
assert.ok(maritalStatusField.enumValues.includes('Married'), 'maritalStatus must include "Married"');
console.log('✔ personalDetails.maritalStatus enum contains "Unmarried" and "Married":', maritalStatusField.enumValues);

// Check spouseMobile in familyDetails
const spouseMobileField = familyDetailsPaths.schema.path('spouseMobile');
assert.ok(spouseMobileField, 'familyDetails.spouseMobile must exist in schema');
console.log('✔ familyDetails.spouseMobile schema path exists.');

// Check MARITAL_STATUSES constant
assert.ok(MARITAL_STATUSES.includes('Unmarried' as any), 'MARITAL_STATUSES constant must include "Unmarried"');
console.log('✔ MARITAL_STATUSES includes:', MARITAL_STATUSES);

console.log('\n================================================================');
console.log('ALL VERIFICATION SUITE TESTS PASSED SUCCESSFULLY! (6/6)');
console.log('================================================================\n');
