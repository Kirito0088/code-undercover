"use client"

import React, { useReducer, useEffect, useRef } from "react"
import Image from "next/image"
import { Shield, CreditCard, User as UserIcon, ArrowLeft, AlertTriangle, CheckCircle, Loader, Check } from "lucide-react"
import Link from "next/link"
import { signOut } from "next-auth/react"
import { calculateAgentRank, getRankBadgeStyles } from "@/lib/aura"
import { AVATAR_OPTIONS } from "@/lib/avatars"
import { ThemeToggle } from "@/components/theme-toggle"
import { SubscriptionTab } from "./SubscriptionTab"

interface ProfileClientProps {
  user: {
    id: string
    name: string | null
    email: string | null
    username: string | null
    image: string | null
    auraPoints: number
    auraLevel: number
  }
}

function getStoredBio() {
  if (typeof window === 'undefined') return ''
  return localStorage.getItem('cu_bio') ?? ''
}

interface ProfileState {
  activeTab: 'profile' | 'subscription';
  form: {
    name: string;
    email: string;
    username: string;
    image: string;
    bio: string;
  };
  saving: boolean;
  saveStatus: 'idle' | 'success' | 'error';
  errorMessage: string;
  deleteModal: boolean;
  deleting: boolean;
}

type ProfileAction =
  | { type: 'SET_TAB'; tab: 'profile' | 'subscription' }
  | { type: 'SET_FIELD'; field: 'name' | 'email' | 'username' | 'image' | 'bio'; value: string }
  | { type: 'SET_SAVING'; saving: boolean }
  | { type: 'SET_SAVE_STATUS'; status: 'idle' | 'success' | 'error'; errorMessage?: string }
  | { type: 'SET_DELETE_MODAL'; open: boolean }
  | { type: 'SET_DELETING'; deleting: boolean };

function profileReducer(state: ProfileState, action: ProfileAction): ProfileState {
  switch (action.type) {
    case 'SET_TAB':
      return { ...state, activeTab: action.tab };
    case 'SET_FIELD':
      return {
        ...state,
        form: { ...state.form, [action.field]: action.value }
      };
    case 'SET_SAVING':
      return { ...state, saving: action.saving };
    case 'SET_SAVE_STATUS':
      return {
        ...state,
        saveStatus: action.status,
        errorMessage: action.errorMessage ?? ''
      };
    case 'SET_DELETE_MODAL':
      return { ...state, deleteModal: action.open };
    case 'SET_DELETING':
      return { ...state, deleting: action.deleting };
    default:
      return state;
  }
}

// 1. Delete Account Modal Component
interface DeleteModalProps {
  isOpen: boolean;
  deleting: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

const DeleteAccountModal = ({ isOpen, deleting, onClose, onConfirm }: DeleteModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-md bg-surface border border-border rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden transform animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 space-y-4">
          <div className="size-12 rounded-full bg-red-500/10 flex items-center justify-center border border-red-500/30 text-red-500">
            <AlertTriangle className="size-6 animate-pulse" />
          </div>

          <div className="space-y-2">
            <h3 className="text-lg font-black text-text tracking-tight">Destroy Operative Record?</h3>
            <p className="text-xs text-muted leading-relaxed">
              This action is permanent and completely irreversible. All your completed C challenges, sandbox codes, leaderboard rank points, and session keys will be wiped.
            </p>
          </div>
        </div>

        <div className="bg-bg px-6 py-4 flex justify-end gap-3 border-t border-border">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-bold text-muted hover:text-text hover:bg-surface/60 transition-all border border-border"
          >
            Cancel Deletion
          </button>

          <button
            type="button"
            disabled={deleting}
            onClick={onConfirm}
            className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 border border-red-500 disabled:opacity-50 text-white text-xs font-black transition-all flex items-center gap-1.5"
          >
            {deleting ? (
              <>
                <Loader className="size-3 animate-spin" />
                Deleting Account&hellip;
              </>
            ) : (
              "Confirm Delete"
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

// 2. Danger Zone Component
interface DangerZoneProps {
  onOpenDelete: () => void;
}

const DangerZone = ({ onOpenDelete }: DangerZoneProps) => {
  return (
    <div className="border-t border-border pt-8 mt-4">
      <div className="flex items-center gap-2 text-red-500/90 font-bold text-sm uppercase tracking-wider mb-4">
        <AlertTriangle className="size-4" />
        Danger Zone
      </div>

      <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="max-w-md">
          <h4 className="text-sm font-bold text-text">Delete Account</h4>
          <p className="text-xs text-muted mt-1">Once you delete your account, all field records, achievements, and completed missions will be permanently destroyed. There is no going back.</p>
        </div>

        <button
          type="button"
          onClick={onOpenDelete}
          className="px-5 py-2.5 rounded-lg border border-red-500/30 text-red-400 hover:text-red-300 hover:bg-red-500/10 font-semibold text-xs tracking-wider transition-all whitespace-nowrap self-start sm:self-center"
        >
          Delete Account
        </button>
      </div>
    </div>
  )
}

// 3. Profile Sidebar Component
interface ProfileSidebarProps {
  name: string
  email: string
  image: string
  activeTab: 'profile' | 'subscription'
  auraLevel: number
  agentRank: string
  rankStyles: { colorText: string; shadow: string }
  onTabChange: (tab: 'profile' | 'subscription') => void
}

const ProfileSidebar = ({
  name,
  email,
  image,
  activeTab,
  auraLevel,
  agentRank,
  rankStyles,
  onTabChange,
}: ProfileSidebarProps) => {
  return (
    <aside className="w-full md:w-80 border-r border-border p-6 flex flex-col bg-bg/30">
      {/* Identity Card Block */}
      <div className="text-center p-6 rounded-xl border border-border bg-bg/50 relative overflow-hidden mb-6">
        <div className="absolute top-0 inset-x-0 h-1 bg-accent"></div>

        {/* Circular Avatar */}
        <div className="size-20 mx-auto rounded-full bg-accent/10 flex items-center justify-center border-2 border-accent/30 overflow-hidden mb-4 relative shadow-lg">
          {image ? (
            <Image src={image} alt={name || "Agent"} fill sizes="80px" className="object-cover" />
          ) : (
            <Shield className="size-10 text-accent" />
          )}
        </div>

        <h2 className="text-lg font-bold text-text truncate tracking-tight">{name || "Agent"}</h2>
        <p className="text-xs text-muted truncate mb-3">{email}</p>

        {/* Aura Rank Pill */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface border border-border text-xs font-semibold">
          <span className={`uppercase tracking-wider ${rankStyles.colorText} ${rankStyles.shadow}`}>
            {agentRank}
          </span>
          <span className="text-muted">•</span>
          <span className="text-muted">Lvl {auraLevel}</span>
        </div>
      </div>

      {/* Sidebar Navigation */}
      <nav className="flex-1 space-y-1 mb-8">
        <div className="text-[10px] font-semibold text-muted uppercase tracking-widest px-3 mb-2">Account Settings</div>
        <button
          type="button"
          onClick={() => onTabChange('profile')}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all text-left ${activeTab === 'profile'
              ? 'bg-accent/10 border border-accent/30 text-accent'
              : 'text-muted hover:text-text hover:bg-surface/40 border border-transparent'
            }`}
        >
          <UserIcon className="size-4" />
          Profile Information
        </button>

        <button
          type="button"
          onClick={() => onTabChange('subscription')}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all text-left ${activeTab === 'subscription'
              ? 'bg-accent/10 border border-accent/30 text-accent'
              : 'text-muted hover:text-text hover:bg-surface/40 border border-transparent'
            }`}
        >
          <CreditCard className="size-4" />
          Subscription Plan
        </button>
      </nav>
    </aside>
  )
}

// 4. Profile Info Tab Component
interface ProfileInfoTabProps {
  form: {
    name: string
    email: string
    username: string
    image: string
    bio: string
  }
  saving: boolean
  saveStatus: 'idle' | 'success' | 'error'
  errorMessage: string
  onFieldChange: (field: 'name' | 'email' | 'username' | 'image' | 'bio', value: string) => void
  onSubmit: (e: React.FormEvent) => void
  onOpenDelete: () => void
}

const ProfileInfoTab = ({
  form,
  saving,
  saveStatus,
  errorMessage,
  onFieldChange,
  onSubmit,
  onOpenDelete
}: ProfileInfoTabProps) => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-text tracking-tight">Profile Information</h1>
        <p className="text-sm text-muted mt-1">Manage your undercover identity credentials and field bio.</p>
      </div>

      <form onSubmit={onSubmit} className="space-y-5">
        {/* Avatar picker */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-muted uppercase tracking-wider">Avatar</label>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              title="No avatar (use initials)"
              onClick={() => onFieldChange('image', '')}
              className={`relative size-14 rounded-xl overflow-hidden border-2 flex items-center justify-center bg-bg text-[10px] font-semibold text-muted uppercase transition-all ${
                form.image === '' ? 'border-accent' : 'border-border hover:border-accent/40'
              }`}
            >
              None
              {form.image === '' && (
                <span className="absolute -top-1 -right-1 size-4 rounded-full bg-accent flex items-center justify-center">
                  <Check className="size-2.5 text-accent-fg" />
                </span>
              )}
            </button>
            {AVATAR_OPTIONS.map((option) => (
              <button
                key={option.path}
                type="button"
                title={option.label}
                onClick={() => onFieldChange('image', option.path)}
                className={`relative size-14 rounded-xl overflow-hidden border-2 transition-all ${
                  form.image === option.path ? 'border-accent' : 'border-border hover:border-accent/40'
                }`}
              >
                <Image src={option.path} alt={option.label} fill sizes="56px" className="object-cover" />
                {form.image === option.path && (
                  <span className="absolute -top-1 -right-1 size-4 rounded-full bg-accent flex items-center justify-center">
                    <Check className="size-2.5 text-accent-fg" />
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Full Name field */}
        <div className="space-y-2">
          <label id="name-label" htmlFor="name" className="text-xs font-semibold text-muted uppercase tracking-wider">Full Name</label>
          <input
            type="text"
            id="name"
            name="name"
            autoComplete="name"
            aria-labelledby="name-label"
            maxLength={50}
            required
            className="w-full px-4 py-3 rounded-xl bg-bg border border-border text-text text-sm focus:outline-none focus:border-accent transition-all font-medium"
            placeholder="Agent Name"
            value={form.name}
            onChange={(e) => onFieldChange('name', e.target.value)}
          />
        </div>

        {/* Codename / username field */}
        <div className="space-y-2">
          <label id="username-label" htmlFor="username" className="text-xs font-semibold text-muted uppercase tracking-wider">Codename</label>
          <div className="relative">
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted text-sm font-medium">@</span>
            <input
              type="text"
              id="username"
              name="username"
              autoComplete="off"
              aria-labelledby="username-label"
              minLength={3}
              maxLength={20}
              pattern="[a-zA-Z0-9_-]+"
              className="w-full pl-8 pr-4 py-3 rounded-xl bg-bg border border-border text-text text-sm focus:outline-none focus:border-accent transition-all font-medium"
              placeholder="agent_foxtrot"
              value={form.username}
              onChange={(e) => onFieldChange('username', e.target.value)}
            />
          </div>
          <p className="text-[11px] text-muted">3–20 characters: letters, numbers, underscores, and hyphens. Shown publicly on the leaderboard.</p>
        </div>

        {/* Email address field */}
        <div className="space-y-2">
          <label id="email-label" htmlFor="email" className="text-xs font-semibold text-muted uppercase tracking-wider">Email Address</label>
          <input
            type="email"
            id="email"
            name="email"
            autoComplete="email"
            aria-labelledby="email-label"
            required
            className="w-full px-4 py-3 rounded-xl bg-bg border border-border text-text text-sm focus:outline-none focus:border-accent transition-all font-medium"
            placeholder="zero@undercover.net"
            value={form.email}
            onChange={(e) => onFieldChange('email', e.target.value)}
          />
          <p className="text-[11px] text-muted">Changing your email address will directly change your system login credentials.</p>
        </div>

        {/* Bio Text Area */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label id="bio-label" htmlFor="bio" className="text-xs font-semibold text-muted uppercase tracking-wider">Bio</label>
            <span className={`text-[10px] ${form.bio.length > 180 ? 'text-amber-500 font-semibold' : 'text-muted'}`}>
              {form.bio.length} / 200
            </span>
          </div>
          <textarea
            id="bio"
            aria-labelledby="bio-label"
            maxLength={200}
            rows={4}
            className="w-full px-4 py-3 rounded-xl bg-bg border border-border text-text text-sm focus:outline-none focus:border-accent transition-all font-medium resize-none"
            placeholder="Specializing in encrypted network infiltrations and data extractions..."
            value={form.bio}
            onChange={(e) => onFieldChange('bio', e.target.value)}
          />
        </div>

        {/* Save Button & Feedback line */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-3 rounded-xl bg-accent hover:opacity-90 disabled:opacity-50 text-accent-fg font-bold text-sm transition-all flex items-center justify-center gap-2"
          >
            {saving ? (
              <>
                <Loader className="size-4 animate-spin text-accent-fg" />
                Saving Settings&hellip;
              </>
            ) : (
              "Save Changes"
            )}
          </button>

          {/* Inline feedback lines */}
          {saveStatus === 'success' && (
            <div className="flex items-center gap-2 text-xs font-bold text-accent animate-in fade-in slide-in-from-left-2 duration-200">
              <CheckCircle className="size-4" />
              Changes saved successfully.
            </div>
          )}

          {saveStatus === 'error' && (
            <div className="flex items-center gap-2 text-xs font-bold text-red-400 animate-in fade-in slide-in-from-left-2 duration-200">
              <AlertTriangle className="size-4" />
              {errorMessage || 'Failed to save changes.'}
            </div>
          )}
        </div>
      </form>

      {/* DANGER ZONE BLOCK */}
      <DangerZone onOpenDelete={onOpenDelete} />
    </div>
  )
}

// 5. Main ProfileClient Component
export function ProfileClient({ user }: ProfileClientProps) {
  const [state, dispatch] = useReducer(profileReducer, {
    activeTab: 'profile',
    form: {
      name: user.name ?? '',
      email: user.email ?? '',
      username: user.username ?? '',
      image: user.image ?? '',
      bio: getStoredBio(),
    },
    saving: false,
    saveStatus: 'idle',
    errorMessage: '',
    deleteModal: false,
    deleting: false,
  })

  const saveStatusTimeoutsRef = useRef<Set<ReturnType<typeof setTimeout>> | null>(null)
  if (saveStatusTimeoutsRef.current === null) {
    saveStatusTimeoutsRef.current = new Set()
  }
  const saveStatusTimeouts = saveStatusTimeoutsRef.current

  useEffect(() => {
    return () => {
      for (const timeout of saveStatusTimeouts) {
        clearTimeout(timeout)
      }
      saveStatusTimeouts.clear()
    }
  }, [saveStatusTimeouts])

  const clearSaveStatusTimeouts = () => {
    for (const timeout of saveStatusTimeouts) {
      clearTimeout(timeout)
    }
    saveStatusTimeouts.clear()
  }

  // Escape key listener for the modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        dispatch({ type: 'SET_DELETE_MODAL', open: false })
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Save changes handler
  const handleSaveChanges = async (e: React.FormEvent) => {
    e.preventDefault()
    dispatch({ type: 'SET_SAVING', saving: true })
    dispatch({ type: 'SET_SAVE_STATUS', status: 'idle' })

    try {
      const response = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: state.form.name,
          email: state.form.email,
          // Username is optional — omit when blank so the API doesn't treat
          // "hasn't set one yet" as an invalid (too-short) value.
          ...(state.form.username.trim() ? { username: state.form.username.trim() } : {}),
          // Unlike username, "" is a valid image value (clears the avatar),
          // so always send it rather than omitting when blank.
          image: state.form.image,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update profile settings')
      }

      localStorage.setItem('cu_bio', state.form.bio)
      dispatch({ type: 'SET_SAVE_STATUS', status: 'success' })

      clearSaveStatusTimeouts()
      const saveStatusTimeout = setTimeout(() => {
        dispatch({ type: 'SET_SAVE_STATUS', status: 'idle' })
        saveStatusTimeouts.delete(saveStatusTimeout)
      }, 3000)
      saveStatusTimeouts.add(saveStatusTimeout)
    } catch (err: unknown) {
      console.error(err)
      const errorObj = err as { message?: string }
      dispatch({ type: 'SET_SAVE_STATUS', status: 'error', errorMessage: errorObj.message || 'Something went wrong' })
    } finally {
      dispatch({ type: 'SET_SAVING', saving: false })
    }
  }

  // Account deletion handler
  const handleDeleteAccount = async () => {
    dispatch({ type: 'SET_DELETING', deleting: true })

    try {
      const response = await fetch('/api/profile', {
        method: 'DELETE',
      })

      if (response.ok) {
        await signOut({ callbackUrl: '/login' })
      } else {
        const data = await response.json().catch(() => ({}))
        console.error('Failed to delete account:', data.error || 'Server error')
      }
    } catch (err) {
      console.error('Failed to delete account:', err)
    } finally {
      dispatch({ type: 'SET_DELETING', deleting: false })
      dispatch({ type: 'SET_DELETE_MODAL', open: false })
    }
  }

  const agentRank = calculateAgentRank(user.auraPoints)
  const rankStyles = getRankBadgeStyles(agentRank)

  return (
    <div className="min-h-screen bg-bg text-text py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Page header: back link + theme toggle */}
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-sm text-muted hover:text-text transition-colors group"
          >
            <ArrowLeft className="size-4 group-hover:-translate-x-1 transition-transform" />
            Back to Dashboard
          </Link>
          <ThemeToggle />
        </div>

        {/* Outer Shell Card */}
        <div className="bg-surface border border-border rounded-2xl overflow-hidden shadow-2xl backdrop-blur-md flex flex-col md:flex-row min-h-[680px]">

          <ProfileSidebar
            name={state.form.name}
            email={state.form.email}
            image={state.form.image}
            activeTab={state.activeTab}
            auraLevel={user.auraLevel}
            agentRank={agentRank}
            rankStyles={rankStyles}
            onTabChange={(tab) => dispatch({ type: 'SET_TAB', tab })}
          />

          {/* RIGHT PANEL CONTENT */}
          <main className="flex-1 p-6 sm:p-8 flex flex-col justify-between overflow-y-auto">

            {/* TABS CONTAINER */}
            <div className="space-y-6">

              {/* 1. Profile Information Tab */}
              {state.activeTab === 'profile' && (
                <ProfileInfoTab
                  form={state.form}
                  saving={state.saving}
                  saveStatus={state.saveStatus}
                  errorMessage={state.errorMessage}
                  onFieldChange={(field, value) => dispatch({ type: 'SET_FIELD', field, value })}
                  onSubmit={handleSaveChanges}
                  onOpenDelete={() => dispatch({ type: 'SET_DELETE_MODAL', open: true })}
                />
              )}
              {/* 2. Subscription Tab */}
              {state.activeTab === 'subscription' && (
                <SubscriptionTab />
              )}
            </div>

            {/* Bottom Brand footer inside shell */}
            <div className="border-t border-border pt-6 mt-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-muted text-xs">
              <div>CODE-UNDERCOVER settings panel.</div>
              <div className="flex gap-4">
                <span className="hover:text-muted transition-colors cursor-pointer">Security Policy</span>
                <span>•</span>
                <span className="hover:text-muted transition-colors cursor-pointer">Support Desk</span>
              </div>
            </div>

          </main>

        </div>
      </div>

      {/* ACCOUNT DELETION MODAL OVERLAY */}
      <DeleteAccountModal
        isOpen={state.deleteModal}
        deleting={state.deleting}
        onClose={() => dispatch({ type: 'SET_DELETE_MODAL', open: false })}
        onConfirm={handleDeleteAccount}
      />
    </div>
  )
}
