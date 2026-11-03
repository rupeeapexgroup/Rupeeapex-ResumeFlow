'use client';

import React, { useState, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  PREFERRED_JOB_ROLES,
  EDUCATION_QUALIFICATIONS,
  MARITAL_STATUSES,
  REFERRAL_SOURCES,
} from '@/lib/constants';
import {
  User,
  Users,
  Home,
  GraduationCap,
  Briefcase,
  Star,
  Camera,
  CheckSquare,
  AlertCircle,
  CheckCircle2,
  Printer,
  UploadCloud,
  FileCheck,
} from 'lucide-react';

export default function CandidateApplyPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form states
  const [formData, setFormData] = useState({
    personalDetails: {
      fullName: '',
      dateOfBirth: '',
      age: 21,
      gender: 'Male' as 'Male' | 'Female' | 'Other',
      maritalStatus: 'Single' as 'Single' | 'Married' | 'Divorced' | 'Widowed',
      fathersName: '',
      mothersName: '',
      spouseName: '',
      mobileNumber: '',
      alternativeMobileNumber: '',
      email: '',
      aadhaarNumber: '',
      panNumber: '',
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

  // Submission & UI states
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [submittedAppId, setSubmittedAppId] = useState<string | null>(null);

  // Auto-calculate age when DOB changes
  const handleDobChange = (dobStr: string) => {
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

  // Handle Photo selection
  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/jpg', 'image/png'].includes(file.type)) {
      setErrorMessage('Please select a valid image file (JPEG or PNG format only).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage('Photograph size must be less than 5 MB.');
      return;
    }

    setErrorMessage('');
    setPhotoFile(file);
    const reader = new FileReader();
    reader.onload = () => {
      setPhotoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
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

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    // Pre-flight checks
    if (!photoFile) {
      setErrorMessage('Candidate photograph is required. Please upload or take your photo.');
      window.scrollTo({ top: 300, behavior: 'smooth' });
      return;
    }

    if (!formData.preferredJobRole) {
      setErrorMessage('Please select your PREFERRED JOB ROLE.');
      return;
    }

    if (formData.preferredJobRole === 'OTHER' && !formData.preferredJobRoleOther.trim()) {
      setErrorMessage('Please specify your preferred job role.');
      return;
    }

    if (!formData.personalDetails.aadhaarNumber || !/^\d{12}$/.test(formData.personalDetails.aadhaarNumber)) {
      setErrorMessage('Please enter a valid 12-digit Aadhaar Number.');
      return;
    }

    if (!formData.personalDetails.panNumber || !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/i.test(formData.personalDetails.panNumber)) {
      setErrorMessage('Please enter a valid 10-character PAN Number (e.g. ABCDE1234F).');
      return;
    }

    if (!formData.declarationAccepted) {
      setErrorMessage('You must review and agree to the candidate declaration before submitting.');
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        ...formData,
        personalDetails: {
          ...formData.personalDetails,
          panNumber: formData.personalDetails.panNumber.toUpperCase(),
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
      sendFormData.append('photograph', photoFile);

      const res = await fetch('/api/applications', {
        method: 'POST',
        body: sendFormData,
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error || 'Failed to submit application. Please check all fields.');
        setSubmitting(false);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }

      setSubmittedAppId(data.applicationId);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch {
      setErrorMessage('Network connection error while submitting. Please try again.');
      setSubmitting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // ==========================================
  // SUCCESS SCREEN
  // ==========================================
  if (submittedAppId) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center px-4 py-12">
        <div className="bg-white rounded-3xl shadow-xl border border-slate-200 p-8 sm:p-10 text-center max-w-xl w-full relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-3 bg-[#006B3C]"></div>

          <div className="w-16 h-16 bg-emerald-100 text-[#006B3C] rounded-full mx-auto flex items-center justify-center mb-5">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mb-3">
            Your job application has been submitted successfully. Thank you for applying to Rupeeapex Groups of Companies.
          </h1>

          {/* Application ID Card */}
          <div className="bg-emerald-50/80 border-2 border-dashed border-[#006B3C] rounded-2xl p-5 my-6">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">
              Candidate Application ID
            </span>
            <div className="text-2xl sm:text-3xl font-mono font-extrabold text-[#006B3C] tracking-wider my-1.5">
              {submittedAppId}
            </div>
            <p className="text-xs text-slate-600">
              Candidate: <span className="font-semibold text-slate-900">{formData.personalDetails.fullName}</span> | Preferred Role: <span className="font-bold text-slate-900">{formData.preferredJobRole === 'OTHER' ? formData.preferredJobRoleOther : formData.preferredJobRole}</span>
            </p>
          </div>

          <div className="bg-slate-50 rounded-xl p-4 text-xs text-slate-600 text-left space-y-1.5 mb-6 border border-slate-200">
            <p>• Please note down or take a screenshot of your <strong>Application ID</strong> for reference.</p>
            <p>• Our HR department will review your application and contact you directly on <strong>{formData.personalDetails.mobileNumber}</strong>.</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={handlePrint}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold rounded-xl text-xs transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span>Print Confirmation</span>
            </button>
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-[#006B3C] hover:bg-[#005530] text-white font-semibold rounded-xl text-xs transition-colors shadow-sm"
            >
              <span>Submit Another Application</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // CANDIDATE APPLICATION FORM SCREEN
  // ==========================================
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center">
      <main className="max-w-4xl w-full px-4 py-8 sm:py-10">
        {/* Exact Rupeeapex Company Logo Prominently Displayed */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8 mb-8 text-center flex flex-col items-center">
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

        {/* Global Error Banner */}
        {errorMessage && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 flex items-start gap-3 text-sm text-red-700 animate-fadeIn">
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <div className="leading-relaxed font-medium">{errorMessage}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* ==================================================== */}
          {/* SECTION: PREFERRED JOB ROLE (DROPDOWN + CONDITIONAL "OTHER") */}
          {/* ==================================================== */}
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
                  required
                  value={formData.preferredJobRole}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      preferredJobRole: e.target.value as any,
                      preferredJobRoleOther: e.target.value === 'OTHER' ? prev.preferredJobRoleOther : '',
                    }))
                  }
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-[#006B3C] focus:outline-none"
                >
                  <option value="">-- Select Preferred Job Role --</option>
                  {PREFERRED_JOB_ROLES.map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
              </div>

              {/* Conditional manual role input when "OTHER" is selected */}
              {formData.preferredJobRole === 'OTHER' && (
                <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 animate-fadeIn">
                  <label className="block text-xs font-bold text-amber-950 uppercase tracking-wider mb-1.5">
                    Please specify your preferred job role <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Customer Relationship Executive / Branch Manager"
                    value={formData.preferredJobRoleOther}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        preferredJobRoleOther: e.target.value,
                      }))
                    }
                    className="w-full px-3.5 py-2.5 bg-white border border-amber-300 rounded-xl text-sm text-slate-900 focus:ring-2 focus:ring-[#006B3C] focus:outline-none"
                  />
                  <p className="text-[11px] text-amber-800 mt-1.5">
                    Manually enter the exact title or department you are applying for.
                  </p>
                </div>
              )}
            </div>
          </section>

          {/* ==================================================== */}
          {/* SECTION: CANDIDATE PHOTO UPLOAD */}
          {/* ==================================================== */}
          <section className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="bg-emerald-50/70 px-6 py-3.5 border-b border-emerald-100 flex items-center gap-2.5">
              <Camera className="w-5 h-5 text-[#006B3C]" />
              <h2 className="text-sm sm:text-base font-bold text-slate-900">
                CANDIDATE PHOTOGRAPH <span className="text-red-500">*</span>
              </h2>
            </div>
            <div className="p-6 flex flex-col sm:flex-row items-center gap-6">
              {/* Photo Preview */}
              <div className="w-32 h-40 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 flex items-center justify-center overflow-hidden shrink-0 relative">
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
                  type="file"
                  ref={fileInputRef}
                  accept="image/jpeg,image/png,image/jpg"
                  capture="user"
                  onChange={handlePhotoSelect}
                  className="hidden"
                />

                <div className="flex flex-wrap gap-2.5 justify-center sm:justify-start">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#006B3C] hover:bg-[#005530] text-white text-xs font-semibold rounded-xl transition-colors shadow-sm"
                  >
                    <UploadCloud className="w-4 h-4" />
                    <span>{photoFile ? 'Replace Photograph' : 'Upload or Take Photo'}</span>
                  </button>
                  {photoFile && (
                    <button
                      type="button"
                      onClick={() => {
                        setPhotoFile(null);
                        setPhotoPreview(null);
                      }}
                      className="px-3 py-2 text-xs text-red-600 hover:bg-red-50 rounded-xl font-medium"
                    >
                      Remove
                    </button>
                  )}
                </div>

                <div className="text-xs text-slate-500 leading-relaxed">
                  <p>• Accepted formats: <strong>JPG, JPEG, PNG</strong> (Max file size: 5 MB).</p>
                  <p>• You may capture directly from your mobile camera or pick from gallery.</p>
                </div>
              </div>
            </div>
          </section>

          {/* ==================================================== */}
          {/* SECTION: PERSONAL DETAILS */}
          {/* ==================================================== */}
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
                  type="text"
                  required
                  placeholder="Full name as per Aadhaar"
                  value={formData.personalDetails.fullName}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      personalDetails: { ...prev.personalDetails, fullName: e.target.value },
                    }))
                  }
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-[#006B3C] focus:outline-none"
                />
              </div>

              {/* Date of Birth */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Date of Birth <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={formData.personalDetails.dateOfBirth}
                  onChange={(e) => handleDobChange(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-[#006B3C] focus:outline-none"
                />
              </div>

              {/* Age */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Age <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="18"
                  max="70"
                  required
                  value={formData.personalDetails.age}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      personalDetails: { ...prev.personalDetails, age: Number(e.target.value) },
                    }))
                  }
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-[#006B3C] focus:outline-none"
                />
              </div>

              {/* Gender */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Gender <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.personalDetails.gender}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      personalDetails: {
                        ...prev.personalDetails,
                        gender: e.target.value as any,
                      },
                    }))
                  }
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-[#006B3C] focus:outline-none"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* Marital Status */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Marital Status <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.personalDetails.maritalStatus}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      personalDetails: {
                        ...prev.personalDetails,
                        maritalStatus: e.target.value as any,
                      },
                    }))
                  }
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-[#006B3C] focus:outline-none"
                >
                  {MARITAL_STATUSES.map((ms) => (
                    <option key={ms} value={ms}>
                      {ms}
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
                  type="text"
                  required
                  placeholder="Father's full name"
                  value={formData.personalDetails.fathersName}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      personalDetails: { ...prev.personalDetails, fathersName: e.target.value },
                    }))
                  }
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-[#006B3C] focus:outline-none"
                />
              </div>

              {/* Mother's Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Mother&apos;s Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Mother's full name"
                  value={formData.personalDetails.mothersName}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      personalDetails: { ...prev.personalDetails, mothersName: e.target.value },
                    }))
                  }
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-[#006B3C] focus:outline-none"
                />
              </div>

              {/* Spouse Name (if applicable) */}
              {formData.personalDetails.maritalStatus === 'Married' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Spouse Name
                  </label>
                  <input
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
                    type="tel"
                    required
                    maxLength={10}
                    placeholder="10-digit mobile"
                    value={formData.personalDetails.mobileNumber}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        personalDetails: { ...prev.personalDetails, mobileNumber: e.target.value },
                      }))
                    }
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-r-xl text-sm focus:bg-white focus:ring-2 focus:ring-[#006B3C] focus:outline-none"
                  />
                </div>
              </div>

              {/* Alternative Mobile Number */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Alternative Mobile Number
                </label>
                <div className="flex">
                  <span className="inline-flex items-center px-3 rounded-l-xl border border-r-0 border-slate-300 bg-slate-100 text-slate-600 text-xs font-semibold">
                    +91
                  </span>
                  <input
                    type="tel"
                    maxLength={10}
                    placeholder="Optional backup mobile"
                    value={formData.personalDetails.alternativeMobileNumber}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        personalDetails: {
                          ...prev.personalDetails,
                          alternativeMobileNumber: e.target.value,
                        },
                      }))
                    }
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-r-xl text-sm focus:bg-white focus:ring-2 focus:ring-[#006B3C] focus:outline-none"
                  />
                </div>
              </div>

              {/* Email Address */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="candidate@example.com"
                  value={formData.personalDetails.email}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      personalDetails: { ...prev.personalDetails, email: e.target.value },
                    }))
                  }
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-[#006B3C] focus:outline-none"
                />
              </div>

              {/* Aadhaar Number */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Aadhaar Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  maxLength={12}
                  placeholder="12-digit Aadhaar number"
                  value={formData.personalDetails.aadhaarNumber}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      personalDetails: {
                        ...prev.personalDetails,
                        aadhaarNumber: e.target.value.replace(/\D/g, ''),
                      },
                    }))
                  }
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-mono focus:bg-white focus:ring-2 focus:ring-[#006B3C] focus:outline-none"
                />
              </div>

              {/* PAN Number */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  PAN Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  maxLength={10}
                  placeholder="e.g. ABCDE1234F"
                  value={formData.personalDetails.panNumber}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      personalDetails: {
                        ...prev.personalDetails,
                        panNumber: e.target.value.toUpperCase(),
                      },
                    }))
                  }
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-mono uppercase focus:bg-white focus:ring-2 focus:ring-[#006B3C] focus:outline-none"
                />
              </div>
            </div>
          </section>

          {/* ==================================================== */}
          {/* SECTION: FAMILY DETAILS */}
          {/* ==================================================== */}
          <section className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="bg-emerald-50/70 px-6 py-3.5 border-b border-emerald-100 flex items-center gap-2.5">
              <Users className="w-5 h-5 text-[#006B3C]" />
              <h2 className="text-sm sm:text-base font-bold text-slate-900">FAMILY DETAILS</h2>
            </div>
            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Father&apos;s Occupation
                </label>
                <input
                  type="text"
                  placeholder="e.g. Farmer / Business / Service"
                  value={formData.familyDetails.fathersOccupation}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      familyDetails: { ...prev.familyDetails, fathersOccupation: e.target.value },
                    }))
                  }
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-[#006B3C] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Father&apos;s Mobile Number
                </label>
                <input
                  type="tel"
                  maxLength={10}
                  placeholder="10-digit mobile"
                  value={formData.familyDetails.fathersMobile}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      familyDetails: { ...prev.familyDetails, fathersMobile: e.target.value },
                    }))
                  }
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-[#006B3C] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Mother&apos;s Occupation
                </label>
                <input
                  type="text"
                  placeholder="e.g. Homemaker / Teacher"
                  value={formData.familyDetails.mothersOccupation}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      familyDetails: { ...prev.familyDetails, mothersOccupation: e.target.value },
                    }))
                  }
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-[#006B3C] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Mother&apos;s Mobile Number
                </label>
                <input
                  type="tel"
                  maxLength={10}
                  placeholder="10-digit mobile"
                  value={formData.familyDetails.mothersMobile}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      familyDetails: { ...prev.familyDetails, mothersMobile: e.target.value },
                    }))
                  }
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-[#006B3C] focus:outline-none"
                />
              </div>

              {formData.personalDetails.maritalStatus === 'Married' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Spouse Occupation
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Private employee / Business"
                    value={formData.familyDetails.spouseOccupation}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        familyDetails: { ...prev.familyDetails, spouseOccupation: e.target.value },
                      }))
                    }
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-[#006B3C] focus:outline-none"
                  />
                </div>
              )}
            </div>
          </section>

          {/* ==================================================== */}
          {/* SECTION: ADDRESS DETAILS */}
          {/* ==================================================== */}
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
                      type="text"
                      required
                      placeholder="e.g. 12/4B, Main Road"
                      value={formData.addressDetails.permanentAddress.doorNoStreet}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          addressDetails: {
                            ...prev.addressDetails,
                            permanentAddress: {
                              ...prev.addressDetails.permanentAddress,
                              doorNoStreet: e.target.value,
                            },
                          },
                        }))
                      }
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-[#006B3C] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Village / Area <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Village / Town / Area"
                      value={formData.addressDetails.permanentAddress.villageOrArea}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          addressDetails: {
                            ...prev.addressDetails,
                            permanentAddress: {
                              ...prev.addressDetails.permanentAddress,
                              villageOrArea: e.target.value,
                            },
                          },
                        }))
                      }
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-[#006B3C] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Taluk <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Taluk"
                      value={formData.addressDetails.permanentAddress.taluk}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          addressDetails: {
                            ...prev.addressDetails,
                            permanentAddress: {
                              ...prev.addressDetails.permanentAddress,
                              taluk: e.target.value,
                            },
                          },
                        }))
                      }
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-[#006B3C] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      District <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="District"
                      value={formData.addressDetails.permanentAddress.district}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          addressDetails: {
                            ...prev.addressDetails,
                            permanentAddress: {
                              ...prev.addressDetails.permanentAddress,
                              district: e.target.value,
                            },
                          },
                        }))
                      }
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-[#006B3C] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      State <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="State"
                      value={formData.addressDetails.permanentAddress.state}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          addressDetails: {
                            ...prev.addressDetails,
                            permanentAddress: {
                              ...prev.addressDetails.permanentAddress,
                              state: e.target.value,
                            },
                          },
                        }))
                      }
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-[#006B3C] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      PIN Code <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={6}
                      placeholder="6-digit PIN"
                      value={formData.addressDetails.permanentAddress.pincode}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          addressDetails: {
                            ...prev.addressDetails,
                            permanentAddress: {
                              ...prev.addressDetails.permanentAddress,
                              pincode: e.target.value.replace(/\D/g, ''),
                            },
                          },
                        }))
                      }
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-[#006B3C] focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Checkbox: Same as Permanent */}
              <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
                <input
                  type="checkbox"
                  id="sameAsPermanent"
                  checked={formData.addressDetails.sameAsPermanent}
                  onChange={(e) => handleSameAddressToggle(e.target.checked)}
                  className="w-4 h-4 text-[#006B3C] rounded border-slate-300 focus:ring-[#006B3C]"
                />
                <label htmlFor="sameAsPermanent" className="text-xs font-semibold text-slate-700 select-none cursor-pointer">
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
                        type="text"
                        required
                        placeholder="e.g. 5A, North Street"
                        value={formData.addressDetails.temporaryAddress.doorNoStreet}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            addressDetails: {
                              ...prev.addressDetails,
                              temporaryAddress: {
                                ...prev.addressDetails.temporaryAddress,
                                doorNoStreet: e.target.value,
                              },
                            },
                          }))
                        }
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-[#006B3C] focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Village / Area <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Village / Town / Area"
                        value={formData.addressDetails.temporaryAddress.villageOrArea}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            addressDetails: {
                              ...prev.addressDetails,
                              temporaryAddress: {
                                ...prev.addressDetails.temporaryAddress,
                                villageOrArea: e.target.value,
                              },
                            },
                          }))
                        }
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-[#006B3C] focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Taluk <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Taluk"
                        value={formData.addressDetails.temporaryAddress.taluk}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            addressDetails: {
                              ...prev.addressDetails,
                              temporaryAddress: {
                                ...prev.addressDetails.temporaryAddress,
                                taluk: e.target.value,
                              },
                            },
                          }))
                        }
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-[#006B3C] focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        District <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="District"
                        value={formData.addressDetails.temporaryAddress.district}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            addressDetails: {
                              ...prev.addressDetails,
                              temporaryAddress: {
                                ...prev.addressDetails.temporaryAddress,
                                district: e.target.value,
                              },
                            },
                          }))
                        }
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-[#006B3C] focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        State <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="State"
                        value={formData.addressDetails.temporaryAddress.state}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            addressDetails: {
                              ...prev.addressDetails,
                              temporaryAddress: {
                                ...prev.addressDetails.temporaryAddress,
                                state: e.target.value,
                              },
                            },
                          }))
                        }
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-[#006B3C] focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        PIN Code <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        maxLength={6}
                        placeholder="6-digit PIN"
                        value={formData.addressDetails.temporaryAddress.pincode}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            addressDetails: {
                              ...prev.addressDetails,
                              temporaryAddress: {
                                ...prev.addressDetails.temporaryAddress,
                                pincode: e.target.value.replace(/\D/g, ''),
                              },
                            },
                          }))
                        }
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-[#006B3C] focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* ==================================================== */}
          {/* SECTION: EDUCATION DETAILS */}
          {/* ==================================================== */}
          <section className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="bg-emerald-50/70 px-6 py-3.5 border-b border-emerald-100 flex items-center gap-2.5">
              <GraduationCap className="w-5 h-5 text-[#006B3C]" />
              <h2 className="text-sm sm:text-base font-bold text-slate-900">EDUCATION DETAILS</h2>
            </div>
            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Highest Qualification <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={formData.educationDetails.highestQualification}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      educationDetails: {
                        ...prev.educationDetails,
                        highestQualification: e.target.value,
                      },
                    }))
                  }
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-[#006B3C] focus:outline-none"
                >
                  <option value="">-- Select Qualification --</option>
                  {EDUCATION_QUALIFICATIONS.map((eq) => (
                    <option key={eq} value={eq}>
                      {eq}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Education Details / Course
                </label>
                <input
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

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Institution Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="School / College name"
                  value={formData.educationDetails.institutionName}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      educationDetails: { ...prev.educationDetails, institutionName: e.target.value },
                    }))
                  }
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-[#006B3C] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Year of Passing <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  maxLength={4}
                  placeholder="e.g. 2023"
                  value={formData.educationDetails.passingYear}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      educationDetails: {
                        ...prev.educationDetails,
                        passingYear: e.target.value.replace(/\D/g, ''),
                      },
                    }))
                  }
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-[#006B3C] focus:outline-none"
                />
              </div>
            </div>
          </section>

          {/* ==================================================== */}
          {/* SECTION: EXPERIENCE DETAILS */}
          {/* ==================================================== */}
          <section className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="bg-emerald-50/70 px-6 py-3.5 border-b border-emerald-100 flex items-center gap-2.5">
              <Briefcase className="w-5 h-5 text-[#006B3C]" />
              <h2 className="text-sm sm:text-base font-bold text-slate-900">EXPERIENCE DETAILS</h2>
            </div>
            <div className="p-6 space-y-5">
              <div className="flex items-center gap-6">
                <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Do you have previous work experience?
                </span>
                <div className="flex items-center gap-4 text-sm font-medium">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="hasExp"
                      checked={formData.employmentDetails.hasPreviousExperience === false}
                      onChange={() =>
                        setFormData((prev) => ({
                          ...prev,
                          employmentDetails: {
                            ...prev.employmentDetails,
                            hasPreviousExperience: false,
                          },
                        }))
                      }
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

              {formData.employmentDetails.hasPreviousExperience && (
                <div className="pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                      Previous Company
                    </label>
                    <input
                      type="text"
                      placeholder="Company name"
                      value={formData.employmentDetails.previousCompany}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          employmentDetails: {
                            ...prev.employmentDetails,
                            previousCompany: e.target.value,
                            previousCompanyName: e.target.value,
                          },
                        }))
                      }
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-[#006B3C] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                      Previous Designation
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Sales Executive / Clerk"
                      value={formData.employmentDetails.previousDesignation}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          employmentDetails: {
                            ...prev.employmentDetails,
                            previousDesignation: e.target.value,
                            previousOccupation: e.target.value,
                          },
                        }))
                      }
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-[#006B3C] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                      Years of Experience
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.5"
                      placeholder="Years (e.g. 2)"
                      value={formData.employmentDetails.yearsOfExperience}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          employmentDetails: {
                            ...prev.employmentDetails,
                            yearsOfExperience: Number(e.target.value),
                            experienceDurationYears: Math.floor(Number(e.target.value)),
                          },
                        }))
                      }
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-[#006B3C] focus:outline-none"
                    />
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* ==================================================== */}
          {/* SECTION: OTHER DETAILS */}
          {/* ==================================================== */}
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
                  value={formData.referenceDetails.referralSource}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      referenceDetails: {
                        ...prev.referenceDetails,
                        referralSource: e.target.value as any,
                      },
                    }))
                  }
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-[#006B3C] focus:outline-none"
                >
                  <option value="Reference">Reference</option>
                  <option value="Friend">Friend</option>
                  <option value="Advertisement">Advertisement</option>
                  <option value="Walk-in Direct">Walk-in Direct</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Reference Name
                </label>
                <input
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
                  Additional Relevant Details
                </label>
                <input
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

          {/* ==================================================== */}
          {/* SECTION: CANDIDATE DECLARATION & SUBMISSION */}
          {/* ==================================================== */}
          <section className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="bg-emerald-50/70 px-6 py-3.5 border-b border-emerald-100 flex items-center gap-2.5">
              <CheckSquare className="w-5 h-5 text-[#006B3C]" />
              <h2 className="text-sm sm:text-base font-bold text-slate-900">DECLARATION</h2>
            </div>
            <div className="p-6 space-y-5">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700 leading-relaxed">
                I hereby declare that all the information furnished above is true, complete and correct to the best of my knowledge and belief. I understand that any false or misleading statements may lead to disqualification or dismissal.
              </div>

              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="declarationAccepted"
                  required
                  checked={formData.declarationAccepted}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, declarationAccepted: e.target.checked }))
                  }
                  className="w-5 h-5 mt-0.5 text-[#006B3C] rounded border-slate-300 focus:ring-[#006B3C]"
                />
                <label
                  htmlFor="declarationAccepted"
                  className="text-xs font-semibold text-slate-800 leading-relaxed select-none cursor-pointer"
                >
                  I have read and confirm that all details entered by me are true and accurate. <span className="text-red-500">*</span>
                </label>
              </div>

              {/* Submit Button */}
              <div className="pt-4 border-t border-slate-100 flex justify-center">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full sm:w-auto px-10 py-4 bg-[#006B3C] hover:bg-[#005530] text-white font-extrabold rounded-xl text-sm transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2.5 disabled:opacity-70 disabled:cursor-not-allowed uppercase tracking-wider"
                >
                  {submitting ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                      </svg>
                      <span>Submitting Application...</span>
                    </>
                  ) : (
                    <>
                      <span>SUBMIT APPLICATION</span>
                      <CheckCircle2 className="w-5 h-5" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </section>
        </form>
      </main>

      <footer className="w-full bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-500">
        <div className="max-w-4xl mx-auto px-4">
          © {new Date().getFullYear()} Rupeeapex Groups of Companies. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
