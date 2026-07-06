"use client";

import { useState, ChangeEvent, FormEvent } from 'react';
import Image from 'next/image';
import bannerTop from "../../../../public/assets/summer/banner_top.png";
import bannerBottom from "../../../../public/assets/summer/banner-bottom.png";
import image1 from "../../../../public/assets/summer/shesh-zahir.png";
import image2 from "../../../../public/assets/summer/shesh-skenderbeu.png";
import LoadingSpinner from '../LoadingSpinner';

const BANNER_MAX_WIDTH = 800;

const contentWidthStyle = { width: `min(calc(100vw - 3rem), ${BANNER_MAX_WIDTH}px)` };
const fullWidthImageClass =
    'w-[calc((100vw-16px)*0.97)] sm:w-[calc((100vw-100px)*0.85)]';
const logoImageClass =
    'w-[min(calc(100vw-1rem),94vw)] sm:w-[min(calc(100vw-3rem),540px)]';

function DecorativeBanner({
    src,
    alt,
    priority = false,
    maxWidth = BANNER_MAX_WIDTH,
    fullWidth = false,
    imageClassName = '',
}: {
    src: typeof bannerTop;
    alt: string;
    priority?: boolean;
    maxWidth?: number;
    fullWidth?: boolean;
    imageClassName?: string;
}) {
    const responsiveWidthClass = imageClassName || (fullWidth ? fullWidthImageClass : '');

    return (
        <div className={`flex w-full justify-center ${fullWidth ? 'relative left-1/2 -translate-x-1/2' : ''}`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
                src={src.src}
                alt={alt}
                width={src.width}
                height={src.height}
                loading={priority ? 'eager' : 'lazy'}
                className={`block h-auto max-w-full ${responsiveWidthClass}`}
                style={
                    responsiveWidthClass
                        ? undefined
                        : { width: `min(calc(100vw - 3rem), ${maxWidth}px)` }
                }
            />
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
            return;
        }

        if (!personalDocument) {
            setFileError("Ju lutem ngarkoni dokumentin personal të identifikimit.");
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
            <section className="flex flex-col items-center pt-[50px] pb-0 w-full">
                <DecorativeBanner src={bannerTop} alt="Krejt n'shesh Colorful Edition 2026" priority fullWidth />

                {applicationsOpen ? (
                    <div className="mt-[25px] mb-[25px] w-full max-w-5xl px-1 text-center font-malkie-slab text-[13px] leading-[1.2] tracking-tight uppercase text-black sm:px-4 sm:text-[clamp(18px,3.2vw,32px)] sm:leading-[1.15] sm:tracking-normal">
                        <p>KËTU MUND TË GJENI DOKUMENTIN MBI DETAJET PËR APLIKIMIN</p>
                        <p>PËR SHTËPIZË NË COLORFUL EDITION 2026</p>
                    </div>
                ) : null}

                <div className="flex flex-col items-center px-4 w-full">
                    {applicationsOpen ? (
                        <a
                            href="/assets/Thirrje-për-aplikim.pdf"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="relative z-10 inline-flex shrink-0 items-center justify-center bg-[#FFB33E] px-12 py-3 font-malkie-slab text-[clamp(20px,3vw,32px)] uppercase leading-[1.25] text-black rounded-none transition-colors hover:bg-[#f0a030]"
                        >
                            Shiko dokumentin
                        </a>
                    ) : null}
                    <div className={`relative z-0 ${logoImageClass} leading-none ${applicationsOpen ? '-my-[50px]' : 'mt-[50px] mb-0'}`}>
                        <video
                            src="/assets/summer/logo-white-compressed.webm"
                            autoPlay
                            loop
                            muted
                            playsInline
                            className="block w-full bg-white sm:hidden"
                            aria-label="Akull n'Verë"
                        />
                        <video
                            src="/assets/summer/logo-alpha.webm"
                            autoPlay
                            loop
                            muted
                            playsInline
                            className="hidden w-full bg-transparent sm:block sm:h-auto"
                            aria-label="Akull n'Verë"
                        />
                    </div>
                    <div className={`relative z-10 w-full text-center ${applicationsOpen ? 'max-w-[409px]' : 'max-w-3xl px-2'}`}>
                        {applicationsOpen ? (
                            <>
                                <p className="text-[32px] uppercase font-malkie-slab text-[#1d1d1b]">Apliko këtu!</p>
                                <p className="text-center text-[16px] font-aeonik-pro text-[#1d1d1b] mt-2">Plotëso të dhënat në hapësirat e mëposhtme për të aplikuar për shtëpizë në <b>&quot;Akull n&rsquo;Verë&quot;.</b></p>
                            </>
                        ) : (
                            <>
                                <p className="font-malkie-slab text-[clamp(36px,10vw,64px)] uppercase leading-[1.1] text-[#1d1d1b]">
                                    Aplikimet janë mbyllur
                                </p>
                                <p className="mt-4 font-aeonik-pro text-[clamp(18px,4.5vw,28px)] leading-snug text-[#1d1d1b]">
                                    Koha për aplikim ka përfunduar. Faleminderit për interesimin tuaj!
                                </p>
                            </>
                        )}
                    </div>
                </div>
            </section>

            {applicationsOpen ? (
            <div className="flex justify-center px-4 sm:px-8 pb-8">
            <form onSubmit={handleSubmit} className="w-full max-w-3xl">
                {/* SEKSIONI 1: INFORMATA PERSONALE */}
                <div className="space-y-4 mt-4">
                    
                    <div className="w-full max-w-[700px] mx-auto space-y-4">
                        <input
                            type="text"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            placeholder="Shkruani emrin dhe mbiemrin"
                            required
                            className="block w-full px-4 py-3 bg-[#F6B817] text-black text-center placeholder:text-black border border-[#EF5B13]/30 rounded-md focus:outline-none focus:border-[#EF5B13] transition-all"
                        />

                        <input
                            type="text"
                            value={companyName}
                            onChange={(e) => setCompanyName(e.target.value)}
                            placeholder="Emri i kompanisë"
                            required
                            className="block w-full px-4 py-3 bg-[#F6B817] text-black text-center placeholder:text-black border border-[#EF5B13]/30 rounded-md focus:outline-none focus:border-[#EF5B13] transition-all"
                        />

                        <div className="flex flex-col lg:flex-row gap-4">
                            <input
                                type="email"
                                value={companyEmail}
                                onChange={(e) => setCompanyEmail(e.target.value)}
                                placeholder="Email adresa"
                                required
                                className="flex-1 px-4 py-3 bg-[#F6B817] text-black text-center placeholder:text-black border border-[#EF5B13]/30 rounded-md focus:outline-none focus:border-[#EF5B13] transition-all"
                            />

                            <input
                                type="tel"
                                value={phoneNumber}
                                onChange={(e) => setPhoneNumber(e.target.value)}
                                placeholder="Nr.kontaktues"
                                required
                                className="flex-1 px-4 py-3 bg-[#F6B817] text-black text-center placeholder:text-black border border-[#EF5B13]/30 rounded-md focus:outline-none focus:border-[#EF5B13] transition-all"
                            />
                        </div>
                    </div>
                </div>

                {/* SEKSIONI 2: DOKUMENTET PËR NGARKIM */}
                <div className="space-y-4 mt-4">
                    <h3 className="text-[#1d1d1b] font-malkie-slab text-[28px] leading-[2.5] uppercase text-center">DOKUMENTET PËR NGARKIM</h3>
                    
                    <div className="w-full max-w-[700px] mx-auto space-y-4">
                        {/* File inputs in flex layout */}
                        <div className="flex flex-col lg:flex-row gap-4">
                            {/* Business Certificate */}
                            <div className="flex-1 space-y-2">
                                <label className="block">
                                    <input
                                        type="file"
                                        onChange={handleBusinessCertificateChange}
                                        required
                                        accept=".pdf, .jpg, .jpeg, .png"
                                        className="block w-full px-4 py-3 bg-[#F6B817] text-black border border-[#EF5B13]/30 rounded-md focus:outline-none focus:border-[#EF5B13] transition-all file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-[#D93627] file:text-[#F6B817] hover:file:bg-[#c43b32] file:cursor-pointer cursor-pointer"
                                    />
                                </label>
                                <p className="text-[#c43b32] text-xs italic text-center lg:text-left">
                                    Certifikata e biznesit e regjistruar në ARBK (PDF, JPG, PNG)
                                </p>
                                {businessCertificate && (
                                    <div className="text-center lg:text-left text-[#367a3b] text-xs font-medium truncate">
                                        ✓ {businessCertificate.name}
                                    </div>
                                )}
                            </div>

                            {/* Personal Document */}
                            <div className="flex-1 space-y-2">
                                <label className="block">
                                    <input
                                        type="file"
                                        onChange={handlePersonalDocumentChange}
                                        required
                                        accept=".pdf, .jpg, .jpeg, .png"
                                        className="block w-full px-4 py-3 bg-[#F6B817] text-black border border-[#EF5B13]/30 rounded-md focus:outline-none focus:border-[#EF5B13] transition-all file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-[#D93627] file:text-[#F6B817] hover:file:bg-[#c43b32] file:cursor-pointer cursor-pointer"
                                    />
                                </label>
                                <p className="text-[#c43b32] text-xs italic text-center lg:text-left">
                                    Ngarkoni dokumentin personal të identifikimit
                                </p>
                                {personalDocument && (
                                    <div className="text-center lg:text-left text-[#367a3b] text-xs font-medium truncate">
                                        ✓ {personalDocument.name}
                                    </div>
                                )}
                            </div>
                        </div>

                        {compressingFile && (
                            <div className="w-full flex justify-center py-2">
                                <LoadingSpinner
                                    label="Duke përgatitur dokumentin..."
                                    size="sm"
                                />
                            </div>
                        )}
                    </div>
                </div>

                {/* SEKSIONI 3: ZGJIDHNI HAPËSIRËN */}
                <div className="mt-[50px] flex w-full flex-col items-center">
                    <h3 className="text-[#1d1d1b] font-malkie-slab text-[28px] leading-[2.5] uppercase text-center mb-4">ZGJIDHNI HAPËSIRËN</h3>
                    
                    <div
                        className="relative left-1/2 flex -translate-x-1/2 flex-col items-center gap-8"
                        style={contentWidthStyle}
                    >
                        {/* Option 1: Sheshi Skënderbeu */}
                        <label 
                            className={`group relative flex w-full flex-col items-center cursor-pointer transition-all duration-150 ${
                                selectedSpace === 'Sheshi Skënderbeu'
                                    ? 'opacity-100'
                                    : 'opacity-100 hover:opacity-90'
                            }`}
                        >
                            <div className="relative mb-3 aspect-[1672/941] w-full overflow-hidden rounded-md">
                                <Image
                                    src={image2}
                                    alt="Sheshi Skënderbeu"
                                    fill
                                    className="object-cover"
                                    style={{ borderRadius: '6px' }}
                                    priority={false}
                                />
                            </div>
                            
                            <div className="mb-3 flex w-full items-center justify-center gap-4">
                                <span className="text-[#1d1d1b] font-malkie-slab text-[28px] leading-[2.5] uppercase text-center">
                                    Sheshi &quot;Skënderbeu&quot;
                                </span>
                                <div className="flex shrink-0 items-center justify-center">
                                    <div className={`w-5 h-5 lg:w-6 lg:h-6 border-2 flex items-center justify-center transition-all ${
                                        selectedSpace === 'Sheshi Skënderbeu'
                                            ? 'border-[#F6B817] bg-[#F6B817]'
                                            : 'border-[#F6B817] group-hover:border-[#D93627] bg-transparent'
                                    }`}>
                                        {selectedSpace === 'Sheshi Skënderbeu' && (
                                            <svg className="w-3.5 h-3.5 lg:w-4 lg:h-4 text-[#1d1d1b]" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                            </svg>
                                        )}
                                    </div>
                                    <input
                                        type="radio"
                                        name="space"
                                        value="Sheshi Skënderbeu"
                                        checked={selectedSpace === 'Sheshi Skënderbeu'}
                                        onChange={(e) => setSelectedSpace(e.target.value)}
                                        className="absolute opacity-0 w-0 h-0" 
                                    />
                                </div>
                            </div>
                        </label>

                        {/* Option 2: Sheshi Zahir Pajaziti */}
                        <label 
                            className={`group relative flex w-full flex-col items-center cursor-pointer transition-all duration-150 ${
                                selectedSpace === 'Sheshi Zahir Pajaziti'
                                    ? 'opacity-100'
                                    : 'opacity-100 hover:opacity-90'
                            }`}
                        >
                            <div className="relative mb-3 aspect-[1672/941] w-full overflow-hidden rounded-md">
                                <Image
                                    src={image1}
                                    alt="Sheshi Zahir Pajaziti"
                                    fill
                                    className="object-cover"
                                    style={{ borderRadius: '6px' }}
                                    priority={false}
                                />
                            </div>
                            
                            <div className="mb-3 flex w-full items-center justify-center gap-4">
                                <span className="text-[#1d1d1b] font-malkie-slab text-[28px] leading-[2.5] uppercase text-center">
                                    Sheshi &quot;Zahir Pajaziti&quot;
                                </span>
                                <div className="flex shrink-0 items-center justify-center">
                                    <div className={`w-5 h-5 lg:w-6 lg:h-6 border-2 flex items-center justify-center transition-all ${
                                        selectedSpace === 'Sheshi Zahir Pajaziti'
                                            ? 'border-[#F6B817] bg-[#F6B817]'
                                            : 'border-[#F6B817] group-hover:border-[#D93627] bg-transparent'
                                    }`}>
                                        {selectedSpace === 'Sheshi Zahir Pajaziti' && (
                                            <svg className="w-3.5 h-3.5 lg:w-4 lg:h-4 text-[#1d1d1b]" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                            </svg>
                                        )}
                                    </div>
                                    <input
                                        type="radio"
                                        name="space"
                                        value="Sheshi Zahir Pajaziti"
                                        checked={selectedSpace === 'Sheshi Zahir Pajaziti'}
                                        onChange={(e) => setSelectedSpace(e.target.value)}
                                        className="absolute opacity-0 w-0 h-0" 
                                    />
                                </div>
                            </div>
                        </label>
                    </div>
                </div>

                <div className="w-full max-w-[700px] mx-auto mt-4">
                    {loading || compressingFile ? (
                        <div className="w-full py-4 flex items-center justify-center">
                            <LoadingSpinner
                                label={compressingFile ? 'Duke përgatitur dokumentin...' : 'Duke dërguar aplikimin...'}
                                size="md"
                            />
                        </div>
                    ) : (
                        <button
                            type="submit"
                            className="flex w-full items-center justify-center bg-[#848F38] py-4 font-malkie-slab text-[34px] uppercase leading-[1.1] text-white rounded-md transition-colors hover:bg-[#c43b32]"
                        >
                            Dërgo
                        </button>
                    )}
                </div>
                <p className="text-center text-[#031603] text-[12px] font-malkieslab mt-4">© 2025 Prishtina Festive</p>
            </form>
            </div>
            ) : null}

            <div className="w-full pb-8 mt-[50px]">
                <DecorativeBanner src={bannerBottom} alt="Akull n'Verë decorative banner" fullWidth />
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
                                Faleminderit <span className="font-bold text-[#367a3b]">{submittedFullName}</span> që aplikuat për shtëpizë në <span className="font-bold">Akull n&rsquo;Verë</span>.
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
