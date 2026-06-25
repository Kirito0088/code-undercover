"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { signIn } from "next-auth/react"
import Link from "next/link"
import { Cpu, Coffee, Database, ChevronLeft, ShieldAlert } from "lucide-react"

// Types
interface RegistrationPayload {
    name: string;
    username: string;
    email: string;
    password: string;
    preferredLanguage: "C" | "Java" | "Python" | "DBMS";
}

const LANGUAGES = [
    { value: "C", label: "C / C++", codename: "PROTOCOL-C", icon: Cpu },
    { value: "Java", label: "Java", codename: "JAVA CIPHER", icon: Coffee },
    {
        value: "Python", label: "Python", codename: "SERPENT SCRIPT", icon: () => (
            <svg className="size-5 text-current" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2H9a4 4 0 0 0-4 4v3a2 2 0 0 1-2 2H2v2h1a2 2 0 0 1 2 2v3a4 4 0 0 0 4 4h3" />
                <path d="M12 22h3a4 4 0 0 0 4-4v-3a2 2 0 0 1 2-2h1v-2h-1a2 2 0 0 1-2-2V6a4 4 0 0 0-4-4h-3" />
            </svg>
        )
    },
    { value: "DBMS", label: "DBMS", codename: "DATA VAULT", icon: Database },
] as const

export default function RegisterPage() {
    const router = useRouter()

    // Form states
    const [step, setStep] = useState<1 | 2>(1)
    const [formData, setFormData] = useState({
        name: "",
        username: "",
        email: "",
        password: "",
        preferredLanguage: "" as "" | "C" | "Java" | "Python" | "DBMS",
    })

    // Validation states
    const [touched, setTouched] = useState({
        name: false,
        username: false,
        email: false,
        password: false,
    })
    const [validationErrors, setValidationErrors] = useState({
        name: "",
        username: "",
        email: "",
        password: "",
    })

    // Folder animation state
    const [isFolderOpen, setIsFolderOpen] = useState(false)
    const [folderClass, setFolderClass] = useState("closed") // "closed" | "opening" | "open" | "closing"
    const [selectedLanguage, setSelectedLanguage] = useState<"" | "C" | "Java" | "Python" | "DBMS">("")

    // API loading / error states
    const [loading, setLoading] = useState(false)
    const [apiError, setApiError] = useState("")

    // Step 1: Inline Validation helpers
    const validateField = (name: string, value: string) => {
        let error = ""
        if (name === "name") {
            if (!value) error = "Agent Name is required"
            else if (value.trim().length < 2) error = "Name must be at least 2 characters"
        } else if (name === "username") {
            if (!value) error = "Codename is required"
            else if (value.length < 3 || value.length > 20) error = "Codename must be 3-20 characters"
            else if (!/^[a-zA-Z0-9_-]+$/.test(value)) error = "Codename can only contain letters, numbers, underscores, and hyphens"
        } else if (name === "email") {
            if (!value) error = "Email is required"
            else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) error = "Invalid email format"
        } else if (name === "password") {
            if (!value) error = "Password is required"
            else if (value.length < 8) error = "Password must be 8 or more characters"
        }
        setValidationErrors(prev => ({ ...prev, [name]: error }))
    }

    const handleBlur = (field: keyof typeof touched) => {
        setTouched(prev => ({ ...prev, [field]: true }))
        validateField(field, formData[field])
    }

    const handleChange = (field: keyof typeof formData, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }))
        if (field !== "preferredLanguage" && touched[field]) {
            validateField(field, value)
        }
    }

    // Check if step 1 is fully valid
    const isStep1Valid =
        formData.name.trim().length >= 2 &&
        /^[a-zA-Z0-9_-]{3,20}$/.test(formData.username) &&
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email) &&
        formData.password.length >= 8 &&
        !validationErrors.name &&
        !validationErrors.username &&
        !validationErrors.email &&
        !validationErrors.password

    // Handle Folder Click
    const handleFolderClick = () => {
        if (folderClass !== "closed") return // Only interactable if closed
        setFolderClass("opening")
        setTimeout(() => {
            setFolderClass("open")
            setIsFolderOpen(true)
        }, 400) // matches transition duration
    }

    // Handle Language Card Click (Submit Sequence)
    const handleLanguageSelect = async (lang: "C" | "Java" | "Python" | "DBMS") => {
        if (loading || selectedLanguage) return
        setSelectedLanguage(lang)
        setFormData(prev => ({ ...prev, preferredLanguage: lang }))

        // 1. Wait for select animation
        await new Promise(resolve => setTimeout(resolve, 600))

        // 2. Start closing folder
        setFolderClass("closing")
        setIsFolderOpen(false)

        // 3. Wait for close animation
        await new Promise(resolve => setTimeout(resolve, 300))

        // 4. Submit registration
        setLoading(true)
        setApiError("")

        try {
            const res = await fetch("/api/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: formData.name,
                    username: formData.username,
                    email: formData.email,
                    password: formData.password,
                    preferredLanguage: lang
                }),
            })

            const data = await res.json()

            if (res.ok) {
                // Auto-login after successful registration
                const signInRes = await signIn("credentials", {
                    email: formData.email,
                    password: formData.password,
                    redirect: false,
                })

                if (signInRes?.error) {
                    setApiError("Registration successful, but automatic sign-in failed. Please log in manually.")
                    setSelectedLanguage("")
                    setFolderClass("closed")
                } else {
                    router.push("/intro")
                    router.refresh()
                }
            } else {
                if (res.status === 409 && data.error?.includes("Codename")) {
                    // Duplicate username error
                    setStep(1)
                    setValidationErrors(prev => ({
                        ...prev,
                        username: "Codename already taken. Choose another."
                    }))
                    setTouched(prev => ({ ...prev, username: true }))
                    setSelectedLanguage("")
                    setFolderClass("closed")
                } else {
                    setApiError(data.error || data.message || "Registration failed.")
                    setSelectedLanguage("")
                    setFolderClass("open")
                    setIsFolderOpen(true)
                }
            }
        } catch {
            setApiError("Something went wrong. Please try again.")
            setSelectedLanguage("")
            setFolderClass("open")
            setIsFolderOpen(true)
        } finally {
            setLoading(false)
        }
    }

    // Abort button - Step 2 to Step 1
    const handleAbort = () => {
        setFolderClass("closing")
        setIsFolderOpen(false)
        setTimeout(() => {
            setStep(1)
            setSelectedLanguage("")
            setFolderClass("closed")
        }, 300)
    }

    return (
        <div className="relative z-10 flex min-h-[calc(100vh-4rem)] flex-col justify-center py-8 sm:py-12 px-4 sm:px-6 lg:px-8">

            {/* Custom Styles Injection */}
            <style jsx global>{`
                /* Center-out expanding underline on focus */
                .input-wrapper {
                    position: relative;
                    width: 100%;
                }
                
                .input-underline {
                    position: absolute;
                    bottom: 0;
                    left: 50%;
                    width: 0;
                    height: 2px;
                    background-color: #39D375;
                    transform: translateX(-50%);
                    transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    z-index: 10;
                    pointer-events: none;
                }
                
                input:focus ~ .input-underline {
                    width: 100%;
                }

                /* Perspective setup for 3D dossier folder */
                .folder-perspective {
                    perspective: 1000px;
                }
                
                .dossier-folder {
                    position: relative;
                    width: 100%;
                    background-color: #927533; /* Darker bottom shadow color */
                    border-radius: 8px;
                    transition: all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
                    cursor: pointer;
                    overflow: visible;
                }
                
                /* Pulse glow on closed folder */
                .dossier-folder.closed-pulse {
                    box-shadow: 0 0 15px rgba(201, 168, 76, 0.2);
                    animation: folderPulse 2s ease-in-out infinite;
                }
                
                @keyframes folderPulse {
                    0%, 100% { box-shadow: 0 0 12px rgba(201, 168, 76, 0.2); transform: scale(1); }
                    50% { box-shadow: 0 0 25px rgba(201, 168, 76, 0.55); transform: scale(1.005); }
                }

                /* Flap 3D rotation */
                .dossier-flap {
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    height: 95px;
                    background-color: #C9A84C;
                    border-bottom: 3px solid #81662B;
                    border-top-left-radius: 8px;
                    border-top-right-radius: 8px;
                    transform-origin: top center;
                    transition: transform 0.35s cubic-bezier(0.4, 0, 0.2, 1);
                    z-index: 20;
                    background-image: repeating-linear-gradient(45deg, rgba(0,0,0,0.015) 0px, rgba(0,0,0,0.015) 2px, transparent 2px, transparent 4px);
                    box-shadow: 0 4px 6px rgba(0,0,0,0.15);
                }

                .dossier-folder.open-anim .dossier-flap {
                    transform: rotateX(-160deg);
                    box-shadow: 0 -4px 6px rgba(0,0,0,0.1);
                }

                /* Inner folder contents wrapper */
                .dossier-body {
                    position: relative;
                    width: 100%;
                    background-color: #C9A84C;
                    border-bottom-left-radius: 8px;
                    border-bottom-right-radius: 8px;
                    z-index: 10;
                    transition: all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
                    background-image: repeating-linear-gradient(0deg, rgba(0,0,0,0.01) 0px, rgba(0,0,0,0.01) 1px, transparent 1px, transparent 2px);
                    box-shadow: inset 0 3px 6px rgba(0,0,0,0.1);
                }

                /* Height expansion transition */
                .dossier-folder.state-closed {
                    height: 180px;
                }
                .dossier-folder.state-opening, 
                .dossier-folder.state-open {
                    height: 490px;
                }
                .dossier-folder.state-closing {
                    height: 180px;
                }

                /* Dossier language card transitions */
                .dossier-card-item {
                    opacity: 0;
                    transform: translateY(40px);
                    transition: all 0.35s cubic-bezier(0.25, 0.8, 0.25, 1);
                }

                .dossier-folder.state-open .dossier-card-item {
                    opacity: 1;
                    transform: translateY(0);
                }

                /* Staggered card entry times */
                .dossier-folder.state-open .dossier-card-item:nth-child(1) { transition-delay: 200ms; }
                .dossier-folder.state-open .dossier-card-item:nth-child(2) { transition-delay: 250ms; }
                .dossier-folder.state-open .dossier-card-item:nth-child(3) { transition-delay: 300ms; }
                .dossier-folder.state-open .dossier-card-item:nth-child(4) { transition-delay: 350ms; }

                /* Ink Stamp Design */
                .ink-stamp {
                    border: 3px double #C0392B;
                    color: #C0392B;
                    font-family: monospace;
                    font-weight: 800;
                    letter-spacing: 2px;
                    padding: 3px 10px;
                    transform: rotate(-12deg);
                    pointer-events: none;
                }

                .ink-stamp-selected {
                    border: 4px double #39D375;
                    color: #39D375;
                    font-family: monospace;
                    font-weight: bold;
                    letter-spacing: 2px;
                    padding: 6px 12px;
                    transform: rotate(-10deg) scale(1.1);
                    text-shadow: 1px 1px 0px rgba(0,0,0,0.05);
                    box-shadow: 0 0 5px rgba(57, 211, 117, 0.2);
                }
            `}</style>

            <div className="mx-auto w-full max-w-md">
                {/* Step indicator top right */}
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold tracking-wider text-[#F1F1F5] font-mono">
                        {step === 1 ? "AGENT ENLISTMENT" : "PRIMARY WEAPON SELECTION"}
                    </h2>
                    <div className="flex gap-1.5 text-xs text-[#8B8BA7] font-mono">
                        <span className={step === 1 ? "text-[#C9A84C]" : "opacity-40"}>●</span>
                        <span className={step === 2 ? "text-[#C9A84C]" : "opacity-40"}>●</span>
                    </div>
                </div>

                {step === 1 ? (
                    /* Step 1 — Agent Intake Form */
                    <div className="bg-[#1A1A1A] border border-[#323242] rounded-2xl p-8 shadow-2xl relative">
                        <div className="mb-6">
                            <p className="text-xs text-[#6B6B6B] font-mono uppercase tracking-widest">
                                Classification Level: Unclassified until selection
                            </p>
                        </div>

                        <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); if (isStep1Valid) setStep(2); }}>
                            <div>
                                <label htmlFor="name" className="block text-xs font-mono text-[#6B6B6B] tracking-wider uppercase mb-1">
                                    Agent Name
                                </label>
                                <div className="input-wrapper">
                                    <input
                                        id="name"
                                        name="name"
                                        type="text"
                                        required
                                        value={formData.name}
                                        onChange={(e) => handleChange("name", e.target.value)}
                                        onBlur={() => handleBlur("name")}
                                        placeholder="Enter full real name"
                                        className="w-full bg-transparent border-b border-[#323242] focus:border-transparent text-[#E8E0D0] py-2 px-1 focus:outline-none font-mono text-sm tracking-wide transition-all"
                                    />
                                    <span className="input-underline" />
                                </div>
                                {touched.name && validationErrors.name && (
                                    <p className="mt-1.5 text-[11px] text-[#C9A84C] font-mono tracking-wide">
                                        ⚠️ {validationErrors.name}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label htmlFor="username" className="block text-xs font-mono text-[#6B6B6B] tracking-wider uppercase mb-1">
                                    Codename
                                </label>
                                <div className="input-wrapper">
                                    <input
                                        id="username"
                                        name="username"
                                        type="text"
                                        required
                                        value={formData.username}
                                        onChange={(e) => handleChange("username", e.target.value)}
                                        onBlur={() => handleBlur("username")}
                                        placeholder="Akshat_09"
                                        className="w-full bg-transparent border-b border-[#323242] focus:border-transparent text-[#E8E0D0] py-2 px-1 focus:outline-none font-mono text-sm tracking-wide transition-all"
                                    />
                                    <span className="input-underline" />
                                </div>
                                {touched.username && validationErrors.username && (
                                    <p className="mt-1.5 text-[11px] text-[#C9A84C] font-mono tracking-wide">
                                        ⚠️ {validationErrors.username}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label htmlFor="email" className="block text-xs font-mono text-[#6B6B6B] tracking-wider uppercase mb-1">
                                    E-Mail
                                </label>
                                <div className="input-wrapper">
                                    <input
                                        id="email"
                                        name="email"
                                        type="email"
                                        required
                                        value={formData.email}
                                        onChange={(e) => handleChange("email", e.target.value)}
                                        onBlur={() => handleBlur("email")}
                                        placeholder="name@secure-mail.com"
                                        className="w-full bg-transparent border-b border-[#323242] focus:border-transparent text-[#E8E0D0] py-2 px-1 focus:outline-none font-mono text-sm tracking-wide transition-all"
                                    />
                                    <span className="input-underline" />
                                </div>
                                {touched.email && validationErrors.email && (
                                    <p className="mt-1.5 text-[11px] text-[#C9A84C] font-mono tracking-wide">
                                        ⚠️ {validationErrors.email}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label htmlFor="password" className="block text-xs font-mono text-[#6B6B6B] tracking-wider uppercase mb-1">
                                    Access Key
                                </label>
                                <div className="input-wrapper">
                                    <input
                                        id="password"
                                        name="password"
                                        type="password"
                                        required
                                        value={formData.password}
                                        onChange={(e) => handleChange("password", e.target.value)}
                                        onBlur={() => handleBlur("password")}
                                        placeholder="••••••••"
                                        className="w-full bg-transparent border-b border-[#323242] focus:border-transparent text-[#E8E0D0] py-2 px-1 focus:outline-none font-mono text-sm tracking-wide transition-all"
                                    />
                                    <span className="input-underline" />
                                </div>
                                {touched.password && validationErrors.password && (
                                    <p className="mt-1.5 text-[11px] text-[#C9A84C] font-mono tracking-wide">
                                        ⚠️ {validationErrors.password}
                                    </p>
                                )}
                            </div>

                            <div className="pt-2">
                                <button
                                    type="submit"
                                    disabled={!isStep1Valid}
                                    className={`w-full py-3 px-4 rounded-md font-mono text-sm font-bold uppercase tracking-wider transition-all duration-300
                                        ${isStep1Valid
                                            ? "bg-[#C9A84C] hover:bg-[#B5953F] text-[#1A1A1A] cursor-pointer shadow-lg shadow-[#C9A84C]/10"
                                            : "bg-[#2A2A35] text-[#5C5C7A] cursor-not-allowed border border-[#323242]"
                                        }`}
                                >
                                    PROCEED TO LANGUAGE SELECTION
                                </button>
                            </div>
                        </form>

                        <div className="mt-6 text-center text-xs font-mono text-[#6B6B6B]">
                            Already enlisted?{" "}
                            <Link href="/login" className="font-bold text-[#C9A84C] hover:underline transition-colors">
                                Log in
                            </Link>
                        </div>
                    </div>
                ) : (
                    /* Step 2 — Classified Dossier Selection */
                    <div className="space-y-6">
                        {/* Control actions bar */}
                        <div className="flex justify-between items-center">
                            <button
                                type="button"
                                onClick={handleAbort}
                                disabled={loading}
                                className="flex items-center gap-1.5 text-xs font-mono text-[#8B8BA7] hover:text-[#E8E0D0] disabled:opacity-40 transition-colors cursor-pointer"
                            >
                                <ChevronLeft className="size-4" />
                                ABORT
                            </button>
                            <span className="text-[11px] font-mono text-[#6B6B6B]">
                                SECURITY SECURITY SECURITY
                            </span>
                        </div>

                        {apiError && (
                            <div className="flex items-start gap-2.5 rounded-lg bg-red-950/40 border border-red-800/40 p-3.5 text-xs text-red-400 font-mono">
                                <ShieldAlert className="size-4 mt-0.5 flex-shrink-0" />
                                <span>{apiError}</span>
                            </div>
                        )}

                        {/* Dossier Card component */}
                        <div className="folder-perspective flex justify-center py-4 w-full">
                            <div
                                onClick={handleFolderClick}
                                className={`dossier-folder relative max-w-sm w-full transition-all duration-300
                                    dossier-folder state-${folderClass} 
                                    ${folderClass === "closed" ? "closed-pulse" : ""} 
                                    ${folderClass !== "closed" ? "open-anim" : ""}`}
                            >
                                {/* Flap (covers the top in closed state, rotates back in open state) */}
                                <div className="dossier-flap flex items-center justify-between px-6 z-20">
                                    <span className="text-[10px] font-mono font-bold tracking-widest text-[#56441D]">
                                        CU DIVISION
                                    </span>
                                    <div className="ink-stamp text-xs scale-90">
                                        CLASSIFIED
                                    </div>
                                </div>

                                {/* Body pocket of the dossier */}
                                <div className="dossier-body absolute bottom-0 left-0 right-0 h-[calc(100%-12px)] flex flex-col justify-end p-5 pb-8 z-10">

                                    {/* Closed state cover details */}
                                    {!isFolderOpen && (
                                        <div className="absolute inset-x-0 top-24 bottom-4 flex flex-col items-center justify-center p-6 text-center select-none pointer-events-none">
                                            <div className="bg-[#E8E0D0] text-[#1A1A1A] text-[10px] font-mono font-bold tracking-widest px-2.5 py-1.5 border border-[#81662B] uppercase mb-2 shadow-sm">
                                                PRIMARY WEAPON — SELECT ONE
                                            </div>
                                            <p className="text-[9px] font-mono text-[#56441D] tracking-wide uppercase opacity-75">
                                                Click envelope to open file
                                            </p>
                                        </div>
                                    )}

                                    {/* Open state inner contents - 2x2 grid of languages */}
                                    {isFolderOpen && (
                                        <div className="w-full h-[calc(100%-80px)] flex flex-col justify-between">
                                            <div className="mb-2.5 pb-2 border-b border-[#81662B]/35 flex justify-between items-center">
                                                <span className="text-[10px] font-mono font-bold text-[#56441D] tracking-wider">
                                                    SELECT PATH:
                                                </span>
                                                <span className="text-[9px] font-mono text-[#56441D] opacity-75">
                                                    CHOOSE CODENAME TO SUBMIT
                                                </span>
                                            </div>

                                            <div className="grid grid-cols-2 gap-3 flex-1 items-center">
                                                {LANGUAGES.map((lang) => {
                                                    const IconComponent = lang.icon
                                                    const isSelected = selectedLanguage === lang.value
                                                    return (
                                                        <button
                                                            key={lang.value}
                                                            type="button"
                                                            disabled={loading || !!selectedLanguage}
                                                            onClick={(e) => {
                                                                e.stopPropagation()
                                                                handleLanguageSelect(lang.value)
                                                            }}
                                                            className={`dossier-card-item relative aspect-[4/3] flex flex-col justify-between p-3.5 
                                                                text-left border transition-all duration-300 rounded shadow-md group
                                                                bg-[#E8E0D0] border-[#1A1A1A] text-[#1A1A1A]
                                                                hover:-translate-y-1 hover:shadow-lg hover:shadow-[#C9A84C]/20
                                                                disabled:pointer-events-none
                                                                ${isSelected ? "scale-[0.96] border-[#39D375] border-2 shadow-inner" : ""}
                                                            `}
                                                        >
                                                            {isSelected && (
                                                                <div className="absolute inset-0 flex items-center justify-center bg-[#E8E0D0]/80 z-20 transition-all rounded">
                                                                    <div className="ink-stamp-selected text-xs">
                                                                        SELECTED
                                                                    </div>
                                                                </div>
                                                            )}

                                                            <div className="flex justify-between items-start">
                                                                <div className="p-1 rounded bg-[#1A1A1A]/5 text-[#1A1A1A] group-hover:bg-[#1A1A1A]/10 transition-colors">
                                                                    <IconComponent className="size-5" />
                                                                </div>
                                                                <span className="text-[9px] font-mono text-[#6B6B6B] tracking-wider uppercase font-bold">
                                                                    FILE #{lang.value}
                                                                </span>
                                                            </div>

                                                            <div>
                                                                <h4 className="text-sm font-mono font-black tracking-tight leading-none mb-0.5">
                                                                    {lang.label}
                                                                </h4>
                                                                <p className="text-[8px] font-mono tracking-wider font-bold text-[#6B6B6B] uppercase leading-none">
                                                                    {lang.codename}
                                                                </p>
                                                            </div>
                                                        </button>
                                                    )
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {loading && (
                            <div className="text-center font-mono text-xs text-[#C9A84C] animate-pulse py-2">
                                🕵️ SECURELY TRANSMITTING AGENT PROFILE...
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}
