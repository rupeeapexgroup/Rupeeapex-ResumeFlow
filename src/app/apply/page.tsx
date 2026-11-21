'use client';

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  PREFERRED_JOB_ROLES,
  EDUCATION_QUALIFICATIONS,
  BLOOD_Group,
  MARITAL_STATUSES,
  REFERRAL_SOURCES,
} from '@/lib/constants';
import {
  User,
  Users,
  Home,
  GraduationCap,
  Briefcase,
  Building2,
  Star,
  Camera,
  CheckSquare,
  AlertCircle,
  CheckCircle2,
  UploadCloud,
  FileCheck,
  FileText,
  Upload,
  X,
  WifiOff,
  ServerCrash,
  Check,
  ArrowLeft,
  ArrowRight,
} from 'lucide-react';

const STEPS = [
  { id: 1, name: 'Personal Details' },
  { id: 2, name: 'Family Details' },
  { id: 3, name: 'Address Details' },
  { id: 4, name: 'Education & Experience' },
  { id: 5, name: 'Preferred Job Role & Other Details & Resume' },
] as const;

export default function CandidateApplyPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const resumeInputRef = useRef<HTMLInputElement>(null);

  // Active step in progressive 5-stage application form (1 to 5)
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Form states - strictly preserving all existing candidate application fields
  const [formData, setFormData] = useState({
    personalDetails: {
      fullName: '',
      dateOfBirth: '',
      age: 21,
      gender: 'Male' as 'Male' | 'Female',
      maritalStatus: 'Single' as 'Single' | 'Married' | 'Divorced' | 'Widowed',
      fathersName: '',
      mothersName: '',
      spouseName: '',
      mobileNumber: '',
      alternativeMobileNumber: '',
      email: '',
      aadhaarNumber: '',
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
      permanentAddress: {
        doorNoStreet: '',
        villageOrArea: '',
        taluk: '',
        district: '',
        state: 'Tamil Nadu',
        pincode: '',
      },
      temporaryAddress: {
        doorNoStreet: '',
        villageOrArea: '',
        taluk: '',
        district: '',
        state: 'Tamil Nadu',
        pincode: '',
      },
      sameAsPermanent: false,
    },
    educationDetails: {
      highestQualification: '',
      educationDetails: '',
      institutionName: '',
      passingYear: '',
    },
    employmentDetails: {
      hasPreviousExperience: false,
      previousCompany: '',
      previousDesignation: '',
      yearsOfExperience: 0,
      previousCompany2: '',
      previousDesignation2: '',
      yearsOfExperience2: 0,
      previousCompany3: '',
      previousDesignation3: '',
      yearsOfExperience3: 0,
      previouslyWorkedHere: false,
      previousEmployeeId: '',
      joinDesignation: '',
      relievingDesignation: '',
      dateOfRelieving: '',
      reasonForRelieving: '',
    },
    preferredJobRole: '' as any,
    preferredJobRoleOther: '',
    referenceDetails: {
      referralSource: 'Walk-in Direct' as any,
      referrerName: '',
      additionalRemarks: '',
    },
    declarationAccepted: false,
  });

  // Photo state
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  // Resume state
  const [resumeFile, setResumeFile] = useState<File | null>(null);

  // Submission & UI states
  const [submitting, setSubmitting] = useState(false);
  const [errorPopup, setErrorPopup] = useState<{
    title: string;
    message: string;
    type?: 'validation' | 'network' | 'photo' | 'server' | 'database' | 'general';
  } | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);

  const showPopupError = (
    message: string,
    title = 'Please Check Details',
    type: 'validation' | 'network' | 'photo' | 'server' | 'database' | 'general' = 'general'
  ) => {
    setErrorPopup({ title, message, type });
  };

  const closePopupError = () => {
    setErrorPopup(null);
  };

  // Lock body scroll when popup is active and handle Escape key
  useEffect(() => {
    if (errorPopup) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          setErrorPopup(null);
        }
      };

      window.addEventListener('keydown', handleKeyDown);
      return () => {
        document.body.style.overflow = originalOverflow;
        window.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [errorPopup]);

  // Error tracking helpers
  const clearFieldError = (field: string) => {
    setFieldErrors((prev) => {
      if (!prev[field]) return prev;
      const copy = { ...prev };
      delete copy[field];
      return copy;
    });
  };

  const getFieldClass = (field: string, baseClasses: string) => {
    if (fieldErrors[field]) {
      return `${baseClasses} !border-red-500 !ring-2 !ring-red-200 !bg-red-50/40`;
    }
    return baseClasses;
  };

  // Smooth scroll to an invalid field
  const scrollToField = (fieldName: string) => {
    setTimeout(() => {
      if (typeof document !== 'undefined') {
        const errorEl = document.querySelector(
          `[name="${fieldName}"], #${fieldName}, [data-field="${fieldName}"]`
        );
        if (errorEl) {
          errorEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
    }, 100);
  };

  // Auto-calculate age when DOB changes
  const handleDobChange = (dobStr: string) => {
    clearFieldError('dateOfBirth');
    clearFieldError('age');
    let calculatedAge = formData.personalDetails.age;
    if (dobStr) {
      const birthDate = new Date(dobStr);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      if (age >= 18 && age <= 70) {
        calculatedAge = age;
      }
    }
    setFormData((prev) => ({
      ...prev,
      personalDetails: {
        ...prev.personalDetails,
        dateOfBirth: dobStr,
        age: calculatedAge,
      },
    }));
  };

  // Handle Photo selection with immediate strict 5 MB validation
  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // File format validation
    const isImage = file.type.startsWith('image/') || /\.(jpe?g|png|webp)$/i.test(file.name);
    if (!isImage) {
      if (fileInputRef.current) fileInputRef.current.value = '';
      e.target.value = '';
      setPhotoFile(null);
      setPhotoPreview(null);
      const invalidFormatMsg = 'Please select a valid image file (JPEG, PNG, or WEBP format only).';
      setFieldErrors((prev) => ({ ...prev, photograph: invalidFormatMsg }));
      showPopupError(invalidFormatMsg, 'Invalid File Format', 'photo');
      return;
    }

    // Strict 5 MB limit
    const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
    if (file.size > MAX_PHOTO_BYTES) {
      if (fileInputRef.current) fileInputRef.current.value = '';
      e.target.value = '';
      setPhotoFile(null);
      setPhotoPreview(null);

      const sizeErrorMsg =
        'Photo size exceeds the maximum allowed limit of 5 MB. Please select an image smaller than or equal to 5 MB.';
      setFieldErrors((prev) => ({
        ...prev,
        photograph: sizeErrorMsg,
      }));
      showPopupError(sizeErrorMsg, 'Photo Size Exceeded', 'photo');
      return;
    }

    // Valid image selection
    clearFieldError('photograph');
    closePopupError();
    setPhotoFile(file);

    if (typeof window !== 'undefined' && 'createImageBitmap' in window) {
      createImageBitmap(file, { imageOrientation: 'from-image' })
        .then((bitmap) => {
          const canvas = document.createElement('canvas');
          canvas.width = bitmap.width;
          canvas.height = bitmap.height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(bitmap, 0, 0);
            setPhotoPreview(canvas.toDataURL('image/jpeg', 0.92));
            return;
          }
          throw new Error('Canvas context not available');
        })
        .catch(() => {
          const reader = new FileReader();
          reader.onload = () => {
            setPhotoPreview(reader.result as string);
          };
          reader.readAsDataURL(file);
        });
    } else {
      const reader = new FileReader();
      reader.onload = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle Resume selection with immediate strict validation (PDF, DOC, DOCX up to 5 MB)
  const handleResumeSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check extension
    const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    const allowedExts = ['.pdf', '.doc', '.docx'];
    const isAllowedExt = allowedExts.includes(ext);

    if (!isAllowedExt) {
      if (resumeInputRef.current) resumeInputRef.current.value = '';
      e.target.value = '';
      setResumeFile(null);
      const invalidFormatMsg = 'Invalid file format. Please upload your resume in PDF, DOC, or DOCX format only.';
      setFieldErrors((prev) => ({ ...prev, resume: invalidFormatMsg }));
      showPopupError(invalidFormatMsg, 'Unsupported Resume Format', 'photo');
      return;
    }

    // Strict 5 MB file size limit
    const MAX_RESUME_BYTES = 5 * 1024 * 1024;
    if (file.size > MAX_RESUME_BYTES) {
      if (resumeInputRef.current) resumeInputRef.current.value = '';
      e.target.value = '';
      setResumeFile(null);

      const sizeErrorMsg =
        'Resume size exceeds the maximum allowed limit of 5 MB. Please select a file smaller than or equal to 5 MB.';
      setFieldErrors((prev) => ({ ...prev, resume: sizeErrorMsg }));
      showPopupError(sizeErrorMsg, 'Resume Size Exceeded', 'photo');
      return;
    }

    clearFieldError('resume');
    closePopupError();
    setResumeFile(file);
  };

  const handleRemoveResume = () => {
    setResumeFile(null);
    if (resumeInputRef.current) resumeInputRef.current.value = '';
  };

  // Handle "Same as Permanent" toggle
  const handleSameAddressToggle = (checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      addressDetails: {
        ...prev.addressDetails,
        sameAsPermanent: checked,
        temporaryAddress: checked
          ? { ...prev.addressDetails.permanentAddress }
          : prev.addressDetails.temporaryAddress,
      },
    }));
  };

  // Map any field name to its corresponding stage (1-5)
  const getStepForField = (field: string): number => {
    if (
      [
        'photograph',
        'fullName',
        'dateOfBirth',
        'age',
        'gender',
        'maritalStatus',
        'bloodGroup',
        'fathersName',
        'mothersName',
        'spouseName',
        'mobileNumber',
        'alternativeMobileNumber',
        'email',
        'aadhaarNumber',
        'panNumber',
        'drivingLicenseNumber',
        'bankAccountNumber',
        'ifscCode',
        'bankBranchName',
      ].includes(field)
    ) {
      return 1;
    }
    if (
      [
        'fathersOccupation',
        'fathersMobile',
        'mothersOccupation',
        'mothersMobile',
        'spouseOccupation',
      ].includes(field)
    ) {
      return 2;
    }
    if (
      [
        'doorNoStreet',
        'villageOrArea',
        'taluk',
        'district',
        'state',
        'pincode',
        'tempDoorNoStreet',
        'tempVillageOrArea',
        'tempTaluk',
        'tempDistrict',
        'tempState',
        'tempPincode',
        'permanentAddress',
        'temporaryAddress',
      ].includes(field)
    ) {
      return 3;
    }
    if (
      [
        'highestQualification',
        'educationDetails',
        'institutionName',
        'passingYear',
        'hasPreviousExperience',
        'previousCompany',
        'previousDesignation',
        'yearsOfExperience',
        'previouslyWorkedHere',
        'previousEmployeeId',
        'joinDesignation',
        'relievingDesignation',
        'dateOfRelieving',
        'reasonForRelieving',
      ].includes(field)
    ) {
      return 4;
    }
    return 5;
  };

  // ==========================================
  // STAGE-BY-STAGE VALIDATIONS
  // ==========================================

  // Step 1: Personal Details Validation
  const validateStep1 = (): boolean => {
    const errors: Record<string, string> = {};

    // Validate Photograph
    if (!photoFile) {
      errors['photograph'] = 'Candidate photograph is required.';
    }

    // Validate Personal Details
    if (!formData.personalDetails.fullName.trim()) {
      errors['fullName'] = 'Candidate Name is required as per Aadhaar.';
    }
    if (!formData.personalDetails.dateOfBirth) {
      errors['dateOfBirth'] = 'Valid Date of Birth is required.';
    }
    if (
      !formData.personalDetails.age ||
      formData.personalDetails.age < 18 ||
      formData.personalDetails.age > 70
    ) {
      errors['age'] = 'Age must be between 18 and 70.';
    }
    if (!formData.personalDetails.fathersName.trim()) {
      errors['fathersName'] = "Father's Name is required.";
    }
    if (!formData.personalDetails.mothersName.trim()) {
      errors['mothersName'] = "Mother's Name is required.";
    }
    if (
      !formData.personalDetails.mobileNumber ||
      !/^[6-9]\d{9}$/.test(formData.personalDetails.mobileNumber)
    ) {
      errors['mobileNumber'] = 'Enter a valid 10-digit Indian Mobile Number.';
    }
    if (
      formData.personalDetails.alternativeMobileNumber &&
      !/^[6-9]\d{9}$/.test(formData.personalDetails.alternativeMobileNumber)
    ) {
      errors['alternativeMobileNumber'] = 'Enter valid 10-digit Alternative Mobile.';
    }
    if (
      !formData.personalDetails.email ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.personalDetails.email)
    ) {
      errors['email'] = 'Enter a valid Email Address.';
    }
    if (
      !formData.personalDetails.aadhaarNumber ||
      !/^\d{12}$/.test(formData.personalDetails.aadhaarNumber)
    ) {
      errors['aadhaarNumber'] = 'Enter a valid 12-digit Aadhaar Number.';
    }
    if (
      formData.personalDetails.panNumber &&
      !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/i.test(formData.personalDetails.panNumber.trim())
    ) {
      errors['panNumber'] = 'Enter a valid 10-character PAN Number (e.g. ABCDE1234F).';
    }
    if (
      formData.personalDetails.ifscCode &&
      !/^[A-Z]{4}0[A-Z0-9]{6}$/i.test(formData.personalDetails.ifscCode.trim())
    ) {
      errors['ifscCode'] = 'Enter a valid 11-character IFSC Code (e.g. SBIN0001234).';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      const firstKey = Object.keys(errors)[0];
      showPopupError(
        errors[firstKey],
        firstKey === 'photograph' ? 'Photograph Required' : 'Please Check Details',
        firstKey === 'photograph' ? 'photo' : 'validation'
      );
      scrollToField(firstKey);
      return false;
    }

    return true;
  };

  // Step 2: Family Details Validation
  const validateStep2 = (): boolean => {
    const errors: Record<string, string> = {};

    if (
      formData.familyDetails.fathersMobile &&
      !/^[0-9]{10}$/.test(formData.familyDetails.fathersMobile)
    ) {
      errors['fathersMobile'] = 'Enter valid 10-digit mobile number for Father.';
    }
    if (
      formData.familyDetails.mothersMobile &&
      !/^[0-9]{10}$/.test(formData.familyDetails.mothersMobile)
    ) {
      errors['mothersMobile'] = 'Enter valid 10-digit mobile number for Mother.';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      const firstKey = Object.keys(errors)[0];
      showPopupError(errors[firstKey], 'Please Check Family Details', 'validation');
      scrollToField(firstKey);
      return false;
    }

    return true;
  };

  // Step 3: Address Details Validation
  const validateStep3 = (): boolean => {
    const errors: Record<string, string> = {};

    // Validate Permanent Address
    if (!formData.addressDetails.permanentAddress.doorNoStreet.trim()) {
      errors['doorNoStreet'] = 'Door Number / Street is required.';
    }
    if (!formData.addressDetails.permanentAddress.villageOrArea.trim()) {
      errors['villageOrArea'] = 'Village / Area is required.';
    }
    if (!formData.addressDetails.permanentAddress.taluk.trim()) {
      errors['taluk'] = 'Taluk is required.';
    }
    if (!formData.addressDetails.permanentAddress.district.trim()) {
      errors['district'] = 'District is required.';
    }
    if (!formData.addressDetails.permanentAddress.state.trim()) {
      errors['state'] = 'State is required.';
    }
    if (
      !formData.addressDetails.permanentAddress.pincode ||
      !/^\d{6}$/.test(formData.addressDetails.permanentAddress.pincode)
    ) {
      errors['pincode'] = 'Enter a valid 6-digit PIN Code.';
    }

    // Validate Temporary Address if not same
    if (!formData.addressDetails.sameAsPermanent) {
      if (!formData.addressDetails.temporaryAddress.doorNoStreet.trim()) {
        errors['tempDoorNoStreet'] = 'Door Number / Street is required for temporary address.';
      }
      if (!formData.addressDetails.temporaryAddress.villageOrArea.trim()) {
        errors['tempVillageOrArea'] = 'Village / Area is required for temporary address.';
      }
      if (!formData.addressDetails.temporaryAddress.taluk.trim()) {
        errors['tempTaluk'] = 'Taluk is required for temporary address.';
      }
      if (!formData.addressDetails.temporaryAddress.district.trim()) {
        errors['tempDistrict'] = 'District is required for temporary address.';
      }
      if (!formData.addressDetails.temporaryAddress.state.trim()) {
        errors['tempState'] = 'State is required for temporary address.';
      }
      if (
        !formData.addressDetails.temporaryAddress.pincode ||
        !/^\d{6}$/.test(formData.addressDetails.temporaryAddress.pincode)
      ) {
        errors['tempPincode'] = 'Enter a valid 6-digit PIN Code for temporary address.';
      }
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      const firstKey = Object.keys(errors)[0];
      showPopupError(errors[firstKey], 'Please Check Address Details', 'validation');
      scrollToField(firstKey);
      return false;
    }

    return true;
  };

  // Step 4: Education & Experience Validation
  const validateStep4 = (): boolean => {
    const errors: Record<string, string> = {};

    // Validate Education Details
    if (!formData.educationDetails.highestQualification) {
      errors['highestQualification'] = 'Highest Qualification is required.';
    }
    if (!formData.educationDetails.institutionName.trim()) {
      errors['institutionName'] = 'Institution Name is required.';
    }
    if (
      !formData.educationDetails.passingYear ||
      !/^(19|20)\d{2}$/.test(formData.educationDetails.passingYear)
    ) {
      errors['passingYear'] = 'Enter a valid 4-digit Passing Year.';
    }

    // Validate Rupeeapex Previous Employment Details
    if (formData.employmentDetails.previouslyWorkedHere) {
      if (!formData.employmentDetails.joinDesignation?.trim()) {
        errors['joinDesignation'] = 'Joining Designation at Rupeeapex is required.';
      }
      if (!formData.employmentDetails.relievingDesignation?.trim()) {
        errors['relievingDesignation'] = 'Relieving Designation at Rupeeapex is required.';
      }
      if (!formData.employmentDetails.reasonForRelieving?.trim()) {
        errors['reasonForRelieving'] = 'Reason for Relieving from Rupeeapex is required.';
      }
    }

    // Validate Other Work Experience Details
    if (formData.employmentDetails.hasPreviousExperience) {
      if (!formData.employmentDetails.previousCompany?.trim()) {
        errors['previousCompany'] = 'Previous Company (Experience 1) is required.';
      }
      if (!formData.employmentDetails.previousDesignation?.trim()) {
        errors['previousDesignation'] = 'Previous Designation (Experience 1) is required.';
      }
      if (
        !formData.employmentDetails.yearsOfExperience ||
        formData.employmentDetails.yearsOfExperience <= 0
      ) {
        errors['yearsOfExperience'] = 'Years of Experience (Experience 1) is required.';
      }
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      const firstKey = Object.keys(errors)[0];
      showPopupError(errors[firstKey], 'Please Check Education & Experience', 'validation');
      scrollToField(firstKey);
      return false;
    }

    return true;
  };

  // Step 5: Preferred Job Role & Other Details & Resume Validation
  const validateStep5 = (): boolean => {
    const errors: Record<string, string> = {};

    // Validate Preferred Job Role
    if (!formData.preferredJobRole) {
      errors['preferredJobRole'] = 'Please select your Preferred Job Role.';
    }
    if (formData.preferredJobRole === 'OTHER' && !formData.preferredJobRoleOther.trim()) {
      errors['preferredJobRoleOther'] = 'Please specify your preferred job role.';
    }

    // Validate Referral Source
    if (!formData.referenceDetails.referralSource) {
      errors['referralSource'] = 'Please specify how you came to know about this job.';
    }

    // Validate Resume Upload (Mandatory, PDF/DOC/DOCX, Max 5 MB)
    if (!resumeFile) {
      errors['resume'] =
        'Resume upload is mandatory. Please upload your resume in PDF, DOC, or DOCX format (Max 5 MB).';
    }

    // Validate Declaration
    if (!formData.declarationAccepted) {
      errors['declarationAccepted'] =
        'You must accept the candidate declaration before submitting.';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      const firstKey = Object.keys(errors)[0];
      showPopupError(
        errors[firstKey],
        firstKey === 'resume'
          ? 'Resume Required'
          : firstKey === 'declarationAccepted'
          ? 'Declaration Required'
          : 'Please Check Details',
        firstKey === 'resume' ? 'photo' : 'validation'
      );
      scrollToField(firstKey);
      return false;
    }

    return true;
  };

  // ==========================================
  // NAVIGATION HANDLERS
  // ==========================================

  // Next Section Button Handler
  const handleNextStep = () => {
    closePopupError();
    let isValid = false;

    if (currentStep === 1) {
      isValid = validateStep1();
    } else if (currentStep === 2) {
      isValid = validateStep2();
    } else if (currentStep === 3) {
      isValid = validateStep3();
    } else if (currentStep === 4) {
      isValid = validateStep4();
    }

    if (isValid) {
      setFieldErrors({});
      setCurrentStep((prev) => Math.min(prev + 1, 5));
      if (typeof window !== 'undefined') {
        window.scrollTo({ top: 120, behavior: 'smooth' });
      }
    }
  };

  // Back Button Handler (Preserves candidate data)
  const handlePrevStep = () => {
    closePopupError();
    setFieldErrors({});
    setCurrentStep((prev) => Math.max(prev - 1, 1));
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 120, behavior: 'smooth' });
    }
  };

  // Submit Handler (ONLY triggered on Step 5)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    closePopupError();

    // If Enter key was pressed on an earlier step, navigate forward instead of submitting
    if (currentStep < 5) {
      handleNextStep();
      return;
    }

    // Re-verify entire application across all 5 stages before sending to API
    if (!validateStep1()) {
      setCurrentStep(1);
      return;
    }
    if (!validateStep2()) {
      setCurrentStep(2);
      return;
    }
    if (!validateStep3()) {
      setCurrentStep(3);
      return;
    }
    if (!validateStep4()) {
      setCurrentStep(4);
      return;
    }
    if (!validateStep5()) {
      return;
    }

    // Check device internet connectivity
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      showPopupError(
        'No internet connection detected. Please check your Wi-Fi or mobile data network and try again.',
        'Internet Connection Error',
        'network'
      );
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        ...formData,
        personalDetails: {
          ...formData.personalDetails,
          panNumber: formData.personalDetails.panNumber
            ? formData.personalDetails.panNumber.trim().toUpperCase()
            : '',
          drivingLicenseNumber: formData.personalDetails.drivingLicenseNumber
            ? formData.personalDetails.drivingLicenseNumber.trim().toUpperCase()
            : '',
          bloodGroup: formData.personalDetails.bloodGroup || '',
          bankAccountNumber: formData.personalDetails.bankAccountNumber
            ? formData.personalDetails.bankAccountNumber.trim()
            : '',
          ifscCode: formData.personalDetails.ifscCode
            ? formData.personalDetails.ifscCode.trim().toUpperCase()
            : '',
          bankBranchName: formData.personalDetails.bankBranchName
            ? formData.personalDetails.bankBranchName.trim()
            : '',
        },
        addressDetails: {
          ...formData.addressDetails,
          temporaryAddress: formData.addressDetails.sameAsPermanent
            ? formData.addressDetails.permanentAddress
            : formData.addressDetails.temporaryAddress,
        },
      };

      const sendFormData = new FormData();
      sendFormData.append('data', JSON.stringify(payload));
      sendFormData.append('photograph', photoFile!);
      sendFormData.append('resume', resumeFile!);

      let res: Response;
      try {
        res = await fetch('/api/applications', {
          method: 'POST',
          body: sendFormData,
        });
      } catch (fetchErr: any) {
        console.error('Fetch network submission error:', fetchErr);
        showPopupError(
          'Network connection error while submitting. Please check your internet connection and try again.',
          'Network Connection Error',
          'network'
        );
        setSubmitting(false);
        return;
      }

      // Safely parse JSON or text without crashing in catch block
      let data: any = null;
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        try {
          data = await res.json();
        } catch (jsonErr) {
          console.error('Failed to parse API JSON response:', jsonErr);
          data = null;
        }
      } else {
        try {
          const rawText = await res.text();
          data = { error: rawText };
        } catch {
          data = null;
        }
      }

      if (!res.ok) {
        // HTTP 413 Payload Too Large (Oversized photo or resume)
        if (res.status === 413) {
          const isResume = /resume|cv|document/i.test(data?.error || '');
          showPopupError(
            data?.error ||
              (isResume
                ? 'The uploaded resume exceeds the maximum server limit of 5 MB. Please select a smaller document.'
                : 'The uploaded photograph exceeds the maximum server limit of 5 MB. Please select a smaller photo.'),
            isResume ? 'Resume Size Exceeded' : 'Photo Size Exceeded',
            'photo'
          );
          if (isResume) {
            setFieldErrors((prev) => ({
              ...prev,
              resume:
                'Resume size exceeds the maximum allowed limit of 5 MB. Please select a file smaller than or equal to 5 MB.',
            }));
            setCurrentStep(5);
          } else {
            setFieldErrors((prev) => ({
              ...prev,
              photograph:
                'Photo size exceeds the maximum allowed limit of 5 MB. Please select an image smaller than or equal to 5 MB.',
            }));
            setCurrentStep(1);
          }
          setSubmitting(false);
          return;
        }

        // HTTP 429 Rate limit
        if (res.status === 429) {
          showPopupError(
            'Too many submission attempts. Please wait a moment and try again.',
            'Submission Limit Reached',
            'server'
          );
          setSubmitting(false);
          return;
        }

        // HTTP 5xx Server errors
        if (res.status >= 500) {
          const serverMsg =
            data?.error ||
            'A server error occurred while processing your application. Please try again shortly.';
          showPopupError(serverMsg, 'Server Error', 'server');
          setSubmitting(false);
          return;
        }

        // HTTP 4xx Validation / Input errors
        if (data?.details && Array.isArray(data.details)) {
          const apiErrors: Record<string, string> = {};
          let targetStep = 5;
          let firstIssueKey = '';

          data.details.forEach((issue: any, idx: number) => {
            const key = issue.path[issue.path.length - 1];
            apiErrors[key] = issue.message;
            if (idx === 0) {
              firstIssueKey = key;
              targetStep = getStepForField(key);
            }
          });
          setFieldErrors(apiErrors);
          setCurrentStep(targetStep);
          if (firstIssueKey) {
            scrollToField(firstIssueKey);
          }
        }

        const errorMessage =
          data?.error ||
          'Failed to submit application. Please review the highlighted fields in red.';
        const isPhotoError = /photo|photograph|image/i.test(errorMessage);
        const isResumeError = /resume|cv|document/i.test(errorMessage);

        if (isPhotoError) {
          setCurrentStep(1);
        } else if (isResumeError) {
          setCurrentStep(5);
        }

        showPopupError(
          errorMessage,
          isPhotoError
            ? 'Photo Upload Error'
            : isResumeError
            ? 'Resume Upload Error'
            : 'Please Check Details',
          isPhotoError || isResumeError ? 'photo' : 'validation'
        );
        setSubmitting(false);
        return;
      }

      // Application successfully submitted
      setIsSubmitted(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (unhandledErr: any) {
      console.error('Unhandled submission error:', unhandledErr);
      showPopupError(
        unhandledErr?.message ||
          'An unexpected error occurred while submitting. Please try again.',
        'Submission Error',
        'general'
      );
    } finally {
      setSubmitting(false);
    }
  };

  // ==========================================
  // SUCCESS SCREEN (Clean & Welcoming)
  // ==========================================
  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center px-4 py-12">
        <div className="bg-white rounded-3xl shadow-xl border border-slate-200 p-8 sm:p-12 text-center max-w-lg w-full relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-3 bg-[#006B3C]"></div>

          {/* Rupeeapex Logo */}
          <div className="relative w-[260px] h-[80px] mx-auto mb-6">
            <Image
              src="/logo/rupeeapex-logo.jpeg"
              alt="Rupeeapex Logo"
              fill
              className="object-contain"
              priority
            />
          </div>

          <div className="w-16 h-16 bg-emerald-100 text-[#006B3C] rounded-full mx-auto flex items-center justify-center mb-5 shadow-inner">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-3 tracking-tight">
            Thank You for Submitting!
          </h1>

          <p className="text-sm sm:text-base text-slate-600 leading-relaxed font-medium">
            Your application has been received successfully. Our HR team will review your details
            and reach out to you if your profile matches our requirements.
          </p>

          <div className="mt-8 pt-6 border-t border-slate-100">
            <Link
              href="/"
              className="inline-flex items-center justify-center px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs sm:text-sm transition-colors"
            >
              Return to Homepage
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // CANDIDATE APPLICATION FORM SCREEN
  // ==========================================
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center relative">
      {/* Floating Notification Popup Modal */}
      {errorPopup && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="error-modal-title"
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm overflow-y-auto"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              closePopupError();
            }
          }}
        >
          <div
            className="bg-white rounded-3xl shadow-2xl border border-red-100 max-w-sm sm:max-w-md w-full p-6 sm:p-7 text-center relative my-auto animate-scaleUp"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top Close Icon Button */}
            <button
              type="button"
              onClick={closePopupError}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-[#006B3C]"
              aria-label="Close dialog"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Error Type Icon */}
            <div
              className={`w-14 h-14 rounded-full mx-auto flex items-center justify-center mb-4 shadow-sm ${
                errorPopup.type === 'network'
                  ? 'bg-amber-100 text-amber-700'
                  : errorPopup.type === 'photo'
                  ? 'bg-orange-100 text-orange-700'
                  : errorPopup.type === 'server' || errorPopup.type === 'database'
                  ? 'bg-red-100 text-red-700'
                  : 'bg-red-100 text-red-600'
              }`}
            >
              {errorPopup.type === 'network' ? (
                <WifiOff className="w-7 h-7" />
              ) : errorPopup.type === 'photo' ? (
                <Camera className="w-7 h-7" />
              ) : errorPopup.type === 'server' || errorPopup.type === 'database' ? (
                <ServerCrash className="w-7 h-7" />
              ) : (
                <AlertCircle className="w-7 h-7" />
              )}
            </div>

            {/* Error Title */}
            <h3 id="error-modal-title" className="text-base sm:text-lg font-bold text-slate-900 mb-2">
              {errorPopup.title || 'Please Check Details'}
            </h3>

            {/* Error Message */}
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-6 font-medium break-words">
              {errorPopup.message}
            </p>

            {/* OK Action Button */}
            <button
              type="button"
              onClick={closePopupError}
              className="w-full py-3 px-5 bg-[#006B3C] hover:bg-[#005530] text-white font-bold rounded-xl text-xs sm:text-sm transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-[#006B3C] focus:ring-offset-2 active:scale-[0.98]"
            >
              OK, Got It
            </button>
          </div>
        </div>
      )}

      <main className="max-w-4xl w-full px-4 py-8 sm:py-10">
        {/* Rupeeapex Company Logo Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8 mb-6 text-center flex flex-col items-center">
          <div className="relative w-[300px] sm:w-[420px] h-[100px] sm:h-[130px] mb-4">
            <Image
              src="/logo/rupeeapex-logo.jpeg"
              alt="Rupeeapex Logo"
              fill
              className="object-contain"
              priority
            />
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            JOB APPLICATION FORM
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-2 font-medium">
            Please fill in all the details accurately as per your official records.
          </p>
        </div>

        {/* ==================================================== */}
        {/* 1 & 2. FIVE-STEP PROGRESS INDICATOR */}
        {/* ==================================================== */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 sm:p-6 mb-8">
          <div className="relative">
            {/* Background horizontal connecting line */}
            <div
              className="absolute top-4 sm:top-5 left-[10%] right-[10%] h-1 bg-slate-200 -translate-y-1/2 z-0"
              aria-hidden="true"
            />

            {/* Dynamic Rupeeapex green progress line */}
            <div
              className="absolute top-4 sm:top-5 left-[10%] h-1 bg-[#006B3C] -translate-y-1/2 z-0 transition-all duration-300"
              style={{
                width: `${((currentStep - 1) / (STEPS.length - 1)) * 80}%`,
              }}
              aria-hidden="true"
            />

            {/* 5 Numbered Stages */}
            <div className="relative z-10 flex items-start justify-between">
              {STEPS.map((step) => {
                const isCompleted = step.id < currentStep;
                const isCurrent = step.id === currentStep;
                const isFuture = step.id > currentStep;

                return (
                  <div key={step.id} className="flex flex-col items-center flex-1 min-w-0">
                    {/* Circle Indicator */}
                    <button
                      type="button"
                      disabled={isFuture}
                      onClick={() => {
                        if (isCompleted) {
                          closePopupError();
                          setFieldErrors({});
                          setCurrentStep(step.id);
                          window.scrollTo({ top: 120, behavior: 'smooth' });
                        }
                      }}
                      className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold transition-all duration-200 ${
                        isCompleted
                          ? 'bg-[#006B3C] text-white border-2 border-[#006B3C] shadow-sm hover:bg-[#005530] cursor-pointer'
                          : isCurrent
                          ? 'bg-[#006B3C] text-white border-2 border-[#006B3C] ring-4 ring-emerald-100 shadow-md scale-110'
                          : 'bg-white text-slate-400 border-2 border-slate-300 cursor-not-allowed'
                      }`}
                      title={isCompleted ? `Go back to ${step.name}` : step.name}
                      aria-label={`Step ${step.id}: ${step.name} ${
                        isCompleted
                          ? '(Completed)'
                          : isCurrent
                          ? '(Active Stage)'
                          : '(Pending)'
                      }`}
                    >
                      {isCompleted ? (
                        <Check className="w-4 h-4 sm:w-5 sm:h-5 text-white stroke-[2.5]" />
                      ) : (
                        <span>{step.id}</span>
                      )}
                    </button>

                    {/* Stage Name */}
                    <span
                      className={`mt-2 text-center text-[9px] sm:text-[11px] md:text-xs leading-tight font-medium max-w-[65px] sm:max-w-[110px] transition-colors duration-200 ${
                        isCurrent
                          ? 'text-[#006B3C] font-extrabold'
                          : isCompleted
                          ? 'text-slate-800 font-semibold'
                          : 'text-slate-400'
                      }`}
                    >
                      {step.name}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Active Stage Quick Information Banner */}
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
            <span className="font-semibold text-slate-700">
              Stage {currentStep} of {STEPS.length}:{' '}
              <strong className="text-[#006B3C]">{STEPS[currentStep - 1].name}</strong>
            </span>
            <span className="text-[11px] bg-emerald-50 text-[#006B3C] px-2.5 py-0.5 rounded-full font-bold border border-emerald-200">
              {Math.round(((currentStep - 1) / (STEPS.length - 1)) * 100)}% Completed
            </span>
          </div>
        </div>

        {/* Candidate Application Form */}
        <form onSubmit={handleSubmit} noValidate className="space-y-8">
          {/* ==================================================== */}
          {/* STEP 1: PERSONAL DETAILS & CANDIDATE PHOTOGRAPH */}
          {/* ==================================================== */}
          <div className={currentStep === 1 ? 'space-y-8 animate-fadeIn' : 'hidden'}>
            {/* Candidate Photograph Section */}
            <section
              data-field="photograph"
              className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden"
            >
              <div className="bg-emerald-50/70 px-6 py-3.5 border-b border-emerald-100 flex items-center gap-2.5">
                <Camera className="w-5 h-5 text-[#006B3C]" />
                <h2 className="text-sm sm:text-base font-bold text-slate-900">
                  CANDIDATE PHOTOGRAPH <span className="text-red-500">*</span>
                </h2>
              </div>
              <div className="p-6 flex flex-col sm:flex-row items-center gap-6">
                {/* Photo Preview */}
                <div
                  className={`w-32 h-40 rounded-xl border-2 border-dashed flex items-center justify-center overflow-hidden shrink-0 relative transition-all ${
                    fieldErrors['photograph']
                      ? 'border-red-500 ring-4 ring-red-200 bg-red-50/50'
                      : 'border-slate-300 bg-slate-50'
                  }`}
                >
                  {photoPreview ? (
                    <Image
                      src={photoPreview}
                      alt="Candidate Preview"
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="text-center p-3 text-slate-400 flex flex-col items-center">
                      <User className="w-10 h-10 mb-1" />
                      <span className="text-[10px] font-medium leading-tight">Passport Photo</span>
                    </div>
                  )}
                </div>

                {/* Upload controls */}
                <div className="flex-1 text-center sm:text-left space-y-3">
                  <input
                    id="candidate-photo-input"
                    name="photograph"
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    onChange={handlePhotoSelect}
                    className="sr-only"
                  />

                  <div className="flex flex-wrap gap-2.5 justify-center sm:justify-start">
                    <label
                      htmlFor="candidate-photo-input"
                      className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#006B3C] hover:bg-[#005530] text-white text-xs font-semibold rounded-xl transition-colors shadow-sm cursor-pointer select-none active:scale-95"
                    >
                      <UploadCloud className="w-4 h-4" />
                      <span>{photoFile ? 'Change Photograph' : 'Upload or Take Photo'}</span>
                    </label>
                    {photoFile && (
                      <button
                        type="button"
                        onClick={() => {
                          setPhotoFile(null);
                          setPhotoPreview(null);
                          if (fileInputRef.current) fileInputRef.current.value = '';
                        }}
                        className="px-3 py-2 text-xs text-red-600 hover:bg-red-50 rounded-xl font-medium"
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  <div className="text-xs text-slate-500 leading-relaxed">
                    {fieldErrors['photograph'] && (
                      <div className="p-3 mb-2.5 rounded-xl bg-red-50 border border-red-200 text-xs font-semibold text-red-700 flex items-start gap-2 shadow-sm animate-fadeIn">
                        <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                        <span className="leading-relaxed">{fieldErrors['photograph']}</span>
                      </div>
                    )}
                    <p>
                      • Accepted formats: <strong>JPG, JPEG, PNG, WEBP</strong> (Max file size: 5 MB).
                    </p>
                    <p>• You may capture directly from your mobile camera or pick from gallery.</p>
                  </div>
                </div>
              </div>
            </section>

            {/* Personal Details Section */}
            <section className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="bg-emerald-50/70 px-6 py-3.5 border-b border-emerald-100 flex items-center gap-2.5">
                <User className="w-5 h-5 text-[#006B3C]" />
                <h2 className="text-sm sm:text-base font-bold text-slate-900">PERSONAL DETAILS</h2>
              </div>
              <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {/* Candidate Name */}
                <div className="sm:col-span-2 lg:col-span-1">
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Candidate Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="fullName"
                    name="fullName"
                    type="text"
                    required
                    placeholder="Full name as per Aadhaar"
                    value={formData.personalDetails.fullName}
                    onChange={(e) => {
                      clearFieldError('fullName');
                      setFormData((prev) => ({
                        ...prev,
                        personalDetails: { ...prev.personalDetails, fullName: e.target.value },
                      }));
                    }}
                    className={getFieldClass(
                      'fullName',
                      'w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-[#006B3C] focus:outline-none'
                    )}
                  />
                  {fieldErrors['fullName'] && (
                    <p className="mt-1 text-xs text-red-600 font-medium">
                      {fieldErrors['fullName']}
                    </p>
                  )}
                </div>

                {/* Date of Birth */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Date of Birth <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="dateOfBirth"
                    name="dateOfBirth"
                    type="date"
                    required
                    value={formData.personalDetails.dateOfBirth}
                    onChange={(e) => handleDobChange(e.target.value)}
                    className={getFieldClass(
                      'dateOfBirth',
                      'w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-[#006B3C] focus:outline-none'
                    )}
                  />
                  {fieldErrors['dateOfBirth'] && (
                    <p className="mt-1 text-xs text-red-600 font-medium">
                      {fieldErrors['dateOfBirth']}
                    </p>
                  )}
                </div>

                {/* Age */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Age <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="age"
                    name="age"
                    type="number"
                    min="18"
                    max="70"
                    required
                    value={formData.personalDetails.age}
                    onChange={(e) => {
                      clearFieldError('age');
                      setFormData((prev) => ({
                        ...prev,
                        personalDetails: {
                          ...prev.personalDetails,
                          age: Number(e.target.value),
                        },
                      }));
                    }}
                    className={getFieldClass(
                      'age',
                      'w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-[#006B3C] focus:outline-none'
                    )}
                  />
                  {fieldErrors['age'] && (
                    <p className="mt-1 text-xs text-red-600 font-medium">
                      {fieldErrors['age']}
                    </p>
                  )}
                </div>

                {/* Gender */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Gender <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="gender"
                    name="gender"
                    value={formData.personalDetails.gender}
                    onChange={(e) => {
                      clearFieldError('gender');
                      setFormData((prev) => ({
                        ...prev,
                        personalDetails: {
                          ...prev.personalDetails,
                          gender: e.target.value as any,
                        },
                      }));
                    }}
                    className={getFieldClass(
                      'gender',
                      'w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-[#006B3C] focus:outline-none'
                    )}
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>

                {/* Marital Status */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Marital Status <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="maritalStatus"
                    name="maritalStatus"
                    value={formData.personalDetails.maritalStatus}
                    onChange={(e) => {
                      clearFieldError('maritalStatus');
                      setFormData((prev) => ({
                        ...prev,
                        personalDetails: {
                          ...prev.personalDetails,
                          maritalStatus: e.target.value as any,
                        },
                      }));
                    }}
                    className={getFieldClass(
                      'maritalStatus',
                      'w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-[#006B3C] focus:outline-none'
                    )}
                  >
                    {MARITAL_STATUSES.map((ms) => (
                      <option key={ms} value={ms}>
                        {ms}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Blood Group (Optional) */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Blood Group{' '}
                    <span className="text-slate-400 font-normal text-[11px]">(Optional)</span>
                  </label>
                  <select
                    id="bloodGroup"
                    name="bloodGroup"
                    value={formData.personalDetails.bloodGroup}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        personalDetails: {
                          ...prev.personalDetails,
                          bloodGroup: e.target.value,
                        },
                      }))
                    }
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-[#006B3C] focus:outline-none"
                  >
                    <option value="">Select Blood Group</option>
                    {BLOOD_Group.map((bg) => (
                      <option key={bg} value={bg}>
                        {bg}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Father's Name */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Father&apos;s Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="fathersName"
                    name="fathersName"
                    type="text"
                    required
                    placeholder="Father's full name"
                    value={formData.personalDetails.fathersName}
                    onChange={(e) => {
                      clearFieldError('fathersName');
                      setFormData((prev) => ({
                        ...prev,
                        personalDetails: { ...prev.personalDetails, fathersName: e.target.value },
                      }));
                    }}
                    className={getFieldClass(
                      'fathersName',
                      'w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-[#006B3C] focus:outline-none'
                    )}
                  />
                  {fieldErrors['fathersName'] && (
                    <p className="mt-1 text-xs text-red-600 font-medium">
                      {fieldErrors['fathersName']}
                    </p>
                  )}
                </div>

                {/* Mother's Name */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Mother&apos;s Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="mothersName"
                    name="mothersName"
                    type="text"
                    required
                    placeholder="Mother's full name"
                    value={formData.personalDetails.mothersName}
                    onChange={(e) => {
                      clearFieldError('mothersName');
                      setFormData((prev) => ({
                        ...prev,
                        personalDetails: { ...prev.personalDetails, mothersName: e.target.value },
                      }));
                    }}
                    className={getFieldClass(
                      'mothersName',
                      'w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-[#006B3C] focus:outline-none'
                    )}
                  />
                  {fieldErrors['mothersName'] && (
                    <p className="mt-1 text-xs text-red-600 font-medium">
                      {fieldErrors['mothersName']}
                    </p>
                  )}
                </div>

                {/* Spouse Name (if applicable) */}
                {formData.personalDetails.maritalStatus === 'Married' && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                      Spouse Name
                    </label>
                    <input
                      id="spouseName"
                      name="spouseName"
                      type="text"
                      placeholder="Husband / Wife name"
                      value={formData.personalDetails.spouseName}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          personalDetails: { ...prev.personalDetails, spouseName: e.target.value },
                        }))
                      }
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-[#006B3C] focus:outline-none"
                    />
                  </div>
                )}

                {/* Mobile Number */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Mobile Number <span className="text-red-500">*</span>
                  </label>
                  <div className="flex">
                    <span className="inline-flex items-center px-3 rounded-l-xl border border-r-0 border-slate-300 bg-slate-100 text-slate-600 text-xs font-semibold">
                      +91
                    </span>
                    <input
                      id="mobileNumber"
                      name="mobileNumber"
                      type="tel"
                      required
                      maxLength={10}
                      placeholder="10-digit mobile"
                      value={formData.personalDetails.mobileNumber}
                      onChange={(e) => {
                        clearFieldError('mobileNumber');
                        setFormData((prev) => ({
                          ...prev,
                          personalDetails: {
                            ...prev.personalDetails,
                            mobileNumber: e.target.value.replace(/\D/g, ''),
                          },
                        }));
                      }}
                      className={getFieldClass(
                        'mobileNumber',
                        'w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-r-xl text-sm focus:bg-white focus:ring-2 focus:ring-[#006B3C] focus:outline-none'
                      )}
                    />
                  </div>
                  {fieldErrors['mobileNumber'] && (
                    <p className="mt-1 text-xs text-red-600 font-medium">
                      {fieldErrors['mobileNumber']}
                    </p>
                  )}
                </div>

                {/* Alternative Mobile Number */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Alternative Mobile Number{' '}
                    <span className="text-slate-400 font-normal text-[11px]">(Optional)</span>
                  </label>
                  <div className="flex">
                    <span className="inline-flex items-center px-3 rounded-l-xl border border-r-0 border-slate-300 bg-slate-100 text-slate-600 text-xs font-semibold">
                      +91
                    </span>
                    <input
                      id="alternativeMobileNumber"
                      name="alternativeMobileNumber"
                      type="tel"
                      maxLength={10}
                      placeholder="Optional backup mobile"
                      value={formData.personalDetails.alternativeMobileNumber}
                      onChange={(e) => {
                        clearFieldError('alternativeMobileNumber');
                        setFormData((prev) => ({
                          ...prev,
                          personalDetails: {
                            ...prev.personalDetails,
                            alternativeMobileNumber: e.target.value.replace(/\D/g, ''),
                          },
                        }));
                      }}
                      className={getFieldClass(
                        'alternativeMobileNumber',
                        'w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-r-xl text-sm focus:bg-white focus:ring-2 focus:ring-[#006B3C] focus:outline-none'
                      )}
                    />
                  </div>
                  {fieldErrors['alternativeMobileNumber'] && (
                    <p className="mt-1 text-xs text-red-600 font-medium">
                      {fieldErrors['alternativeMobileNumber']}
                    </p>
                  )}
                </div>

                {/* Email Address */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    placeholder="candidate@example.com"
                    value={formData.personalDetails.email}
                    onChange={(e) => {
                      clearFieldError('email');
                      setFormData((prev) => ({
                        ...prev,
                        personalDetails: { ...prev.personalDetails, email: e.target.value },
                      }));
                    }}
                    className={getFieldClass(
                      'email',
                      'w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-[#006B3C] focus:outline-none'
                    )}
                  />
                  {fieldErrors['email'] && (
                    <p className="mt-1 text-xs text-red-600 font-medium">
                      {fieldErrors['email']}
                    </p>
                  )}
                </div>

                {/* Aadhaar Number */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Aadhaar Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="aadhaarNumber"
                    name="aadhaarNumber"
                    type="text"
                    required
                    maxLength={12}
                    placeholder="12-digit Aadhaar number"
                    value={formData.personalDetails.aadhaarNumber}
                    onChange={(e) => {
                      clearFieldError('aadhaarNumber');
                      setFormData((prev) => ({
                        ...prev,
                        personalDetails: {
                          ...prev.personalDetails,
                          aadhaarNumber: e.target.value.replace(/\D/g, ''),
                        },
                      }));
                    }}
                    className={getFieldClass(
                      'aadhaarNumber',
                      'w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-mono focus:bg-white focus:ring-2 focus:ring-[#006B3C] focus:outline-none'
                    )}
                  />
                  {fieldErrors['aadhaarNumber'] && (
                    <p className="mt-1 text-xs text-red-600 font-medium">
                      {fieldErrors['aadhaarNumber']}
                    </p>
                  )}
                </div>

                {/* PAN Number (Optional) */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    PAN Number{' '}
                    <span className="text-slate-400 font-normal text-[11px]">(Optional)</span>
                  </label>
                  <input
                    id="panNumber"
                    name="panNumber"
                    type="text"
                    maxLength={10}
                    placeholder="e.g. ABCDE1234F"
                    value={formData.personalDetails.panNumber}
                    onChange={(e) => {
                      clearFieldError('panNumber');
                      setFormData((prev) => ({
                        ...prev,
                        personalDetails: {
                          ...prev.personalDetails,
                          panNumber: e.target.value.toUpperCase(),
                        },
                      }));
                    }}
                    className={getFieldClass(
                      'panNumber',
                      'w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-mono uppercase focus:bg-white focus:ring-2 focus:ring-[#006B3C] focus:outline-none'
                    )}
                  />
                  {fieldErrors['panNumber'] && (
                    <p className="mt-1 text-xs text-red-600 font-medium">
                      {fieldErrors['panNumber']}
                    </p>
                  )}
                </div>

                {/* Driving License Number (Optional) */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Driving License Number{' '}
                    <span className="text-slate-400 font-normal text-[11px]">(Optional)</span>
                  </label>
                  <input
                    id="drivingLicenseNumber"
                    name="drivingLicenseNumber"
                    type="text"
                    placeholder="e.g. TN0120220001234"
                    value={formData.personalDetails.drivingLicenseNumber}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        personalDetails: {
                          ...prev.personalDetails,
                          drivingLicenseNumber: e.target.value.toUpperCase(),
                        },
                      }))
                    }
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-mono uppercase focus:bg-white focus:ring-2 focus:ring-[#006B3C] focus:outline-none"
                  />
                </div>

                {/* Bank Account Number (Optional) */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Bank Account No{' '}
                    <span className="text-slate-400 font-normal text-[11px]">(Optional)</span>
                  </label>
                  <input
                    id="bankAccountNumber"
                    name="bankAccountNumber"
                    type="text"
                    placeholder="e.g. 10234567890"
                    value={formData.personalDetails.bankAccountNumber}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        personalDetails: {
                          ...prev.personalDetails,
                          bankAccountNumber: e.target.value.replace(/\D/g, ''),
                        },
                      }))
                    }
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-mono focus:bg-white focus:ring-2 focus:ring-[#006B3C] focus:outline-none"
                  />
                </div>

                {/* IFSC Code (Optional) */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    IFSC Code{' '}
                    <span className="text-slate-400 font-normal text-[11px]">(Optional)</span>
                  </label>
                  <input
                    id="ifscCode"
                    name="ifscCode"
                    type="text"
                    maxLength={11}
                    placeholder="e.g. SBIN0001234"
                    value={formData.personalDetails.ifscCode}
                    onChange={(e) => {
                      clearFieldError('ifscCode');
                      setFormData((prev) => ({
                        ...prev,
                        personalDetails: {
                          ...prev.personalDetails,
                          ifscCode: e.target.value.toUpperCase(),
                        },
                      }));
                    }}
                    className={getFieldClass(
                      'ifscCode',
                      'w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-mono uppercase focus:bg-white focus:ring-2 focus:ring-[#006B3C] focus:outline-none'
                    )}
                  />
                  {fieldErrors['ifscCode'] && (
                    <p className="mt-1 text-xs text-red-600 font-medium">
                      {fieldErrors['ifscCode']}
                    </p>
                  )}
                </div>

                {/* Bank & Branch Name (Optional) */}
                <div className="sm:col-span-2 lg:col-span-1">
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Bank & Branch Name{' '}
                    <span className="text-slate-400 font-normal text-[11px]">(Optional)</span>
                  </label>
                  <input
                    id="bankBranchName"
                    name="bankBranchName"
                    type="text"
                    placeholder="e.g. State Bank of India, Thanjavur"
                    value={formData.personalDetails.bankBranchName}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        personalDetails: {
                          ...prev.personalDetails,
                          bankBranchName: e.target.value,
                        },
                      }))
                    }
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-[#006B3C] focus:outline-none"
                  />
                </div>
              </div>
            </section>
          </div>

          {/* ==================================================== */}
          {/* STEP 2: FAMILY DETAILS */}
          {/* ==================================================== */}
          <div className={currentStep === 2 ? 'space-y-8 animate-fadeIn' : 'hidden'}>
            <section className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="bg-emerald-50/70 px-6 py-3.5 border-b border-emerald-100 flex items-center gap-2.5">
                <Users className="w-5 h-5 text-[#006B3C]" />
                <h2 className="text-sm sm:text-base font-bold text-slate-900">FAMILY DETAILS</h2>
              </div>
              <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {/* Father's Occupation */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Father&apos;s Occupation
                  </label>
                  <input
                    id="fathersOccupation"
                    name="fathersOccupation"
                    type="text"
                    placeholder="e.g. Farmer / Business / Service"
                    value={formData.familyDetails.fathersOccupation}
                    onChange={(e) => {
                      clearFieldError('fathersOccupation');
                      setFormData((prev) => ({
                        ...prev,
                        familyDetails: { ...prev.familyDetails, fathersOccupation: e.target.value },
                      }));
                    }}
                    className={getFieldClass(
                      'fathersOccupation',
                      'w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-[#006B3C] focus:outline-none'
                    )}
                  />
                  {fieldErrors['fathersOccupation'] && (
                    <p className="mt-1 text-xs text-red-600 font-medium">
                      {fieldErrors['fathersOccupation']}
                    </p>
                  )}
                </div>

                {/* Father's Mobile */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Father&apos;s Mobile Number
                  </label>
                  <input
                    id="fathersMobile"
                    name="fathersMobile"
                    type="tel"
                    maxLength={10}
                    placeholder="10-digit mobile"
                    value={formData.familyDetails.fathersMobile}
                    onChange={(e) => {
                      clearFieldError('fathersMobile');
                      setFormData((prev) => ({
                        ...prev,
                        familyDetails: {
                          ...prev.familyDetails,
                          fathersMobile: e.target.value.replace(/\D/g, ''),
                        },
                      }));
                    }}
                    className={getFieldClass(
                      'fathersMobile',
                      'w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-[#006B3C] focus:outline-none'
                    )}
                  />
                  {fieldErrors['fathersMobile'] && (
                    <p className="mt-1 text-xs text-red-600 font-medium">
                      {fieldErrors['fathersMobile']}
                    </p>
                  )}
                </div>

                {/* Mother's Occupation */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Mother&apos;s Occupation
                  </label>
                  <input
                    id="mothersOccupation"
                    name="mothersOccupation"
                    type="text"
                    placeholder="e.g. Homemaker / Teacher"
                    value={formData.familyDetails.mothersOccupation}
                    onChange={(e) => {
                      clearFieldError('mothersOccupation');
                      setFormData((prev) => ({
                        ...prev,
                        familyDetails: { ...prev.familyDetails, mothersOccupation: e.target.value },
                      }));
                    }}
                    className={getFieldClass(
                      'mothersOccupation',
                      'w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-[#006B3C] focus:outline-none'
                    )}
                  />
                  {fieldErrors['mothersOccupation'] && (
                    <p className="mt-1 text-xs text-red-600 font-medium">
                      {fieldErrors['mothersOccupation']}
                    </p>
                  )}
                </div>

                {/* Mother's Mobile */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Mother&apos;s Mobile Number
                  </label>
                  <input
                    id="mothersMobile"
                    name="mothersMobile"
                    type="tel"
                    maxLength={10}
                    placeholder="10-digit mobile"
                    value={formData.familyDetails.mothersMobile}
                    onChange={(e) => {
                      clearFieldError('mothersMobile');
                      setFormData((prev) => ({
                        ...prev,
                        familyDetails: {
                          ...prev.familyDetails,
                          mothersMobile: e.target.value.replace(/\D/g, ''),
                        },
                      }));
                    }}
                    className={getFieldClass(
                      'mothersMobile',
                      'w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-[#006B3C] focus:outline-none'
                    )}
                  />
                  {fieldErrors['mothersMobile'] && (
                    <p className="mt-1 text-xs text-red-600 font-medium">
                      {fieldErrors['mothersMobile']}
                    </p>
                  )}
                </div>

                {/* Spouse Occupation (if Married) */}
                {formData.personalDetails.maritalStatus === 'Married' && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                      Spouse Occupation
                    </label>
                    <input
                      id="spouseOccupation"
                      name="spouseOccupation"
                      type="text"
                      placeholder="e.g. Private employee / Business"
                      value={formData.familyDetails.spouseOccupation}
                      onChange={(e) => {
                        clearFieldError('spouseOccupation');
                        setFormData((prev) => ({
                          ...prev,
                          familyDetails: { ...prev.familyDetails, spouseOccupation: e.target.value },
                        }));
                      }}
                      className={getFieldClass(
                        'spouseOccupation',
                        'w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-[#006B3C] focus:outline-none'
                      )}
                    />
                  </div>
                )}
              </div>
            </section>
          </div>

          {/* ==================================================== */}
          {/* STEP 3: ADDRESS DETAILS */}
          {/* ==================================================== */}
          <div className={currentStep === 3 ? 'space-y-8 animate-fadeIn' : 'hidden'}>
            <section className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="bg-emerald-50/70 px-6 py-3.5 border-b border-emerald-100 flex items-center gap-2.5">
                <Home className="w-5 h-5 text-[#006B3C]" />
                <h2 className="text-sm sm:text-base font-bold text-slate-900">ADDRESS DETAILS</h2>
              </div>
              <div className="p-6 space-y-6">
                {/* Permanent Address */}
                <div>
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
                    Permanent Address <span className="text-red-500">*</span>
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Door Number / Street <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="doorNoStreet"
                        name="doorNoStreet"
                        type="text"
                        required
                        placeholder="e.g. 12/4B, Main Road"
                        value={formData.addressDetails.permanentAddress.doorNoStreet}
                        onChange={(e) => {
                          clearFieldError('doorNoStreet');
                          setFormData((prev) => ({
                            ...prev,
                            addressDetails: {
                              ...prev.addressDetails,
                              permanentAddress: {
                                ...prev.addressDetails.permanentAddress,
                                doorNoStreet: e.target.value,
                              },
                            },
                          }));
                        }}
                        className={getFieldClass(
                          'doorNoStreet',
                          'w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-[#006B3C] focus:outline-none'
                        )}
                      />
                      {fieldErrors['doorNoStreet'] && (
                        <p className="mt-1 text-xs text-red-600 font-medium">
                          {fieldErrors['doorNoStreet']}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Village / Area <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="villageOrArea"
                        name="villageOrArea"
                        type="text"
                        required
                        placeholder="Village / Town / Area"
                        value={formData.addressDetails.permanentAddress.villageOrArea}
                        onChange={(e) => {
                          clearFieldError('villageOrArea');
                          setFormData((prev) => ({
                            ...prev,
                            addressDetails: {
                              ...prev.addressDetails,
                              permanentAddress: {
                                ...prev.addressDetails.permanentAddress,
                                villageOrArea: e.target.value,
                              },
                            },
                          }));
                        }}
                        className={getFieldClass(
                          'villageOrArea',
                          'w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-[#006B3C] focus:outline-none'
                        )}
                      />
                      {fieldErrors['villageOrArea'] && (
                        <p className="mt-1 text-xs text-red-600 font-medium">
                          {fieldErrors['villageOrArea']}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Taluk <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="taluk"
                        name="taluk"
                        type="text"
                        required
                        placeholder="Taluk"
                        value={formData.addressDetails.permanentAddress.taluk}
                        onChange={(e) => {
                          clearFieldError('taluk');
                          setFormData((prev) => ({
                            ...prev,
                            addressDetails: {
                              ...prev.addressDetails,
                              permanentAddress: {
                                ...prev.addressDetails.permanentAddress,
                                taluk: e.target.value,
                              },
                            },
                          }));
                        }}
                        className={getFieldClass(
                          'taluk',
                          'w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-[#006B3C] focus:outline-none'
                        )}
                      />
                      {fieldErrors['taluk'] && (
                        <p className="mt-1 text-xs text-red-600 font-medium">
                          {fieldErrors['taluk']}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        District <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="district"
                        name="district"
                        type="text"
                        required
                        placeholder="District"
                        value={formData.addressDetails.permanentAddress.district}
                        onChange={(e) => {
                          clearFieldError('district');
                          setFormData((prev) => ({
                            ...prev,
                            addressDetails: {
                              ...prev.addressDetails,
                              permanentAddress: {
                                ...prev.addressDetails.permanentAddress,
                                district: e.target.value,
                              },
                            },
                          }));
                        }}
                        className={getFieldClass(
                          'district',
                          'w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-[#006B3C] focus:outline-none'
                        )}
                      />
                      {fieldErrors['district'] && (
                        <p className="mt-1 text-xs text-red-600 font-medium">
                          {fieldErrors['district']}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        State <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="state"
                        name="state"
                        type="text"
                        required
                        placeholder="State"
                        value={formData.addressDetails.permanentAddress.state}
                        onChange={(e) => {
                          clearFieldError('state');
                          setFormData((prev) => ({
                            ...prev,
                            addressDetails: {
                              ...prev.addressDetails,
                              permanentAddress: {
                                ...prev.addressDetails.permanentAddress,
                                state: e.target.value,
                              },
                            },
                          }));
                        }}
                        className={getFieldClass(
                          'state',
                          'w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-[#006B3C] focus:outline-none'
                        )}
                      />
                      {fieldErrors['state'] && (
                        <p className="mt-1 text-xs text-red-600 font-medium">
                          {fieldErrors['state']}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        PIN Code <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="pincode"
                        name="pincode"
                        type="text"
                        required
                        maxLength={6}
                        placeholder="6-digit PIN"
                        value={formData.addressDetails.permanentAddress.pincode}
                        onChange={(e) => {
                          clearFieldError('pincode');
                          setFormData((prev) => ({
                            ...prev,
                            addressDetails: {
                              ...prev.addressDetails,
                              permanentAddress: {
                                ...prev.addressDetails.permanentAddress,
                                pincode: e.target.value.replace(/\D/g, ''),
                              },
                            },
                          }));
                        }}
                        className={getFieldClass(
                          'pincode',
                          'w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-[#006B3C] focus:outline-none'
                        )}
                      />
                      {fieldErrors['pincode'] && (
                        <p className="mt-1 text-xs text-red-600 font-medium">
                          {fieldErrors['pincode']}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Checkbox: Same as Permanent */}
                <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="sameAsPermanent"
                    name="sameAsPermanent"
                    checked={formData.addressDetails.sameAsPermanent}
                    onChange={(e) => handleSameAddressToggle(e.target.checked)}
                    className="w-4 h-4 text-[#006B3C] rounded border-slate-300 focus:ring-[#006B3C]"
                  />
                  <label
                    htmlFor="sameAsPermanent"
                    className="text-xs font-semibold text-slate-700 select-none cursor-pointer"
                  >
                    Temporary / Present Address is same as Permanent Address
                  </label>
                </div>

                {/* Temporary Address (only if not same) */}
                {!formData.addressDetails.sameAsPermanent && (
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
                      Temporary Address <span className="text-red-500">*</span>
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div className="sm:col-span-2">
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                          Door Number / Street <span className="text-red-500">*</span>
                        </label>
                        <input
                          id="tempDoorNoStreet"
                          name="tempDoorNoStreet"
                          type="text"
                          required
                          placeholder="e.g. 5A, North Street"
                          value={formData.addressDetails.temporaryAddress.doorNoStreet}
                          onChange={(e) => {
                            clearFieldError('tempDoorNoStreet');
                            setFormData((prev) => ({
                              ...prev,
                              addressDetails: {
                                ...prev.addressDetails,
                                temporaryAddress: {
                                  ...prev.addressDetails.temporaryAddress,
                                  doorNoStreet: e.target.value,
                                },
                              },
                            }));
                          }}
                          className={getFieldClass(
                            'tempDoorNoStreet',
                            'w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-[#006B3C] focus:outline-none'
                          )}
                        />
                        {fieldErrors['tempDoorNoStreet'] && (
                          <p className="mt-1 text-xs text-red-600 font-medium">
                            {fieldErrors['tempDoorNoStreet']}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                          Village / Area <span className="text-red-500">*</span>
                        </label>
                        <input
                          id="tempVillageOrArea"
                          name="tempVillageOrArea"
                          type="text"
                          required
                          placeholder="Village / Town / Area"
                          value={formData.addressDetails.temporaryAddress.villageOrArea}
                          onChange={(e) => {
                            clearFieldError('tempVillageOrArea');
                            setFormData((prev) => ({
                              ...prev,
                              addressDetails: {
                                ...prev.addressDetails,
                                temporaryAddress: {
                                  ...prev.addressDetails.temporaryAddress,
                                  villageOrArea: e.target.value,
                                },
                              },
                            }));
                          }}
                          className={getFieldClass(
                            'tempVillageOrArea',
                            'w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-[#006B3C] focus:outline-none'
                          )}
                        />
                        {fieldErrors['tempVillageOrArea'] && (
                          <p className="mt-1 text-xs text-red-600 font-medium">
                            {fieldErrors['tempVillageOrArea']}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                          Taluk <span className="text-red-500">*</span>
                        </label>
                        <input
                          id="tempTaluk"
                          name="tempTaluk"
                          type="text"
                          required
                          placeholder="Taluk"
                          value={formData.addressDetails.temporaryAddress.taluk}
                          onChange={(e) => {
                            clearFieldError('tempTaluk');
                            setFormData((prev) => ({
                              ...prev,
                              addressDetails: {
                                ...prev.addressDetails,
                                temporaryAddress: {
                                  ...prev.addressDetails.temporaryAddress,
                                  taluk: e.target.value,
                                },
                              },
                            }));
                          }}
                          className={getFieldClass(
                            'tempTaluk',
                            'w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-[#006B3C] focus:outline-none'
                          )}
                        />
                        {fieldErrors['tempTaluk'] && (
                          <p className="mt-1 text-xs text-red-600 font-medium">
                            {fieldErrors['tempTaluk']}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                          District <span className="text-red-500">*</span>
                        </label>
                        <input
                          id="tempDistrict"
                          name="tempDistrict"
                          type="text"
                          required
                          placeholder="District"
                          value={formData.addressDetails.temporaryAddress.district}
                          onChange={(e) => {
                            clearFieldError('tempDistrict');
                            setFormData((prev) => ({
                              ...prev,
                              addressDetails: {
                                ...prev.addressDetails,
                                temporaryAddress: {
                                  ...prev.addressDetails.temporaryAddress,
                                  district: e.target.value,
                                },
                              },
                            }));
                          }}
                          className={getFieldClass(
                            'tempDistrict',
                            'w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-[#006B3C] focus:outline-none'
                          )}
                        />
                        {fieldErrors['tempDistrict'] && (
                          <p className="mt-1 text-xs text-red-600 font-medium">
                            {fieldErrors['tempDistrict']}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                          State <span className="text-red-500">*</span>
                        </label>
                        <input
                          id="tempState"
                          name="tempState"
                          type="text"
                          required
                          placeholder="State"
                          value={formData.addressDetails.temporaryAddress.state}
                          onChange={(e) => {
                            clearFieldError('tempState');
                            setFormData((prev) => ({
                              ...prev,
                              addressDetails: {
                                ...prev.addressDetails,
                                temporaryAddress: {
                                  ...prev.addressDetails.temporaryAddress,
                                  state: e.target.value,
                                },
                              },
                            }));
                          }}
                          className={getFieldClass(
                            'tempState',
                            'w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-[#006B3C] focus:outline-none'
                          )}
                        />
                        {fieldErrors['tempState'] && (
                          <p className="mt-1 text-xs text-red-600 font-medium">
                            {fieldErrors['tempState']}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                          PIN Code <span className="text-red-500">*</span>
                        </label>
                        <input
                          id="tempPincode"
                          name="tempPincode"
                          type="text"
                          required
                          maxLength={6}
                          placeholder="6-digit PIN"
                          value={formData.addressDetails.temporaryAddress.pincode}
                          onChange={(e) => {
                            clearFieldError('tempPincode');
                            setFormData((prev) => ({
                              ...prev,
                              addressDetails: {
                                ...prev.addressDetails,
                                temporaryAddress: {
                                  ...prev.addressDetails.temporaryAddress,
                                  pincode: e.target.value.replace(/\D/g, ''),
                                },
                              },
                            }));
                          }}
                          className={getFieldClass(
                            'tempPincode',
                            'w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-[#006B3C] focus:outline-none'
                          )}
                        />
                        {fieldErrors['tempPincode'] && (
                          <p className="mt-1 text-xs text-red-600 font-medium">
                            {fieldErrors['tempPincode']}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </section>
          </div>

          {/* ==================================================== */}
          {/* STEP 4: EDUCATION & EXPERIENCE */}
          {/* ==================================================== */}
          <div className={currentStep === 4 ? 'space-y-8 animate-fadeIn' : 'hidden'}>
            {/* Education Details Section */}
            <section className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="bg-emerald-50/70 px-6 py-3.5 border-b border-emerald-100 flex items-center gap-2.5">
                <GraduationCap className="w-5 h-5 text-[#006B3C]" />
                <h2 className="text-sm sm:text-base font-bold text-slate-900">EDUCATION DETAILS</h2>
              </div>
              <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {/* Highest Qualification */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Highest Qualification <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="highestQualification"
                    name="highestQualification"
                    required
                    value={formData.educationDetails.highestQualification}
                    onChange={(e) => {
                      clearFieldError('highestQualification');
                      setFormData((prev) => ({
                        ...prev,
                        educationDetails: {
                          ...prev.educationDetails,
                          highestQualification: e.target.value,
                        },
                      }));
                    }}
                    className={getFieldClass(
                      'highestQualification',
                      'w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-[#006B3C] focus:outline-none'
                    )}
                  >
                    <option value="">-- Select Qualification --</option>
                    {EDUCATION_QUALIFICATIONS.map((eq) => (
                      <option key={eq} value={eq}>
                        {eq}
                      </option>
                    ))}
                  </select>
                  {fieldErrors['highestQualification'] && (
                    <p className="mt-1 text-xs text-red-600 font-medium">
                      {fieldErrors['highestQualification']}
                    </p>
                  )}
                </div>

                {/* Course Details */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Education Details / Course
                  </label>
                  <input
                    id="educationDetails"
                    name="educationDetails"
                    type="text"
                    placeholder="e.g. Finance / Computer Science"
                    value={formData.educationDetails.educationDetails}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        educationDetails: {
                          ...prev.educationDetails,
                          educationDetails: e.target.value,
                        },
                      }))
                    }
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-[#006B3C] focus:outline-none"
                  />
                </div>

                {/* Institution Name */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Institution Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="institutionName"
                    name="institutionName"
                    type="text"
                    required
                    placeholder="School / College name"
                    value={formData.educationDetails.institutionName}
                    onChange={(e) => {
                      clearFieldError('institutionName');
                      setFormData((prev) => ({
                        ...prev,
                        educationDetails: {
                          ...prev.educationDetails,
                          institutionName: e.target.value,
                        },
                      }));
                    }}
                    className={getFieldClass(
                      'institutionName',
                      'w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-[#006B3C] focus:outline-none'
                    )}
                  />
                  {fieldErrors['institutionName'] && (
                    <p className="mt-1 text-xs text-red-600 font-medium">
                      {fieldErrors['institutionName']}
                    </p>
                  )}
                </div>

                {/* Passing Year */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Year of Passing <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="passingYear"
                    name="passingYear"
                    type="text"
                    required
                    maxLength={4}
                    placeholder="e.g. 2023"
                    value={formData.educationDetails.passingYear}
                    onChange={(e) => {
                      clearFieldError('passingYear');
                      setFormData((prev) => ({
                        ...prev,
                        educationDetails: {
                          ...prev.educationDetails,
                          passingYear: e.target.value.replace(/\D/g, ''),
                        },
                      }));
                    }}
                    className={getFieldClass(
                      'passingYear',
                      'w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-[#006B3C] focus:outline-none'
                    )}
                  />
                  {fieldErrors['passingYear'] && (
                    <p className="mt-1 text-xs text-red-600 font-medium">
                      {fieldErrors['passingYear']}
                    </p>
                  )}
                </div>
              </div>
            </section>

            {/* Experience Details Section */}
            <section className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="bg-emerald-50/70 px-6 py-3.5 border-b border-emerald-100 flex items-center gap-2.5">
                <Briefcase className="w-5 h-5 text-[#006B3C]" />
                <h2 className="text-sm sm:text-base font-bold text-slate-900">EXPERIENCE DETAILS</h2>
              </div>
              <div className="p-6 space-y-6">
                {/* Question 1: Rupeeapex Ex-Employee */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Have you previously worked at Rupeeapex Group of Companies?
                  </span>
                  <div className="flex items-center gap-4 text-sm font-medium shrink-0">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="previouslyWorkedHere"
                        checked={formData.employmentDetails.previouslyWorkedHere === false}
                        onChange={() => {
                          clearFieldError('joinDesignation');
                          clearFieldError('relievingDesignation');
                          clearFieldError('reasonForRelieving');
                          setFormData((prev) => ({
                            ...prev,
                            employmentDetails: {
                              ...prev.employmentDetails,
                              previouslyWorkedHere: false,
                              previousEmployeeId: '',
                              joinDesignation: '',
                              relievingDesignation: '',
                              dateOfRelieving: '',
                              reasonForRelieving: '',
                            },
                          }));
                        }}
                        className="text-[#006B3C] focus:ring-[#006B3C]"
                      />
                      <span>No</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="previouslyWorkedHere"
                        checked={formData.employmentDetails.previouslyWorkedHere === true}
                        onChange={() =>
                          setFormData((prev) => ({
                            ...prev,
                            employmentDetails: {
                              ...prev.employmentDetails,
                              previouslyWorkedHere: true,
                            },
                          }))
                        }
                        className="text-[#006B3C] focus:ring-[#006B3C]"
                      />
                      <span>Yes</span>
                    </label>
                  </div>
                </div>

                {/* Rupeeapex Ex-Employee Details (If Yes) */}
                {formData.employmentDetails.previouslyWorkedHere && (
                  <div className="p-5 bg-emerald-50/60 rounded-2xl border border-emerald-200 space-y-4 animate-fadeIn">
                    <div className="flex items-center gap-2 text-xs font-bold text-emerald-900 uppercase tracking-wider pb-2 border-b border-emerald-100">
                      <Building2 className="w-4 h-4 text-[#006B3C]" />
                      <span>Rupeeapex Previous Employment Details</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {/* Employee ID (Optional) */}
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                          Employee ID{' '}
                          <span className="text-slate-400 font-normal text-[11px]">(Optional)</span>
                        </label>
                        <input
                          id="previousEmployeeId"
                          name="previousEmployeeId"
                          type="text"
                          placeholder="e.g. RAP-1042"
                          value={formData.employmentDetails.previousEmployeeId}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              employmentDetails: {
                                ...prev.employmentDetails,
                                previousEmployeeId: e.target.value,
                              },
                            }))
                          }
                          className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-[#006B3C] focus:outline-none"
                        />
                      </div>

                      {/* Joining Designation (Mandatory) */}
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                          Joining Designation <span className="text-red-500">*</span>
                        </label>
                        <input
                          id="joinDesignation"
                          name="joinDesignation"
                          type="text"
                          required
                          placeholder="e.g. Trainee / Field Executive"
                          value={formData.employmentDetails.joinDesignation}
                          onChange={(e) => {
                            clearFieldError('joinDesignation');
                            setFormData((prev) => ({
                              ...prev,
                              employmentDetails: {
                                ...prev.employmentDetails,
                                joinDesignation: e.target.value,
                              },
                            }));
                          }}
                          className={getFieldClass(
                            'joinDesignation',
                            'w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-[#006B3C] focus:outline-none'
                          )}
                        />
                        {fieldErrors['joinDesignation'] && (
                          <p className="mt-1 text-xs text-red-600 font-medium">
                            {fieldErrors['joinDesignation']}
                          </p>
                        )}
                      </div>

                      {/* Relieving Designation (Mandatory) */}
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                          Relieving Designation <span className="text-red-500">*</span>
                        </label>
                        <input
                          id="relievingDesignation"
                          name="relievingDesignation"
                          type="text"
                          required
                          placeholder="e.g. Senior Branch Executive"
                          value={formData.employmentDetails.relievingDesignation}
                          onChange={(e) => {
                            clearFieldError('relievingDesignation');
                            setFormData((prev) => ({
                              ...prev,
                              employmentDetails: {
                                ...prev.employmentDetails,
                                relievingDesignation: e.target.value,
                              },
                            }));
                          }}
                          className={getFieldClass(
                            'relievingDesignation',
                            'w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-[#006B3C] focus:outline-none'
                          )}
                        />
                        {fieldErrors['relievingDesignation'] && (
                          <p className="mt-1 text-xs text-red-600 font-medium">
                            {fieldErrors['relievingDesignation']}
                          </p>
                        )}
                      </div>

                      {/* Date of Relieving (Optional) */}
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                          Date of Relieving{' '}
                          <span className="text-slate-400 font-normal text-[11px]">(Optional)</span>
                        </label>
                        <input
                          id="dateOfRelieving"
                          name="dateOfRelieving"
                          type="date"
                          value={formData.employmentDetails.dateOfRelieving}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              employmentDetails: {
                                ...prev.employmentDetails,
                                dateOfRelieving: e.target.value,
                              },
                            }))
                          }
                          className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-[#006B3C] focus:outline-none"
                        />
                      </div>

                      {/* Reason for Relieving (Mandatory) */}
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                          Reason for Relieving <span className="text-red-500">*</span>
                        </label>
                        <input
                          id="reasonForRelieving"
                          name="reasonForRelieving"
                          type="text"
                          required
                          placeholder="e.g. Relocated to hometown / Career progression"
                          value={formData.employmentDetails.reasonForRelieving}
                          onChange={(e) => {
                            clearFieldError('reasonForRelieving');
                            setFormData((prev) => ({
                              ...prev,
                              employmentDetails: {
                                ...prev.employmentDetails,
                                reasonForRelieving: e.target.value,
                              },
                            }));
                          }}
                          className={getFieldClass(
                            'reasonForRelieving',
                            'w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-[#006B3C] focus:outline-none'
                          )}
                        />
                        {fieldErrors['reasonForRelieving'] && (
                          <p className="mt-1 text-xs text-red-600 font-medium">
                            {fieldErrors['reasonForRelieving']}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Question 2: General Previous Work Experience */}
                <div className="pt-4 border-t border-slate-200 flex items-center gap-6">
                  <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Do you have previous work experience?
                  </span>
                  <div className="flex items-center gap-4 text-sm font-medium">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="hasExp"
                        checked={formData.employmentDetails.hasPreviousExperience === false}
                        onChange={() => {
                          clearFieldError('previousCompany');
                          clearFieldError('previousDesignation');
                          clearFieldError('yearsOfExperience');
                          setFormData((prev) => ({
                            ...prev,
                            employmentDetails: {
                              ...prev.employmentDetails,
                              hasPreviousExperience: false,
                            },
                          }));
                        }}
                        className="text-[#006B3C] focus:ring-[#006B3C]"
                      />
                      <span>No (Fresher)</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="hasExp"
                        checked={formData.employmentDetails.hasPreviousExperience === true}
                        onChange={() =>
                          setFormData((prev) => ({
                            ...prev,
                            employmentDetails: {
                              ...prev.employmentDetails,
                              hasPreviousExperience: true,
                            },
                          }))
                        }
                        className="text-[#006B3C] focus:ring-[#006B3C]"
                      />
                      <span>Yes (Experienced)</span>
                    </label>
                  </div>
                </div>

                {/* Other Work Experience Fields (If Yes) */}
                {formData.employmentDetails.hasPreviousExperience && (
                  <div className="pt-4 border-t border-slate-100 space-y-4">
                    {/* Experience Row 1 (Mandatory if experienced) */}
                    <div className="p-4 bg-slate-50/70 rounded-xl border border-slate-200">
                      <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block mb-2">
                        Experience 1 (Latest / Most Recent)
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                            Previous Company <span className="text-red-500">*</span>
                          </label>
                          <input
                            id="previousCompany"
                            name="previousCompany"
                            type="text"
                            required
                            placeholder="Company name"
                            value={formData.employmentDetails.previousCompany}
                            onChange={(e) => {
                              clearFieldError('previousCompany');
                              setFormData((prev) => ({
                                ...prev,
                                employmentDetails: {
                                  ...prev.employmentDetails,
                                  previousCompany: e.target.value,
                                },
                              }));
                            }}
                            className={getFieldClass(
                              'previousCompany',
                              'w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-[#006B3C] focus:outline-none'
                            )}
                          />
                          {fieldErrors['previousCompany'] && (
                            <p className="mt-1 text-xs text-red-600 font-medium">
                              {fieldErrors['previousCompany']}
                            </p>
                          )}
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                            Previous Designation <span className="text-red-500">*</span>
                          </label>
                          <input
                            id="previousDesignation"
                            name="previousDesignation"
                            type="text"
                            required
                            placeholder="e.g. Sales Executive / Clerk"
                            value={formData.employmentDetails.previousDesignation}
                            onChange={(e) => {
                              clearFieldError('previousDesignation');
                              setFormData((prev) => ({
                                ...prev,
                                employmentDetails: {
                                  ...prev.employmentDetails,
                                  previousDesignation: e.target.value,
                                },
                              }));
                            }}
                            className={getFieldClass(
                              'previousDesignation',
                              'w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-[#006B3C] focus:outline-none'
                            )}
                          />
                          {fieldErrors['previousDesignation'] && (
                            <p className="mt-1 text-xs text-red-600 font-medium">
                              {fieldErrors['previousDesignation']}
                            </p>
                          )}
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                            Years of Experience <span className="text-red-500">*</span>
                          </label>
                          <input
                            id="yearsOfExperience"
                            name="yearsOfExperience"
                            type="number"
                            required
                            min="0"
                            step="0.5"
                            placeholder="Years (e.g. 2)"
                            value={formData.employmentDetails.yearsOfExperience || ''}
                            onChange={(e) => {
                              clearFieldError('yearsOfExperience');
                              setFormData((prev) => ({
                                ...prev,
                                employmentDetails: {
                                  ...prev.employmentDetails,
                                  yearsOfExperience: Number(e.target.value),
                                },
                              }));
                            }}
                            className={getFieldClass(
                              'yearsOfExperience',
                              'w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-[#006B3C] focus:outline-none'
                            )}
                          />
                          {fieldErrors['yearsOfExperience'] && (
                            <p className="mt-1 text-xs text-red-600 font-medium">
                              {fieldErrors['yearsOfExperience']}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Experience Row 2 (Optional) */}
                    <div className="p-4 bg-slate-50/70 rounded-xl border border-slate-200">
                      <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block mb-2">
                        Experience 2 (Previous - Optional)
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                            Previous Company
                          </label>
                          <input
                            id="previousCompany2"
                            name="previousCompany2"
                            type="text"
                            placeholder="Company name"
                            value={formData.employmentDetails.previousCompany2}
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                employmentDetails: {
                                  ...prev.employmentDetails,
                                  previousCompany2: e.target.value,
                                },
                              }))
                            }
                            className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-[#006B3C] focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                            Previous Designation
                          </label>
                          <input
                            id="previousDesignation2"
                            name="previousDesignation2"
                            type="text"
                            placeholder="e.g. Field Officer"
                            value={formData.employmentDetails.previousDesignation2}
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                employmentDetails: {
                                  ...prev.employmentDetails,
                                  previousDesignation2: e.target.value,
                                },
                              }))
                            }
                            className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-[#006B3C] focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                            Years of Experience
                          </label>
                          <input
                            id="yearsOfExperience2"
                            name="yearsOfExperience2"
                            type="number"
                            min="0"
                            step="0.5"
                            placeholder="Years (e.g. 1.5)"
                            value={formData.employmentDetails.yearsOfExperience2 || ''}
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                employmentDetails: {
                                  ...prev.employmentDetails,
                                  yearsOfExperience2: Number(e.target.value),
                                },
                              }))
                            }
                            className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-[#006B3C] focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Experience Row 3 (Optional) */}
                    <div className="p-4 bg-slate-50/70 rounded-xl border border-slate-200">
                      <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block mb-2">
                        Experience 3 (Previous - Optional)
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                            Previous Company
                          </label>
                          <input
                            id="previousCompany3"
                            name="previousCompany3"
                            type="text"
                            placeholder="Company name"
                            value={formData.employmentDetails.previousCompany3}
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                employmentDetails: {
                                  ...prev.employmentDetails,
                                  previousCompany3: e.target.value,
                                },
                              }))
                            }
                            className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-[#006B3C] focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                            Previous Designation
                          </label>
                          <input
                            id="previousDesignation3"
                            name="previousDesignation3"
                            type="text"
                            placeholder="e.g. Trainee / Assistant"
                            value={formData.employmentDetails.previousDesignation3}
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                employmentDetails: {
                                  ...prev.employmentDetails,
                                  previousDesignation3: e.target.value,
                                },
                              }))
                            }
                            className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-[#006B3C] focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                            Years of Experience
                          </label>
                          <input
                            id="yearsOfExperience3"
                            name="yearsOfExperience3"
                            type="number"
                            min="0"
                            step="0.5"
                            placeholder="Years (e.g. 1)"
                            value={formData.employmentDetails.yearsOfExperience3 || ''}
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                employmentDetails: {
                                  ...prev.employmentDetails,
                                  yearsOfExperience3: Number(e.target.value),
                                },
                              }))
                            }
                            className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-[#006B3C] focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </section>
          </div>

          {/* ==================================================== */}
          {/* STEP 5: PREFERRED JOB ROLE & OTHER DETAILS & RESUME */}
          {/* ==================================================== */}
          <div className={currentStep === 5 ? 'space-y-8 animate-fadeIn' : 'hidden'}>
            {/* Preferred Job Role Section */}
            <section className="bg-white rounded-2xl shadow-sm border-2 border-emerald-600 overflow-hidden">
              <div className="bg-emerald-50 px-6 py-3.5 border-b border-emerald-100 flex items-center gap-2.5">
                <Star className="w-5 h-5 text-[#006B3C]" />
                <h2 className="text-sm sm:text-base font-bold text-slate-900">
                  PREFERRED JOB ROLE <span className="text-red-500">*</span>
                </h2>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    What role do you prefer? <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="preferredJobRole"
                    name="preferredJobRole"
                    required
                    value={formData.preferredJobRole}
                    onChange={(e) => {
                      clearFieldError('preferredJobRole');
                      setFormData((prev) => ({
                        ...prev,
                        preferredJobRole: e.target.value as any,
                        preferredJobRoleOther:
                          e.target.value === 'OTHER' ? prev.preferredJobRoleOther : '',
                      }));
                    }}
                    className={getFieldClass(
                      'preferredJobRole',
                      'w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-[#006B3C] focus:outline-none'
                    )}
                  >
                    <option value="">-- Select Preferred Job Role --</option>
                    {PREFERRED_JOB_ROLES.map((role) => (
                      <option key={role} value={role}>
                        {role}
                      </option>
                    ))}
                  </select>
                  {fieldErrors['preferredJobRole'] && (
                    <p className="mt-1 text-xs text-red-600 font-medium">
                      {fieldErrors['preferredJobRole']}
                    </p>
                  )}
                </div>

                {/* Conditional input when "OTHER" is selected */}
                {formData.preferredJobRole === 'OTHER' && (
                  <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 animate-fadeIn">
                    <label className="block text-xs font-bold text-amber-950 uppercase tracking-wider mb-1.5">
                      Please specify your preferred job role <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="preferredJobRoleOther"
                      name="preferredJobRoleOther"
                      type="text"
                      required
                      placeholder="e.g. Customer Relationship Executive / Branch Manager"
                      value={formData.preferredJobRoleOther}
                      onChange={(e) => {
                        clearFieldError('preferredJobRoleOther');
                        setFormData((prev) => ({
                          ...prev,
                          preferredJobRoleOther: e.target.value,
                        }));
                      }}
                      className={getFieldClass(
                        'preferredJobRoleOther',
                        'w-full px-3.5 py-2.5 bg-white border border-amber-300 rounded-xl text-sm text-slate-900 focus:ring-2 focus:ring-[#006B3C] focus:outline-none'
                      )}
                    />
                    {fieldErrors['preferredJobRoleOther'] && (
                      <p className="mt-1 text-xs text-red-600 font-medium">
                        {fieldErrors['preferredJobRoleOther']}
                      </p>
                    )}
                    <p className="text-[11px] text-amber-800 mt-1.5">
                      Manually enter the exact title or department you are applying for.
                    </p>
                  </div>
                )}
              </div>
            </section>

            {/* Other Details Section */}
            <section className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="bg-emerald-50/70 px-6 py-3.5 border-b border-emerald-100 flex items-center gap-2.5">
                <FileCheck className="w-5 h-5 text-[#006B3C]" />
                <h2 className="text-sm sm:text-base font-bold text-slate-900">OTHER DETAILS</h2>
              </div>
              <div className="p-6 grid grid-cols-1 sm:grid-cols-3 gap-5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    How did you come to know about this job? <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="referralSource"
                    name="referralSource"
                    value={formData.referenceDetails.referralSource}
                    onChange={(e) => {
                      clearFieldError('referralSource');
                      setFormData((prev) => ({
                        ...prev,
                        referenceDetails: {
                          ...prev.referenceDetails,
                          referralSource: e.target.value as any,
                        },
                      }));
                    }}
                    className={getFieldClass(
                      'referralSource',
                      'w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-[#006B3C] focus:outline-none'
                    )}
                  >
                    {REFERRAL_SOURCES.map((source) => (
                      <option key={source} value={source}>
                        {source}
                      </option>
                    ))}
                  </select>
                  {fieldErrors['referralSource'] && (
                    <p className="mt-1 text-xs text-red-600 font-medium">
                      {fieldErrors['referralSource']}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Reference Name{' '}
                    <span className="text-slate-400 font-normal text-[11px]">(Optional)</span>
                  </label>
                  <input
                    id="referrerName"
                    name="referrerName"
                    type="text"
                    placeholder="Optional reference contact name"
                    value={formData.referenceDetails.referrerName}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        referenceDetails: {
                          ...prev.referenceDetails,
                          referrerName: e.target.value,
                        },
                      }))
                    }
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-[#006B3C] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Additional Relevant Details{' '}
                    <span className="text-slate-400 font-normal text-[11px]">(Optional)</span>
                  </label>
                  <input
                    id="additionalRemarks"
                    name="additionalRemarks"
                    type="text"
                    placeholder="Any certifications, languages, remarks"
                    value={formData.referenceDetails.additionalRemarks}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        referenceDetails: {
                          ...prev.referenceDetails,
                          additionalRemarks: e.target.value,
                        },
                      }))
                    }
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-[#006B3C] focus:outline-none"
                  />
                </div>
              </div>
            </section>

            {/* Candidate Resume Upload Section */}
            <section
              data-field="resume"
              className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden"
            >
              <div className="bg-emerald-50/70 px-6 py-3 border-b border-emerald-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[#006B3C]" />
                  <h2 className="text-sm font-bold text-slate-900 uppercase tracking-tight">
                    Upload Resume / CV <span className="text-red-500">*</span>
                  </h2>
                </div>
                <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-100/70 px-2 py-0.5 rounded-md border border-emerald-200">
                  PDF, DOC, DOCX • Max 5 MB
                </span>
              </div>

              <div className="p-4 sm:p-5">
                <input
                  id="candidate-resume-input"
                  name="resume"
                  type="file"
                  ref={resumeInputRef}
                  accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  onChange={handleResumeSelect}
                  className="sr-only"
                />

                <div
                  className={`rounded-xl border transition-all ${
                    fieldErrors['resume']
                      ? 'border-red-500 ring-4 ring-red-100 bg-red-50/40'
                      : resumeFile
                      ? 'border-emerald-300 bg-emerald-50/20'
                      : 'border-slate-200 hover:border-[#006B3C]/50 bg-slate-50/50 hover:bg-slate-50'
                  } p-3 sm:p-4`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 min-w-0 flex-1">
                      <label
                        htmlFor="candidate-resume-input"
                        className="inline-flex items-center justify-center gap-2 px-3.5 py-2 bg-[#006B3C] hover:bg-[#005530] text-white text-xs font-semibold rounded-lg transition-all shadow-sm cursor-pointer select-none shrink-0 active:scale-95"
                      >
                        <Upload className="w-3.5 h-3.5 text-[#F5C400]" />
                        <span>Upload Resume (Max 5 MB)</span>
                      </label>

                      <div className="min-w-0 flex-1">
                        {resumeFile ? (
                          <div className="flex items-center gap-2 min-w-0">
                            <FileCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                            <span
                              className="text-xs font-bold text-slate-800 truncate"
                              title={resumeFile.name}
                            >
                              {resumeFile.name}
                            </span>
                            <span className="text-[10px] text-slate-500 font-mono shrink-0">
                              ({(resumeFile.size / (1024 * 1024)).toFixed(2)} MB)
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-500 block truncate">
                            No file chosen. Supported:{' '}
                            <strong className="text-slate-700">PDF, DOC, DOCX</strong> (Max 5 MB)
                          </span>
                        )}
                      </div>
                    </div>

                    {resumeFile && (
                      <div className="flex items-center gap-2 self-end sm:self-auto shrink-0 pt-1 sm:pt-0">
                        <label
                          htmlFor="candidate-resume-input"
                          className="text-xs text-[#006B3C] hover:text-[#005530] hover:underline font-semibold cursor-pointer px-2 py-1"
                          title="Choose a different resume file"
                        >
                          Replace
                        </label>
                        <span className="text-slate-300">|</span>
                        <button
                          type="button"
                          onClick={handleRemoveResume}
                          className="text-xs text-red-600 hover:text-red-800 font-semibold px-2 py-1 flex items-center gap-1"
                          title="Remove selected resume"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>Remove</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {fieldErrors['resume'] && (
                    <div className="mt-2.5 p-2.5 rounded-lg bg-red-50 border border-red-200 text-xs font-semibold text-red-700 flex items-start gap-2 animate-fadeIn">
                      <AlertCircle className="w-3.5 h-3.5 text-red-600 shrink-0 mt-0.5" />
                      <span className="leading-relaxed">{fieldErrors['resume']}</span>
                    </div>
                  )}
                </div>
              </div>
            </section>

            {/* Candidate Declaration Section */}
            <section className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="bg-emerald-50/70 px-6 py-3.5 border-b border-emerald-100 flex items-center gap-2.5">
                <CheckSquare className="w-5 h-5 text-[#006B3C]" />
                <h2 className="text-sm sm:text-base font-bold text-slate-900">DECLARATION</h2>
              </div>
              <div className="p-6 space-y-4">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700 leading-relaxed">
                  I hereby declare that all the information furnished above is true, complete and
                  correct to the best of my knowledge and belief. I understand that any false or
                  misleading statements may lead to disqualification.
                </div>

                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="declarationAccepted"
                    name="declarationAccepted"
                    required
                    checked={formData.declarationAccepted}
                    onChange={(e) => {
                      clearFieldError('declarationAccepted');
                      setFormData((prev) => ({
                        ...prev,
                        declarationAccepted: e.target.checked,
                      }));
                    }}
                    className="w-5 h-5 mt-0.5 text-[#006B3C] rounded border-slate-300 focus:ring-[#006B3C]"
                  />
                  <label
                    htmlFor="declarationAccepted"
                    className="text-xs font-semibold text-slate-800 leading-relaxed select-none cursor-pointer"
                  >
                    I have read and confirm that all details entered by me are true and accurate.{' '}
                    <span className="text-red-500">*</span>
                  </label>
                </div>
                {fieldErrors['declarationAccepted'] && (
                  <p className="mt-1 text-xs text-red-600 font-medium">
                    {fieldErrors['declarationAccepted']}
                  </p>
                )}
              </div>
            </section>
          </div>

          {/* ==================================================== */}
          {/* 4. NAVIGATION BUTTONS (BACK / NEXT SECTION / SUBMIT) */}
          {/* ==================================================== */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 sm:p-6 flex flex-col-reverse sm:flex-row items-center justify-between gap-4">
            {/* Back Button (Displayed from Step 2 onwards) */}
            {currentStep > 1 ? (
              <button
                type="button"
                onClick={handlePrevStep}
                className="w-full sm:w-auto px-6 py-3 bg-white hover:bg-slate-50 text-slate-700 font-bold rounded-xl text-sm border border-slate-300 transition-all shadow-sm flex items-center justify-center gap-2 hover:border-slate-400 active:scale-[0.98]"
              >
                <ArrowLeft className="w-4 h-4 text-slate-500" />
                <span>Back</span>
              </button>
            ) : (
              <div className="hidden sm:block" />
            )}

            {/* Next Section (Steps 1, 2, 3, 4) or Submit Button (Step 5 Only) */}
            {currentStep < 5 ? (
              <button
                type="button"
                onClick={handleNextStep}
                className="w-full sm:w-auto px-8 py-3 bg-[#006B3C] hover:bg-[#005530] text-white font-extrabold rounded-xl text-sm transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 active:scale-[0.98] tracking-wide"
              >
                <span>Next Section</span>
                <ArrowRight className="w-4 h-4 text-[#F5C400]" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={submitting}
                className="w-full sm:w-auto px-10 py-3.5 bg-[#006B3C] hover:bg-[#005530] text-white font-extrabold rounded-xl text-sm transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2.5 disabled:opacity-70 disabled:cursor-not-allowed uppercase tracking-wider active:scale-[0.98]"
              >
                {submitting ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8v8H4z"
                      ></path>
                    </svg>
                    <span>Submitting Application...</span>
                  </>
                ) : (
                  <>
                    <span>SUBMIT APPLICATION</span>
                    <CheckCircle2 className="w-5 h-5 text-[#F5C400]" />
                  </>
                )}
              </button>
            )}
          </div>
        </form>
      </main>

      <footer className="w-full bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-500">
        <div className="max-w-4xl mx-auto px-4">
          © {new Date().getFullYear()} Rupeeapex Group of Companies. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
