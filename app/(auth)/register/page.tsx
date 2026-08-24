"use client"

import { useReducer } from "react"
import { useRouter } from "next/navigation"
import { signIn } from "next-auth/react"
import Link from "next/link"
import { Cpu, Coffee, Database, ChevronLeft, ShieldAlert } from "lucide-react"

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

interface RegisterState {
    step: 1 | 2;
    formData: {
        name: string;
        username: string;
        email: string;
        password: string;
        preferredLanguage: "" | "C" | "Java" | "Python" | "DBMS";
    };
    touched: {
        name: boolean;
        username: boolean;
        email: boolean;
        password: boolean;
    };
    validationErrors: {
        name: string;
        username: string;
        email: string;
        password: string;
    };
    isFolderOpen: boolean;
    folderClass: "closed" | "opening" | "open" | "closing";
    selectedLanguage: "" | "C" | "Java" | "Python" | "DBMS";
    loading: boolean;
    apiError: string;
}

type RegisterAction =
    | { type: "SET_STEP"; step: 1 | 2 }
    | { type: "SET_FIELD"; field: "name" | "username" | "email" | "password"; value: string }
    | { type: "BLUR_FIELD"; field: "name" | "username" | "email" | "password"; error: string }
    | { type: "SET_FOLDER_CLASS"; folderClass: "closed" | "opening" | "open" | "closing"; isOpen?: boolean }
    | { type: "SET_SELECTED_LANGUAGE"; language: "" | "C" | "Java" | "Python" | "DBMS" }
    | { type: "SET_LOADING"; loading: boolean }
    | { type: "SET_API_ERROR"; error: string }
    | { type: "SET_VALIDATION_ERROR"; field: "name" | "username" | "email" | "password"; error: string }
    | { type: "ABORT_SELECTION" }
    | { type: "RESET_FORM" };

const initialState: RegisterState = {
    step: 1,
    formData: {
        name: "",
        username: "",
        email: "",
        password: "",
        preferredLanguage: "",
    },
    touched: {
        name: false,
        username: false,
        email: false,
        password: false,
    },
    validationErrors: {
        name: "",
        username: "",
        email: "",
        password: "",
    },
    isFolderOpen: false,
    folderClass: "closed",
    selectedLanguage: "",
    loading: false,
    apiError: "",
};

function registerReducer(state: RegisterState, action: RegisterAction): RegisterState {
    switch (action.type) {
        case "SET_STEP":
            return { ...state, step: action.step };
        case "SET_FIELD":
            return {
                ...state,
                formData: { ...state.formData, [action.field]: action.value },
                validationErrors: { ...state.validationErrors, [action.field]: "" }
            };
        case "BLUR_FIELD":
            return {
                ...state,
                touched: { ...state.touched, [action.field]: true },
                validationErrors: { ...state.validationErrors, [action.field]: action.error }
            };
        case "SET_FOLDER_CLASS":
            return {
                ...state,
                folderClass: action.folderClass,
                ...(action.isOpen !== undefined ? { isFolderOpen: action.isOpen } : {})
            };
        case "SET_SELECTED_LANGUAGE":
            return {
                ...state,
                selectedLanguage: action.language,
                formData: { ...state.formData, preferredLanguage: action.language }
            };
        case "SET_LOADING":
            return { ...state, loading: action.loading };
        case "SET_API_ERROR":
            return { ...state, apiError: action.error };
        case "SET_VALIDATION_ERROR":
            return {
                ...state,
                validationErrors: { ...state.validationErrors, [action.field]: action.error }
            };
        case "ABORT_SELECTION":
            return {
                ...state,
                folderClass: "closing",
                isFolderOpen: false
            };
        case "RESET_FORM":
            return {
                ...state,
                step: 1,
                folderClass: "closed",
                selectedLanguage: "",
                formData: { ...state.formData, preferredLanguage: "" }
            };
        default:
            return state;
    }
}

// 1. Static Styles Component
const RegisterStyles = () => (
    <style dangerouslySetInnerHTML={{
        __html: `
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
    `
    }} />
)

// 2. Intake Form Component (Step 1)
interface AgentIntakeFormProps {
    formData: RegisterState["formData"];
    touched: RegisterState["touched"];
    validationErrors: RegisterState["validationErrors"];
    isStep1Valid: boolean;
    onChange: (field: "name" | "username" | "email" | "password", value: string) => void;
    onBlur: (field: "name" | "username" | "email" | "password") => void;
    onSubmit: () => void;
}

const AgentIntakeForm = ({
    formData,
    touched,
    validationErrors,
    isStep1Valid,
    onChange,
    onBlur,
    onSubmit,
}: AgentIntakeFormProps) => {
    return (
        <div className="bg-[#0D0E12] border border-[#1F261F] rounded-2xl p-8 shadow-2xl relative">
            <div className="mb-6">
                <p className="text-xs text-[#6B6B6B] font-mono uppercase tracking-widest">
                    Classification Level: Unclassified until selection
                </p>
            </div>

            <form
                className="space-y-6"
                action={() => {
                    if (isStep1Valid) onSubmit();
                }}
            >
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
                            onChange={(e) => onChange("name", e.target.value)}
                            onBlur={() => onBlur("name")}
                            placeholder="Enter full real name"
                            className="w-full bg-transparent border-b border-[#1F261F] focus:border-transparent text-[#E2E8F0] py-2 px-1 focus:outline-none font-mono text-sm tracking-wide transition-all"
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
                            onChange={(e) => onChange("username", e.target.value)}
                            onBlur={() => onBlur("username")}
                            placeholder="Akshat_09"
                            className="w-full bg-transparent border-b border-[#1F261F] focus:border-transparent text-[#E2E8F0] py-2 px-1 focus:outline-none font-mono text-sm tracking-wide transition-all"
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
                            onChange={(e) => onChange("email", e.target.value)}
                            onBlur={() => onBlur("email")}
                            placeholder="name@secure-mail.com"
                            className="w-full bg-transparent border-b border-[#1F261F] focus:border-transparent text-[#E2E8F0] py-2 px-1 focus:outline-none font-mono text-sm tracking-wide transition-all"
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
                            onChange={(e) => onChange("password", e.target.value)}
                            onBlur={() => onBlur("password")}
                            placeholder="••••••••"
                            className="w-full bg-transparent border-b border-[#1F261F] focus:border-transparent text-[#E2E8F0] py-2 px-1 focus:outline-none font-mono text-sm tracking-wide transition-all"
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
                                ? "bg-[#C9A84C] hover:bg-[#B5953F] text-[#0D0E12] cursor-pointer shadow-lg shadow-[#C9A84C]/10"
                                : "bg-[#161820] text-[#4A5D4A] cursor-not-allowed border border-[#1F261F]"
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
    )
}

// 3. Dossier Selection Component (Step 2)
interface DossierSelectionProps {
    folderClass: RegisterState["folderClass"];
    isFolderOpen: boolean;
    selectedLanguage: RegisterState["selectedLanguage"];
    loading: boolean;
    apiError: string;
    onFolderClick: () => void;
    onLanguageSelect: (lang: "C" | "Java" | "Python" | "DBMS") => void;
    onAbort: () => void;
}

const DossierSelection = ({
    folderClass,
    isFolderOpen,
    selectedLanguage,
    loading,
    apiError,
    onFolderClick,
    onLanguageSelect,
    onAbort,
}: DossierSelectionProps) => {
    return (
        <div className="space-y-6">
            {/* Control actions bar */}
            <div className="flex justify-between items-center">
                <button
                    type="button"
                    onClick={onAbort}
                    disabled={loading}
                    className="flex items-center gap-1.5 text-xs font-mono text-[#8F9F8F] hover:text-[#E2E8F0] disabled:opacity-40 transition-colors cursor-pointer"
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
                {folderClass === "closed" ? (
                    <button
                        type="button"
                        onClick={onFolderClick}
                        className="dossier-folder relative max-w-sm w-full text-left transition-all duration-300 state-closed closed-pulse"
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
                            <div className="absolute inset-x-0 top-24 bottom-4 flex flex-col items-center justify-center p-6 text-center select-none pointer-events-none">
                                <div className="bg-[#E2E8F0] text-[#0D0E12] text-[10px] font-mono font-bold tracking-widest px-2.5 py-1.5 border border-[#81662B] uppercase mb-2 shadow-sm">
                                    PRIMARY WEAPON — SELECT ONE
                                </div>
                                <p className="text-[9px] font-mono text-[#56441D] tracking-wide uppercase opacity-75">
                                    Click envelope to open file
                                </p>
                            </div>
                        </div>
                    </button>
                ) : (
                    <div
                        className={`dossier-folder relative max-w-sm w-full transition-all duration-300
                            state-${folderClass} open-anim`}
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
                                                        onLanguageSelect(lang.value)
                                                    }}
                                                    className={`dossier-card-item relative aspect-[4/3] flex flex-col justify-between p-3.5 
                                                        text-left border transition-all duration-300 rounded shadow-md group
                                                        bg-[#E2E8F0] border-[#0D0E12] text-[#0D0E12]
                                                        hover:-translate-y-1 hover:shadow-lg hover:shadow-[#C9A84C]/20
                                                        disabled:pointer-events-none
                                                        ${isSelected ? "scale-[0.96] border-[#39D375] border-2 shadow-inner" : ""}
                                                    `}
                                                >
                                                    {isSelected && (
                                                        <div className="absolute inset-0 flex items-center justify-center bg-[#E2E8F0]/80 z-20 transition-all rounded">
                                                            <div className="ink-stamp-selected text-xs">
                                                                SELECTED
                                                            </div>
                                                        </div>
                                                    )}

                                                    <div className="flex justify-between items-start">
                                                        <div className="p-1 rounded bg-[#0D0E12]/5 text-[#0D0E12] group-hover:bg-[#0D0E12]/10 transition-colors">
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
                )}
            </div>

            {loading && (
                <div className="text-center font-mono text-xs text-[#C9A84C] animate-pulse py-2">
                    🕵️ SECURELY TRANSMITTING AGENT PROFILE...
                </div>
            )}
        </div>
    )
}

// 4. Main Component
export default function RegisterPage() {
    const router = useRouter()
    const [state, dispatch] = useReducer(registerReducer, initialState)

    // Inline Validation helpers
    const validateField = (name: "name" | "username" | "email" | "password", value: string) => {
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
        dispatch({ type: "SET_VALIDATION_ERROR", field: name, error })
    }

    const handleBlur = (field: "name" | "username" | "email" | "password") => {
        let error = ""
        const value = state.formData[field]
        if (field === "name") {
            if (!value) error = "Agent Name is required"
            else if (value.trim().length < 2) error = "Name must be at least 2 characters"
        } else if (field === "username") {
            if (!value) error = "Codename is required"
            else if (value.length < 3 || value.length > 20) error = "Codename must be 3-20 characters"
            else if (!/^[a-zA-Z0-9_-]+$/.test(value)) error = "Codename can only contain letters, numbers, underscores, and hyphens"
        } else if (field === "email") {
            if (!value) error = "Email is required"
            else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) error = "Invalid email format"
        } else if (field === "password") {
            if (!value) error = "Password is required"
            else if (value.length < 8) error = "Password must be 8 or more characters"
        }
        dispatch({ type: "BLUR_FIELD", field, error })
    }

    const handleChange = (field: "name" | "username" | "email" | "password", value: string) => {
        dispatch({ type: "SET_FIELD", field, value })
        if (state.touched[field]) {
            validateField(field, value)
        }
    }

    // Check if step 1 is fully valid
    const isStep1Valid =
        state.formData.name.trim().length >= 2 &&
        /^[a-zA-Z0-9_-]{3,20}$/.test(state.formData.username) &&
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(state.formData.email) &&
        state.formData.password.length >= 8 &&
        !state.validationErrors.name &&
        !state.validationErrors.username &&
        !state.validationErrors.email &&
        !state.validationErrors.password

    // Handle Folder Click
    const handleFolderClick = () => {
        if (state.folderClass !== "closed") return // Only interactable if closed
        dispatch({ type: "SET_FOLDER_CLASS", folderClass: "opening" })
        setTimeout(() => {
            dispatch({ type: "SET_FOLDER_CLASS", folderClass: "open", isOpen: true })
        }, 400) // matches transition duration
    }

    // Handle Language Card Click (Submit Sequence)
    const handleLanguageSelect = async (lang: "C" | "Java" | "Python" | "DBMS") => {
        if (state.loading || state.selectedLanguage) return
        dispatch({ type: "SET_SELECTED_LANGUAGE", language: lang })

        // 1. Wait for select animation
        await new Promise(resolve => setTimeout(resolve, 600))

        // 2. Start closing folder
        dispatch({ type: "SET_FOLDER_CLASS", folderClass: "closing", isOpen: false })

        // 3. Wait for close animation
        await new Promise(resolve => setTimeout(resolve, 300))

        // 4. Submit registration
        dispatch({ type: "SET_LOADING", loading: true })
        dispatch({ type: "SET_API_ERROR", error: "" })

        try {
            const res = await fetch("/api/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: state.formData.name,
                    username: state.formData.username,
                    email: state.formData.email,
                    password: state.formData.password,
                    preferredLanguage: lang
                }),
            })

            const data = await res.json()

            if (res.ok) {
                // Auto-login after successful registration
                const signInRes = await signIn("credentials", {
                    email: state.formData.email,
                    password: state.formData.password,
                    redirect: false,
                })

                if (signInRes?.error) {
                    dispatch({ type: "SET_API_ERROR", error: "Registration successful, but automatic sign-in failed. Please log in manually." })
                    dispatch({ type: "SET_SELECTED_LANGUAGE", language: "" })
                    dispatch({ type: "SET_FOLDER_CLASS", folderClass: "closed" })
                } else {
                    router.push("/intro")
                    router.refresh()
                }
            } else {
                if (res.status === 409) {
                    const errText = (data.error || data.message || "").toLowerCase()
                    dispatch({ type: "SET_STEP", step: 1 })
                    if (errText.includes("codename") || errText.includes("username")) {
                        dispatch({ type: "SET_VALIDATION_ERROR", field: "username", error: "Codename already taken. Choose another." })
                        dispatch({ type: "BLUR_FIELD", field: "username", error: "Codename already taken. Choose another." })
                    } else if (errText.includes("email")) {
                        dispatch({ type: "SET_VALIDATION_ERROR", field: "email", error: "User with this email already exists." })
                        dispatch({ type: "BLUR_FIELD", field: "email", error: "User with this email already exists." })
                    } else {
                        dispatch({ type: "SET_API_ERROR", error: data.error || "User already exists." })
                    }
                    dispatch({ type: "SET_SELECTED_LANGUAGE", language: "" })
                    dispatch({ type: "SET_FOLDER_CLASS", folderClass: "closed" })
                } else {
                    dispatch({ type: "SET_API_ERROR", error: data.error || data.message || "Registration failed." })
                    dispatch({ type: "SET_SELECTED_LANGUAGE", language: "" })
                    dispatch({ type: "SET_FOLDER_CLASS", folderClass: "open", isOpen: true })
                }
            }
        } catch {
            dispatch({ type: "SET_API_ERROR", error: "Something went wrong. Please try again." })
            dispatch({ type: "SET_SELECTED_LANGUAGE", language: "" })
            dispatch({ type: "SET_FOLDER_CLASS", folderClass: "open", isOpen: true })
        } finally {
            dispatch({ type: "SET_LOADING", loading: false })
        }
    }

    // Abort button - Step 2 to Step 1
    const handleAbort = () => {
        dispatch({ type: "ABORT_SELECTION" })
        setTimeout(() => {
            dispatch({ type: "RESET_FORM" })
            dispatch({ type: "SET_STEP", step: 1 })
        }, 300)
    }

    return (
        <div className="relative z-10 flex min-h-[calc(100vh-4rem)] flex-col justify-center py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
            <RegisterStyles />

            <div className="mx-auto w-full max-w-md">
                {/* Step indicator top right */}
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold tracking-wider text-[#E2E8F0] font-mono">
                        {state.step === 1 ? "AGENT ENLISTMENT" : "PRIMARY WEAPON SELECTION"}
                    </h2>
                    <div className="flex gap-1.5 text-xs text-[#8F9F8F] font-mono">
                        <span className={state.step === 1 ? "text-[#C9A84C]" : "opacity-40"}>●</span>
                        <span className={state.step === 2 ? "text-[#C9A84C]" : "opacity-40"}>●</span>
                    </div>
                </div>

                {state.step === 1 ? (
                    <AgentIntakeForm
                        formData={state.formData}
                        touched={state.touched}
                        validationErrors={state.validationErrors}
                        isStep1Valid={isStep1Valid}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        onSubmit={() => dispatch({ type: "SET_STEP", step: 2 })}
                    />
                ) : (
                    <DossierSelection
                        folderClass={state.folderClass}
                        isFolderOpen={state.isFolderOpen}
                        selectedLanguage={state.selectedLanguage}
                        loading={state.loading}
                        apiError={state.apiError}
                        onFolderClick={handleFolderClick}
                        onLanguageSelect={handleLanguageSelect}
                        onAbort={handleAbort}
                    />
                )}
            </div>
        </div>
    )
}
