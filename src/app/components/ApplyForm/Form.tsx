"use client";

import { useState, ChangeEvent, FormEvent } from 'react';
import Image from 'next/image';
import LoadingSpinner from '../LoadingSpinner';
import { WinterBanner, WinterFooterBanner } from '../WinterBanner';
import { EDITION, EDITION_SPACES } from '@/lib/edition';

const fieldClass =
    'winter-field block w-full rounded-md border border-[#5FA8DC] bg-[#DCEEFA] px-4 py-[14px] text-center text-[#141414] transition-colors focus:border-[#141414] focus:outline-none';

function FilePicker({
    file,
    onChange,
    label,
    hint,
}: {
    file: File | null;
    onChange: (e: ChangeEvent<HTMLInputElement>) => void;
    label: string;
    hint: string;
}) {
    return (
        <div className="flex min-w-0 flex-1 flex-col gap-2">
            <label className="flex cursor-pointer items-center gap-3 rounded-md border border-[#5FA8DC] bg-[#DCEEFA] px-3 py-[10px] text-[14px] text-[#141414] transition-colors focus-within:border-[#141414] hover:border-[#141414]">
                <span className="whitespace-nowrap rounded bg-[#141414] px-4 py-2 font-semibold text-white">
                    Zgjidh dokumentin
                </span>
                <span className={`min-w-0 truncate bg-transparent ${file ? 'font-semibold text-[#1F5C2B]' : ''}`}>
                    {file ? `✓ ${file.name}` : 'Asnjë dokument'}
                </span>
                <input
                    type="file"
                    accept=".pdf, .jpg, .jpeg, .png"
                    onChange={onChange}
                    aria-label={label}
                    className="sr-only"
                />
            </label>
            <p className="bg-transparent text-center text-[13px] italic text-[#B3261E] lg:text-left">{hint}</p>
        </div>
    );
}

export default function ContactForm({
    applicationsOpen = true,
}: {
    applicationsOpen?: boolean;
}) {
    const [fullName, setFullName] = useState('');
    const [companyName, setCompanyName] = useState('');
    const [companyEmail, setCompanyEmail] = useState('');
    const [businessCertificate, setBusinessCertificate] = useState<File | null>(null);
    const [personalDocument, setPersonalDocument] = useState<File | null>(null);
    const [fileError, setFileError] = useState<string>('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [loading, setLoading] = useState(false);
    const [tooManyRequests, setTooManyRequests] = useState(false);
    const [showFileErrorModal, setShowFileErrorModal] = useState(false);
    const [selectedSpace, setSelectedSpace] = useState<string>('');
    const [submittedFullName, setSubmittedFullName] = useState('');
    const [submittedSelectedSpace, setSubmittedSelectedSpace] = useState('');
    const [showSpaceErrorModal, setShowSpaceErrorModal] = useState(false);
    const [compressingFile, setCompressingFile] = useState<string | null>(null);

    // Function to split full name into name and surname
    const splitFullName = (fullName: string) => {
        const trimmed = fullName.trim();
        if (!trimmed) return { name: '', surname: '' };
        
        const parts = trimmed.split(/\s+/);
        if (parts.length === 1) {
            return { name: parts[0], surname: '' };
        }
        
        const name = parts[0];
        const surname = parts.slice(1).join(' ');
        return { name, surname };
    };

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!applicationsOpen) {
            return;
        }

        if (!businessCertificate) {
            setFileError("Ju lutem ngarkoni certifikatën e biznesit të regjistruar në ARBK.");
            setShowFileErrorModal(true);
            return;
        }

        if (!personalDocument) {
            setFileError("Ju lutem ngarkoni dokumentin personal të identifikimit.");
            setShowFileErrorModal(true);
            return;
        }

        if (!selectedSpace) {
            setShowSpaceErrorModal(true);
            return;
        }

        setLoading(true);

        // Split full name into name and surname
        const { name, surname } = splitFullName(fullName);

        // Convert files to base64
        const convertFileToBase64 = (file: File): Promise<string> => {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.readAsDataURL(file);
                reader.onloadend = () => resolve(reader.result as string);
                reader.onerror = reject;
            });
        };

        try {
            const [base64BusinessCert, base64PersonalDoc] = await Promise.all([
                convertFileToBase64(businessCertificate),
                convertFileToBase64(personalDocument)
            ]);

            const response = await fetch('/api/apply', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name,
                    surname,
                    companyName,
                    companyEmail,
                    businessCertificate: base64BusinessCert,
                    businessCertificateName: businessCertificate.name,
                    personalDocument: base64PersonalDoc,
                    personalDocumentName: personalDocument.name,
                    phoneNumber,
                    selectedSpace
                }),
            });

            const result = await response.json();
            setLoading(false);

            if (response.ok) {
                // Store the submitted full name and selected space for the thank you message
                setSubmittedFullName(fullName);
                setSubmittedSelectedSpace(selectedSpace);
                setShowModal(true);
                // Clear form fields
                setFullName('');
                setCompanyName('');
                setCompanyEmail('');
                setBusinessCertificate(null);
                setPersonalDocument(null);
                setPhoneNumber('');
                setSelectedSpace('');
            } else if (response.status === 429) {
                setTooManyRequests(true);
            } else {
                const details = result.details ? ` (${result.details})` : '';
                setFileError(`Error: ${result.error}${details}`);
            }
        } catch {
            setLoading(false);
            setFileError("There was an error with the request.");
        }
    };

    const processSelectedFile = async (
        selectedFile: File,
        setFile: (file: File | null) => void,
        label: string
    ) => {
        const allowedTypes = [
            'application/pdf',
            'image/jpeg',
            'image/jpg',
            'image/png',
        ];

        if (!allowedTypes.includes(selectedFile.type)) {
            setFileError('Lloji i skedarit nuk është i vlefshëm. Ju lutem ngarkoni një PDF, JPG, ose PNG.');
            setFile(null);
            setShowFileErrorModal(true);
            return;
        }

        setCompressingFile(label);
        setFileError('');

        try {
            const { compressFileIfNeeded } = await import('@/lib/compressFile');
            const processedFile = await compressFileIfNeeded(selectedFile);
            setFile(processedFile);
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Gabim gjatë kompresimit të skedarit.';
            setFileError(message);
            setFile(null);
            setShowFileErrorModal(true);
        } finally {
            setCompressingFile(null);
        }
    };

    const handleBusinessCertificateChange = async (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) {
            await processSelectedFile(e.target.files[0], setBusinessCertificate, 'certifikata');
        }
    };

    const handlePersonalDocumentChange = async (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) {
            await processSelectedFile(e.target.files[0], setPersonalDocument, 'dokumenti');
        }
    };
    
    const closeModal = () => {
        setShowModal(false);
    };

    const closeTooManyRequestsAlert = () => {
        setTooManyRequests(false);
    };

    const closeFileErrorModal = () => {
        setShowFileErrorModal(false);
    };

    const closeSpaceErrorModal = () => {
        setShowSpaceErrorModal(false);
    };

    return (
        <div className="w-full bg-white">
            {/* Hero */}
            <section className="flex w-full flex-col items-center px-3 pt-6 sm:px-8 sm:pt-12">
                <WinterBanner />

                {applicationsOpen ? (
                    <>
                        <div className="mt-6 max-w-[1000px] text-center font-malkie-slab text-[16px] uppercase leading-[1.25] text-[#141414] sm:mt-9 sm:text-[clamp(20px,2.6vw,30px)]">
                            <p>Këtu mund të gjeni dokumentin mbi detajet për aplikimin</p>
                            <p>për shtëpizë në {EDITION.name} {EDITION.year}</p>
                        </div>
                        <a
                            href={EDITION.documentUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-5 inline-flex items-center justify-center bg-[#D93627] px-8 py-3 font-malkie-slab text-[22px] uppercase leading-[1.25] text-white transition-colors hover:bg-[#141414] sm:mt-7 sm:px-[52px] sm:py-[14px] sm:text-[30px]"
                        >
                            Shiko dokumentin
                        </a>
                    </>
                ) : null}

                <Image
                    src={EDITION.logo}
                    alt={`${EDITION.name} — Bashkë në Shesh!`}
                    width={420}
                    height={420}
                    priority
                    className="mt-7 h-auto w-[270px] max-w-[80%] sm:mt-10 sm:w-[420px]"
                />

                <div className={`mt-6 w-full text-center sm:mt-8 ${applicationsOpen ? 'max-w-[440px]' : 'max-w-3xl px-2'}`}>
                    {applicationsOpen ? (
                        <>
                            <h1 className="font-malkie-slab text-[30px] uppercase leading-[1.2] text-[#141414] sm:text-[34px]">
                                Apliko këtu!
                            </h1>
                            <p className="mt-2 text-[16px] text-[#141414]">
                                Plotëso të dhënat në hapësirat e mëposhtme për të aplikuar për shtëpizë në{' '}
                                <b>&quot;{EDITION.name}&quot;</b>.
                            </p>
                        </>
                    ) : (
                        <>
                            <p className="font-malkie-slab text-[clamp(36px,10vw,64px)] uppercase leading-[1.1] text-[#141414]">
                                Aplikimet janë mbyllur
                            </p>
                            <p className="mt-4 text-[clamp(18px,4.5vw,28px)] leading-snug text-[#141414]">
                                Koha për aplikim ka përfunduar. Faleminderit për interesimin tuaj!
                            </p>
                        </>
                    )}
                </div>
            </section>

            {applicationsOpen ? (
            <div className="flex justify-center px-3 sm:px-8">
            <form onSubmit={handleSubmit} className="mt-7 flex w-full max-w-[800px] flex-col items-center">
                {/* SEKSIONI 1: INFORMATA PERSONALE */}
                <div className="flex w-full max-w-[700px] flex-col gap-4">
                    <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Shkruani emrin dhe mbiemrin"
                        aria-label="Emri dhe mbiemri"
                        required
                        className={fieldClass}
                    />
                    <input
                        type="text"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        placeholder="Emri i kompanisë"
                        aria-label="Emri i kompanisë"
                        required
                        className={fieldClass}
                    />
                    <div className="flex flex-col gap-4 lg:flex-row">
                        <input
                            type="email"
                            value={companyEmail}
                            onChange={(e) => setCompanyEmail(e.target.value)}
                            placeholder="Email adresa"
                            aria-label="Email adresa"
                            required
                            className={`${fieldClass} lg:min-w-0 lg:flex-1`}
                        />
                        <input
                            type="tel"
                            value={phoneNumber}
                            onChange={(e) => setPhoneNumber(e.target.value)}
                            placeholder="Nr. kontaktues"
                            aria-label="Numri kontaktues"
                            required
                            className={`${fieldClass} lg:min-w-0 lg:flex-1`}
                        />
                    </div>
                </div>

                {/* SEKSIONI 2: DOKUMENTET PËR NGARKIM */}
                <h2 className="mb-4 mt-9 text-center font-malkie-slab text-[22px] uppercase leading-[1.2] text-[#141414] sm:mt-11 sm:text-[28px]">
                    Dokumentet për ngarkim
                </h2>
                <div className="flex w-full max-w-[700px] flex-col gap-4 lg:flex-row">
                    <FilePicker
                        file={businessCertificate}
                        onChange={handleBusinessCertificateChange}
                        label="Certifikata e biznesit e regjistruar në ARBK"
                        hint="Certifikata e biznesit e regjistruar në ARBK (PDF, JPG, PNG)"
                    />
                    <FilePicker
                        file={personalDocument}
                        onChange={handlePersonalDocumentChange}
                        label="Dokumenti personal i identifikimit"
                        hint="Dokumenti personal i identifikimit (PDF, JPG, PNG)"
                    />
                </div>
                {compressingFile && (
                    <div className="flex w-full justify-center py-2">
                        <LoadingSpinner label="Duke përgatitur dokumentin..." size="sm" />
                    </div>
                )}

                {/* SEKSIONI 3: ZGJIDHNI HAPËSIRËN */}
                <h2 className="mb-4 mt-10 text-center font-malkie-slab text-[22px] uppercase leading-[1.2] text-[#141414] sm:mb-5 sm:mt-[52px] sm:text-[28px]">
                    Zgjidhni hapësirën
                </h2>
                <div className="flex w-full flex-col gap-6 sm:gap-8">
                    {EDITION_SPACES.map((space) => {
                        const selected = selectedSpace === space.value;
                        return (
                            <label key={space.value} className="group flex cursor-pointer flex-col items-center gap-[14px]">
                                <input
                                    type="radio"
                                    name="space"
                                    value={space.value}
                                    checked={selected}
                                    onChange={(e) => setSelectedSpace(e.target.value)}
                                    aria-label={space.subtitle ? `${space.title}, ${space.subtitle}` : space.title}
                                    className="peer sr-only"
                                />
                                <div
                                    className={`relative aspect-video w-full overflow-hidden rounded-md outline-offset-[3px] peer-focus-visible:outline peer-focus-visible:outline-4 peer-focus-visible:outline-[#141414] sm:outline-offset-4 ${
                                        selected ? 'outline outline-4 outline-[#D93627] sm:outline-[5px]' : ''
                                    }`}
                                >
                                    <Image
                                        src={space.image}
                                        alt=""
                                        fill
                                        sizes="(max-width: 860px) 100vw, 800px"
                                        className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                                    />
                                </div>
                                <span className="flex items-center gap-[10px] bg-transparent sm:gap-4">
                                    <span className="flex flex-col items-center bg-transparent">
                                        <span className="bg-transparent text-center font-malkie-slab text-[19px] uppercase leading-[1.3] text-[#141414] sm:text-[28px]">
                                            {space.title}
                                        </span>
                                        {space.subtitle ? (
                                            <span className="bg-transparent text-center text-[13px] text-[#4a4a4a] sm:text-[15px]">
                                                {space.subtitle}
                                            </span>
                                        ) : null}
                                    </span>
                                    <span
                                        aria-hidden="true"
                                        className={`flex h-[22px] w-[22px] shrink-0 items-center justify-center border-2 border-[#D93627] sm:h-[26px] sm:w-[26px] ${
                                            selected ? 'bg-[#D93627]' : 'bg-transparent'
                                        }`}
                                    >
                                        {selected ? (
                                            <svg className="h-[14px] w-[14px] bg-transparent sm:h-4 sm:w-4" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M5 12l5 5 9-10" />
                                            </svg>
                                        ) : null}
                                    </span>
                                </span>
                            </label>
                        );
                    })}
                </div>

                <div className="mt-9 w-full max-w-[700px] sm:mt-10">
                    {loading || compressingFile ? (
                        <div className="flex w-full items-center justify-center py-4">
                            <LoadingSpinner
                                label={compressingFile ? 'Duke përgatitur dokumentin...' : 'Duke dërguar aplikimin...'}
                                size="md"
                            />
                        </div>
                    ) : (
                        <button
                            type="submit"
                            className="flex w-full items-center justify-center bg-[#D93627] py-[14px] font-malkie-slab text-[24px] uppercase leading-[1.2] text-white transition-colors hover:bg-[#141414] sm:py-4 sm:text-[30px]"
                        >
                            Dërgo
                        </button>
                    )}
                </div>
            </form>
            </div>
            ) : null}

            <div className="flex w-full flex-col items-center px-3 pb-7 pt-7 sm:px-8 sm:pb-12">
                <p className="font-malkie-slab text-[13px] text-[#141414]">© {EDITION.year} Prishtina Festive</p>
                <div className="mt-4 flex w-full justify-center sm:mt-5">
                    <WinterFooterBanner />
                </div>
            </div>

            {showModal && (
                <div 
                    className="fixed inset-0 bg-black bg-opacity-50 flex lg:justify-center items-center z-50 p-4 animate-fadeIn"
                    onClick={closeModal}
                >
                    <div 
                        className="p-8 rounded-xl shadow-2xl max-w-lg w-full border border-[#367a3b]/10 animate-scaleIn"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="text-center mb-8">
                            {/* Success Icon with Animation */}
                            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-[#367a3b]/20 to-[#87c260]/20 mb-6 animate-bounceIn">
                                <div className="w-16 h-16 rounded-full bg-[#367a3b]/10 flex items-center justify-center">
                                    <svg className="w-10 h-10 text-[#367a3b]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                            </div>
                            
                            {/* Thank You Message */}
                            <h2 className="text-center font-bold text-2xl text-[#1d1d1b] mb-4 leading-tight">
                                Faleminderit <span className="font-bold text-[#367a3b]">{submittedFullName}</span> që aplikuat për shtëpizë në <span className="font-bold">{EDITION.name}</span>.
                            </h2>
                            
                            {/* Professional Message */}
                            <div className="space-y-3 text-[#1d1d1b] leading-relaxed">
                               
                                <p className="text-base">
                                    Ju keni zgjedhur hapësirën <span className="font-semibold text-[#367a3b]">{submittedSelectedSpace}</span>.
                                </p>
                                <p className="text-base text-[#1d1d1b]/80">
                                    Për detaje tjera do të njoftoheni me kohë.
                                </p>
                            </div>
                        </div>
                        
                        {/* Close Button */}
                        <button 
                            onClick={closeModal} 
                            className="w-full bg-[#367a3b] hover:bg-[#1d1d1b] text-white font-semibold py-3 px-6 rounded-lg focus:outline-none transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
                        >
                            Mbyll
                        </button>
                    </div>
                </div>
            )}

            {tooManyRequests && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
                    <div className="bg-white p-8 rounded-md shadow-lg">
                        <p className="text-center font-bold">Requests too quickly. Please try again later.</p>
                        <button onClick={closeTooManyRequestsAlert} className="mt-4 bg-[#031603] text-white font-semibold py-2 px-4 rounded-md focus:outline-none">
                            Close
                        </button>
                    </div>
                </div>
            )}

            {showFileErrorModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
                    <div className="bg-white p-8 rounded-md shadow-lg py-12">
                        <p className="text-center font-bold">{fileError}</p>
                        <button onClick={closeFileErrorModal} className="mt-4 w-full bg-[#EF5B13] hover:bg-[#031603] text-white font-semibold py-2 px-4 rounded-md focus:outline-none">
                            Mbyll
                        </button>
                    </div>
                </div>
            )}

            {showSpaceErrorModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
                    <div className="bg-white p-8 rounded-md shadow-lg py-12">
                        <p className="text-center font-bold text-lg">Ju lutem zgjidhni një hapësirë</p>
                        <button onClick={closeSpaceErrorModal} className="mt-4 w-full bg-[#EF5B13] hover:bg-[#031603] text-white font-semibold py-2 px-4 rounded-md focus:outline-none">
                            Mbyll
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
