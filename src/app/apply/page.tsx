'use client';

import React, { useState, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { CompanyHeader } from '@/components/branding/CompanyHeader';
import { PREFERRED_JOB_ROLES, BLOOD_GROUPS, MARITAL_STATUSES, REFERRAL_SOURCES } from '@/lib/constants';
import {
  User,
  Users,
  Phone,
  Home,
  GraduationCap,
  Briefcase,
  Star,
  Camera,
  CheckSquare,
  AlertCircle,
  CheckCircle2,
  Printer,
  Sparkles,
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
      bloodGroup: 'O+',
      maritalStatus: 'Single' as 'Single' | 'Married' | 'Divorced' | 'Widowed',
      fathersName: '',
      mothersName: '',
    },
    familyDetails: {
      fathersOccupation: '',
      fathersMobile: '',
      mothersOccupation: '',
      mothersMobile: '',
      spouseName: '',
      marriageDate: '',
      numberOfChildren: 0,
    },
    contactDetails: {
      mobileNumber: '',
      alternativeMobileNumber: '',
      email: '',
      alternativeEmail: '',
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
      institutionName: '',
      additionalQualification: '',
      passingYear: '',
      percentageOrGrade: '',
    },
    employmentDetails: {
      hasPreviousExperience: false,
      previousOccupation: '',
      previousCompanyName: '',
      experienceDurationYears: 0,
      experienceDurationMonths: 0,
      lastDrawnSalary: '',
      reasonForLeaving: '',
    },
    preferredJobRole: '' as any,
    referenceDetails: {
      referralSource: 'Walk-in Direct' as any,
      referrerName: '',
      referrerContact: '',
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
      setErrorMessage('Candidate photograph is required. Please take or upload a photo.');
      window.scrollTo({ top: document.body.scrollHeight / 2, behavior: 'smooth' });
      return;
    }

    if (!formData.preferredJobRole) {
      setErrorMessage('Please select what role you prefer (GOLD / NIDHI / MFI / CHIT / INSURANCE).');
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
    } catch (err: any) {
      setErrorMessage('Network connection error while submitting. Please try again.');
      setSubmitting(false);
    }
  };

  // Print receipt function
  const handlePrint = () => {
    window.print();
  };

  // ==========================================
  // SUCCESS SCREEN
  // ==========================================
  if (submittedAppId) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <CompanyHeader subtitle="Application Submitted" />
        <main className="flex-1 max-w-2xl mx-auto px-4 py-10 w-full flex items-center justify-center">
          <div className="bg-white rounded-3xl shadow-xl border border-slate-200 p-8 sm:p-10 text-center w-full relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-3 bg-gradient-to-r from-[#006B3C] via-[#F5C400] to-[#006B3C]"></div>

            <div className="w-20 h-20 bg-emerald-100 text-[#006B3C] rounded-full mx-auto flex items-center justify-center mb-6 shadow-sm">
              <CheckCircle2 className="w-12 h-12" />
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-2">
              Application Submitted Successfully!
            </h1>
            <p className="text-sm text-slate-600 mb-6">
              Thank you for applying to <span className="font-semibold text-slate-900">Rupeeapex Groups of Companies</span>. Your job application has been securely registered in our HR system.
            </p>

            {/* Application ID Card */}
            <div className="bg-emerald-50/70 border-2 border-dashed border-[#006B3C] rounded-2xl p-6 mb-6">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                Your Unique Application ID
              </span>
              <div className="text-3xl sm:text-4xl font-mono font-extrabold text-[#006B3C] tracking-wider my-2">
                {submittedAppId}
              </div>
              <p className="text-xs text-slate-600">
                Preferred Role: <span className="font-bold text-slate-900">{formData.preferredJobRole}</span> | Candidate: <span className="font-semibold text-slate-900">{formData.personalDetails.fullName}</span>
              </p>
            </div>

            {/* Instruction Box */}
            <div className="bg-slate-50 rounded-2xl p-4 text-xs text-slate-600 text-left space-y-2 mb-8 border border-slate-200">
              <div className="font-bold text-slate-800 flex items-center gap-1.5">
                <FileCheck className="w-4 h-4 text-[#006B3C]" />
                <span>Next Steps & Important Information:</span>
              </div>
              <p>• Please <strong>take a screenshot</strong> or write down your Application ID for reference.</p>
              <p>• Inform the reception officer that you have submitted your online application.</p>
              <p>• Our HR team will review your application and contact you on <strong>{formData.contactDetails.mobileNumber}</strong>.</p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={handlePrint}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold rounded-xl text-sm transition-colors"
              >
                <Printer className="w-4 h-4" />
                <span>Print Confirmation</span>
              </button>
              <Link
                href="/"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#006B3C] hover:bg-[#005530] text-white font-semibold rounded-xl text-sm transition-colors shadow-sm"
              >
                <span>Return to Home</span>
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // ==========================================
  // CANDIDATE APPLICATION FORM SCREEN
  // ==========================================
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <CompanyHeader subtitle="Job Application" showBackHome />

      <main className="flex-1 max-w-4xl mx-auto px-4 py-8 w-full">
        {/* Top Header Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8 mb-8 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-2 bg-[#006B3C]"></div>
          <div className="inline-block text-xs font-bold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 uppercase tracking-wider mb-2">
            Rupeeapex Groups of Companies
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            JOB APPLICATION FORM
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-2 max-w-xl mx-auto leading-relaxed">
            Please fill in all the details accurately as in your official records.
            Mandatory fields are marked with an asterisk (<span className="text-red-500 font-bold">*</span>).
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
          {/* SECTION 1: PERSONAL DETAILS */}
          {/* ==================================================== */}
          <section className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="bg-emerald-50/70 px-6 py-3.5 border-b border-emerald-100 flex items-center gap-2.5">
              <User className="w-5 h-5 text-[#006B3C]" />
              <h2 className="text-base font-bold text-slate-900">1. PERSONAL DETAILS</h2>
            </div>
            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {/* Full Name */}
              <div className="sm:col-span-2 lg:col-span-1">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="As per Aadhaar / ID"
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
                  Age (Years) <span className="text-red-500">*</span>
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

              {/* Blood Group */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Blood Group <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.personalDetails.bloodGroup}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      personalDetails: { ...prev.personalDetails, bloodGroup: e.target.value },
                    }))
                  }
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-[#006B3C] focus:outline-none"
                >
                  {BLOOD_GROUPS.map((bg) => (
                    <option key={bg} value={bg}>
                      {bg}
                    </option>
                  ))}
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
            </div>
          </section>

          {/* ==================================================== */}
          {/* SECTION 2: FAMILY DETAILS */}
          {/* ==================================================== */}
          <section className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="bg-emerald-50/70 px-6 py-3.5 border-b border-emerald-100 flex items-center gap-2.5">
              <Users className="w-5 h-5 text-[#006B3C]" />
              <h2 className="text-base font-bold text-slate-900">2. FAMILY DETAILS</h2>
            </div>
            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {/* Father's Occupation */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Father&apos;s Occupation
                </label>
                <input
                  type="text"
                  placeholder="e.g. Farmer / Business"
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

              {/* Father's Mobile */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Father&apos;s Contact Number
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

              {/* Mother's Occupation */}
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

              {/* Mother's Mobile */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Mother&apos;s Contact Number
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

              {/* Conditional Spouse Fields if Married */}
              {formData.personalDetails.maritalStatus === 'Married' && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                      Spouse Name
                    </label>
                    <input
                      type="text"
                      placeholder="Husband / Wife name"
                      value={formData.familyDetails.spouseName}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          familyDetails: { ...prev.familyDetails, spouseName: e.target.value },
                        }))
                      }
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-[#006B3C] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                      Marriage Date
                    </label>
                    <input
                      type="date"
                      value={formData.familyDetails.marriageDate}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          familyDetails: { ...prev.familyDetails, marriageDate: e.target.value },
                        }))
                      }
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-[#006B3C] focus:outline-none"
                    />
                  </div>
                </>
              )}
            </div>
          </section>

          {/* ==================================================== */}
          {/* SECTION 3: CONTACT DETAILS */}
          {/* ==================================================== */}
          <section className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="bg-emerald-50/70 px-6 py-3.5 border-b border-emerald-100 flex items-center gap-2.5">
              <Phone className="w-5 h-5 text-[#006B3C]" />
              <h2 className="text-base font-bold text-slate-900">3. CONTACT DETAILS</h2>
            </div>
            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Primary Mobile */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Mobile Number <span className="text-red-500">*</span>
                </label>
                <div className="flex">
                  <span className="inline-flex items-center px-3 rounded-l-xl border border-r-0 border-slate-300 bg-slate-100 text-slate-600 text-sm font-medium">
                    +91
                  </span>
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    placeholder="9876543210"
                    value={formData.contactDetails.mobileNumber}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        contactDetails: { ...prev.contactDetails, mobileNumber: e.target.value },
                      }))
                    }
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-r-xl text-sm focus:bg-white focus:ring-2 focus:ring-[#006B3C] focus:outline-none"
                  />
                </div>
              </div>

              {/* Alt Mobile */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Alternative Mobile Number
                </label>
                <div className="flex">
                  <span className="inline-flex items-center px-3 rounded-l-xl border border-r-0 border-slate-300 bg-slate-100 text-slate-600 text-sm font-medium">
                    +91
                  </span>
                  <input
                    type="tel"
                    maxLength={10}
                    placeholder="Optional backup number"
                    value={formData.contactDetails.alternativeMobileNumber}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        contactDetails: {
                          ...prev.contactDetails,
                          alternativeMobileNumber: e.target.value,
                        },
                      }))
                    }
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-r-xl text-sm focus:bg-white focus:ring-2 focus:ring-[#006B3C] focus:outline-none"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="candidate@example.com"
                  value={formData.contactDetails.email}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      contactDetails: { ...prev.contactDetails, email: e.target.value },
                    }))
                  }
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-[#006B3C] focus:outline-none"
                />
              </div>

              {/* Alt Email */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Alternative Email
                </label>
                <input
                  type="email"
                  placeholder="Optional backup email"
                  value={formData.contactDetails.alternativeEmail}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      contactDetails: { ...prev.contactDetails, alternativeEmail: e.target.value },
                    }))
                  }
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-[#006B3C] focus:outline-none"
                />
              </div>
            </div>
          </section>

          {/* ==================================================== */}
          {/* SECTION 4: ADDRESS DETAILS */}
          {/* ==================================================== */}
          <section className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="bg-emerald-50/70 px-6 py-3.5 border-b border-emerald-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Home className="w-5 h-5 text-[#006B3C]" />
                <h2 className="text-base font-bold text-slate-900">4. ADDRESS DETAILS</h2>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Permanent Address */}
              <div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
                  A. Permanent Address <span className="text-red-500">*</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Door No / Street / Landmark
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 12/4B, Gandhi Street"
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
                      Village / Area / Town
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Village or Town"
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
                      Taluk
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Taluk name"
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
                      District
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
                      Pincode
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={6}
                      placeholder="6-digit pincode"
                      value={formData.addressDetails.permanentAddress.pincode}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          addressDetails: {
                            ...prev.addressDetails,
                            permanentAddress: {
                              ...prev.addressDetails.permanentAddress,
                              pincode: e.target.value,
                            },
                          },
                        }))
                      }
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-[#006B3C] focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Checkbox: Same as permanent */}
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
                    B. Temporary / Present Address <span className="text-red-500">*</span>
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Door No / Street / Landmark
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
                        Village / Area / Town
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Village or Town"
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
                        Taluk
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Taluk name"
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
                        District
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
                        Pincode
                      </label>
                      <input
                        type="text"
                        required
                        maxLength={6}
                        placeholder="6-digit pincode"
                        value={formData.addressDetails.temporaryAddress.pincode}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            addressDetails: {
                              ...prev.addressDetails,
                              temporaryAddress: {
                                ...prev.addressDetails.temporaryAddress,
                                pincode: e.target.value,
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
          {/* SECTION 5: EDUCATIONAL DETAILS */}
          {/* ==================================================== */}
          <section className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="bg-emerald-50/70 px-6 py-3.5 border-b border-emerald-100 flex items-center gap-2.5">
              <GraduationCap className="w-5 h-5 text-[#006B3C]" />
              <h2 className="text-base font-bold text-slate-900">5. EDUCATIONAL DETAILS</h2>
            </div>
            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {/* Qualification */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Highest Qualification <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 10th / 12th / B.Com / B.Sc / MBA"
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
                />
              </div>

              {/* Institution */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  School / College Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Institution name"
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

              {/* Passing Year */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Passing Year <span className="text-red-500">*</span>
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
                      educationDetails: { ...prev.educationDetails, passingYear: e.target.value },
                    }))
                  }
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-[#006B3C] focus:outline-none"
                />
              </div>

              {/* Additional Qualification */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Additional Qualification / Certificates
                </label>
                <input
                  type="text"
                  placeholder="e.g. Tally, Typewriting, Computer Application"
                  value={formData.educationDetails.additionalQualification}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      educationDetails: {
                        ...prev.educationDetails,
                        additionalQualification: e.target.value,
                      },
                    }))
                  }
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-[#006B3C] focus:outline-none"
                />
              </div>

              {/* Grade / Percentage */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Percentage / Grade
                </label>
                <input
                  type="text"
                  placeholder="e.g. 75% or First Class"
                  value={formData.educationDetails.percentageOrGrade}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      educationDetails: {
                        ...prev.educationDetails,
                        percentageOrGrade: e.target.value,
                      },
                    }))
                  }
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-[#006B3C] focus:outline-none"
                />
              </div>
            </div>
          </section>

          {/* ==================================================== */}
          {/* SECTION 6: EMPLOYMENT DETAILS */}
          {/* ==================================================== */}
          <section className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="bg-emerald-50/70 px-6 py-3.5 border-b border-emerald-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Briefcase className="w-5 h-5 text-[#006B3C]" />
                <h2 className="text-base font-bold text-slate-900">6. EMPLOYMENT DETAILS</h2>
              </div>
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
                <div className="pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                      Previous Occupation / Role
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Sales Executive, Cashier"
                      value={formData.employmentDetails.previousOccupation}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          employmentDetails: {
                            ...prev.employmentDetails,
                            previousOccupation: e.target.value,
                          },
                        }))
                      }
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-[#006B3C] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                      Previous Company Name
                    </label>
                    <input
                      type="text"
                      placeholder="Company name"
                      value={formData.employmentDetails.previousCompanyName}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          employmentDetails: {
                            ...prev.employmentDetails,
                            previousCompanyName: e.target.value,
                          },
                        }))
                      }
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-[#006B3C] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                      Duration (Years & Months)
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="number"
                        min="0"
                        placeholder="Years"
                        value={formData.employmentDetails.experienceDurationYears}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            employmentDetails: {
                              ...prev.employmentDetails,
                              experienceDurationYears: Number(e.target.value),
                            },
                          }))
                        }
                        className="px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-[#006B3C] focus:outline-none"
                      />
                      <input
                        type="number"
                        min="0"
                        max="11"
                        placeholder="Months"
                        value={formData.employmentDetails.experienceDurationMonths}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            employmentDetails: {
                              ...prev.employmentDetails,
                              experienceDurationMonths: Number(e.target.value),
                            },
                          }))
                        }
                        className="px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-[#006B3C] focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                      Last Drawn Salary
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. ₹18,000 / month"
                      value={formData.employmentDetails.lastDrawnSalary}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          employmentDetails: {
                            ...prev.employmentDetails,
                            lastDrawnSalary: e.target.value,
                          },
                        }))
                      }
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-[#006B3C] focus:outline-none"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                      Reason for Leaving
                    </label>
                    <input
                      type="text"
                      placeholder="Reason for change"
                      value={formData.employmentDetails.reasonForLeaving}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          employmentDetails: {
                            ...prev.employmentDetails,
                            reasonForLeaving: e.target.value,
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
          {/* SECTION 7: PREFERRED JOB ROLE (CRITICAL MANDATORY FIELD) */}
          {/* ==================================================== */}
          <section className="bg-gradient-to-r from-amber-50 to-emerald-50 rounded-2xl shadow-sm border-2 border-amber-300 overflow-hidden">
            <div className="bg-amber-100/70 px-6 py-3.5 border-b border-amber-200 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Star className="w-5 h-5 text-amber-700" />
                <h2 className="text-base font-bold text-amber-950">
                  7. PREFERRED JOB ROLE <span className="text-red-600">*</span>
                </h2>
              </div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800 bg-white/80 px-2.5 py-0.5 rounded-full border border-amber-300">
                Mandatory Selection
              </span>
            </div>
            <div className="p-6">
              <label className="block text-sm font-bold text-slate-800 mb-2">
                What role do you prefer? <span className="text-red-500">*</span>
              </label>
              <p className="text-xs text-slate-600 mb-4">
                Please select the Rupeeapex group division where you wish to apply.
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {PREFERRED_JOB_ROLES.map((role) => {
                  const isSelected = formData.preferredJobRole === role;
                  return (
                    <button
                      type="button"
                      key={role}
                      onClick={() =>
                        setFormData((prev) => ({ ...prev, preferredJobRole: role }))
                      }
                      className={`py-4 px-3 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-1.5 ${
                        isSelected
                          ? 'bg-[#006B3C] text-white border-[#006B3C] shadow-md ring-2 ring-[#006B3C]/30'
                          : 'bg-white hover:bg-slate-50 text-slate-800 border-slate-300 hover:border-[#006B3C]'
                      }`}
                    >
                      <span className="font-extrabold text-base tracking-wide">{role}</span>
                      <span className={`text-[10px] font-medium ${isSelected ? 'text-amber-300' : 'text-slate-500'}`}>
                        {role === 'GOLD' && 'Gold Loans'}
                        {role === 'NIDHI' && 'Nidhi Services'}
                        {role === 'MFI' && 'Micro Finance'}
                        {role === 'CHIT' && 'Chit Funds'}
                        {role === 'INSURANCE' && 'Life & Gen Ins.'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </section>

          {/* ==================================================== */}
          {/* SECTION 8: OTHER INFORMATION */}
          {/* ==================================================== */}
          <section className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="bg-emerald-50/70 px-6 py-3.5 border-b border-emerald-100 flex items-center gap-2.5">
              <Sparkles className="w-5 h-5 text-[#006B3C]" />
              <h2 className="text-base font-bold text-slate-900">8. OTHER INFORMATION</h2>
            </div>
            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  How did you hear about this job? <span className="text-red-500">*</span>
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
                  {REFERRAL_SOURCES.map((src) => (
                    <option key={src} value={src}>
                      {src}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Referrer / Friend Name
                </label>
                <input
                  type="text"
                  placeholder="Optional reference person"
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
                  Referrer Contact Number
                </label>
                <input
                  type="tel"
                  maxLength={10}
                  placeholder="10-digit mobile"
                  value={formData.referenceDetails.referrerContact}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      referenceDetails: {
                        ...prev.referenceDetails,
                        referrerContact: e.target.value,
                      },
                    }))
                  }
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-[#006B3C] focus:outline-none"
                />
              </div>
            </div>
          </section>

          {/* ==================================================== */}
          {/* SECTION 9: PHOTOGRAPH UPLOAD */}
          {/* ==================================================== */}
          <section className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="bg-emerald-50/70 px-6 py-3.5 border-b border-emerald-100 flex items-center gap-2.5">
              <Camera className="w-5 h-5 text-[#006B3C]" />
              <h2 className="text-base font-bold text-slate-900">
                9. PHOTOGRAPH UPLOAD <span className="text-red-500">*</span>
              </h2>
            </div>
            <div className="p-6 flex flex-col sm:flex-row items-center gap-6">
              {/* Photo Preview Box */}
              <div className="w-32 h-40 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 flex items-center justify-center overflow-hidden shrink-0 relative group">
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
                    <span className="text-[10px] leading-tight font-medium">Passport Photo</span>
                  </div>
                )}
              </div>

              {/* Upload Controls */}
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
                    <span>{photoFile ? 'Change Photograph' : 'Upload or Take Photo'}</span>
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
                  <p>• Use mobile camera for instant capture or select from gallery/desktop.</p>
                  <p>• Photos are stored privately and never displayed publicly.</p>
                </div>
              </div>
            </div>
          </section>

          {/* ==================================================== */}
          {/* SECTION 10: DECLARATION */}
          {/* ==================================================== */}
          <section className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="bg-emerald-50/70 px-6 py-3.5 border-b border-emerald-100 flex items-center gap-2.5">
              <CheckSquare className="w-5 h-5 text-[#006B3C]" />
              <h2 className="text-base font-bold text-slate-900">
                10. CANDIDATE DECLARATION <span className="text-red-500">*</span>
              </h2>
            </div>
            <div className="p-6 space-y-4">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700 leading-relaxed">
                <p>
                  I hereby solemnly declare that all statements made and information furnished in this application form are true, complete and correct to the best of my knowledge and belief. In the event of any information being found false, fabricated or incorrect at any stage, my candidature/appointment shall be liable to immediate cancellation/dismissal without notice.
                </p>
              </div>

              <div className="flex items-start gap-3 pt-2">
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
                  I have read and fully understood the above declaration and confirm that all details entered by me are true and accurate. <span className="text-red-500">*</span>
                </label>
              </div>

              {/* Submit Button */}
              <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-xs text-slate-500">
                  Submission Timestamp will be recorded securely with unique sequence ID.
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full sm:w-auto px-8 py-3.5 bg-[#006B3C] hover:bg-[#005530] text-white font-bold rounded-xl text-sm transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2.5 disabled:opacity-70 disabled:cursor-not-allowed"
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
                      <span>Submit Job Application</span>
                      <CheckCircle2 className="w-5 h-5" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </section>
        </form>
      </main>

      <footer className="w-full bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-500 mt-12">
        <div className="max-w-4xl mx-auto px-4">
          © {new Date().getFullYear()} Rupeeapex Groups of Companies. ResumeFlow HR Application Portal.
        </div>
      </footer>
    </div>
  );
}
