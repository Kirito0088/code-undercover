"use client"

import React, { useState, useEffect } from "react"
import { Shield, CreditCard, Sparkles, Award, User as UserIcon, LogOut, ArrowLeft, Sun, Moon, AlertTriangle, CheckCircle, Loader } from "lucide-react"
import Link from "next/link"
import { signOut } from "next-auth/react"
import { calculateAgentRank, getRankBadgeStyles } from "@/lib/aura"

interface ProfileClientProps {
  user: {
    id: string
    name: string | null
    email: string | null
    auraPoints: number
    auraLevel: number
  }
}

export function ProfileClient({ user }: ProfileClientProps) {
  const [activeTab, setActiveTab] = useState<'profile' | 'subscription'>('profile')
  const [theme, setTheme] = useState<'dark' | 'light'>('dark')
  const [form, setForm] = useState({ name: user.name ?? '', email: user.email ?? '', bio: '' })
  const [saving, setSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const [deleteModal, setDeleteModal] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [showUpgradeNote, setShowUpgradeNote] = useState(false)

  // Initialize theme and bio from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedTheme = (localStorage.getItem('cu_theme') as 'dark' | 'light') ?? 'dark'
      setTheme(storedTheme)
      document.documentElement.classList.toggle('light', storedTheme === 'light')
      
      const storedBio = localStorage.getItem('cu_bio') ?? ''
      setForm(prev => ({ ...prev, bio: storedBio }))
    }
  }, [])

  // Handle theme toggling
  const toggleTheme = (targetTheme: 'dark' | 'light') => {
    setTheme(targetTheme)
    document.documentElement.classList.toggle('light', targetTheme === 'light')
    localStorage.setItem('cu_theme', targetTheme)
  }

  // Escape key listener for the modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setDeleteModal(false)
        setDeleteConfirmText('')
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Save changes handler
  const handleSaveChanges = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setSaveStatus('idle')
    setErrorMessage('')

    try {
      const response = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update profile settings')
      }

      // If database sync succeeds, write bio to client-side localStorage
      localStorage.setItem('cu_bio', form.bio)
      setSaveStatus('success')
      
      setTimeout(() => {
        setSaveStatus('idle')
      }, 3000)
    } catch (err: unknown) {
      console.error(err)
      setSaveStatus('error')
      const errorObj = err as { message?: string }
      setErrorMessage(errorObj.message || 'Something went wrong')
    } finally {
      setSaving(false)
    }
  }

  // Account deletion handler
  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') return
    setDeleting(true)

    try {
      const response = await fetch('/api/profile', {
        method: 'DELETE',
      })

      if (response.ok) {
        await signOut({ callbackUrl: '/login' })
      }
    } catch (err) {
      console.error('Failed to delete account:', err)
    } finally {
      setDeleting(false)
      setDeleteModal(false)
      setDeleteConfirmText('')
    }
  }

  const agentRank = calculateAgentRank(user.auraPoints)
  const rankStyles = getRankBadgeStyles(agentRank)

  return (
    <div className="min-h-screen bg-[#14141A] text-[#F1F1F5] py-8 px-4 sm:px-6 lg:px-8 transition-colors duration-200">
      <div className="max-w-6xl mx-auto">
        {/* Back Link */}
        <div className="mb-6">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-sm text-[#8B8BA7] hover:text-[#F1F1F5] transition-colors group"
          >
            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
            Back to Dashboard
          </Link>
        </div>

        {/* Outer Shell Card */}
        <div className="bg-[#1C1C24] border border-[#323242] rounded-2xl overflow-hidden shadow-2xl backdrop-blur-md flex flex-col md:flex-row min-h-[680px]">
          
          {/* LEFT SIDEBAR PANEL */}
          <aside className="w-full md:w-80 border-r border-[#323242] p-6 flex flex-col bg-[#14141A]/30">
            {/* Identity Card Block */}
            <div className="text-center p-6 rounded-xl border border-[#323242] bg-[#14141A]/50 relative overflow-hidden mb-6">
              <div className="absolute top-0 inset-x-0 h-1 bg-indigo-600"></div>
              
              {/* Circular Avatar */}
              <div className="h-20 w-20 mx-auto rounded-full bg-indigo-500/10 flex items-center justify-center border-2 border-indigo-500/30 overflow-hidden mb-4 relative shadow-lg">
                <Shield className="h-10 w-10 text-indigo-400" />
              </div>

              <h2 className="text-lg font-bold text-[#F1F1F5] truncate tracking-tight">{form.name || "Agent"}</h2>
              <p className="text-xs text-[#8B8BA7] truncate mb-3">{form.email}</p>

              {/* Aura Rank Pill */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#1C1C24] border border-[#323242] text-xs font-semibold">
                <span className={`uppercase tracking-wider ${rankStyles.colorText} ${rankStyles.shadow}`}>
                  {agentRank}
                </span>
                <span className="text-[#5C5C7A]">•</span>
                <span className="text-[#8B8BA7]">Lvl {user.auraLevel}</span>
              </div>
            </div>

            {/* Sidebar Navigation */}
            <nav className="flex-1 space-y-1 mb-8">
              <div className="text-[10px] font-semibold text-[#5C5C7A] uppercase tracking-widest px-3 mb-2">Account Settings</div>
              <button
                onClick={() => setActiveTab('profile')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all text-left ${
                  activeTab === 'profile'
                    ? 'bg-indigo-600/10 border border-indigo-500/30 text-indigo-400 shadow-[0_0_15px_rgba(14,185,77,0.05)]'
                    : 'text-[#8B8BA7] hover:text-[#F1F1F5] hover:bg-[#2A2A35]/40 border border-transparent'
                }`}
              >
                <UserIcon className="h-4 w-4" />
                Profile Information
              </button>

              <button
                onClick={() => setActiveTab('subscription')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all text-left ${
                  activeTab === 'subscription'
                    ? 'bg-indigo-600/10 border border-indigo-500/30 text-indigo-400 shadow-[0_0_15px_rgba(14,185,77,0.05)]'
                    : 'text-[#8B8BA7] hover:text-[#F1F1F5] hover:bg-[#2A2A35]/40 border border-transparent'
                }`}
              >
                <CreditCard className="h-4 w-4" />
                Subscription Plan
              </button>
            </nav>

            {/* Appearance theme toggler block */}
            <div className="border-t border-[#323242] pt-6">
              <div className="text-[10px] font-semibold text-[#5C5C7A] uppercase tracking-widest px-3 mb-3">Appearance</div>
              
              <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-[#14141A] border border-[#323242] shadow-inner">
                <button
                  onClick={() => toggleTheme('dark')}
                  className={`flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold transition-all ${
                    theme === 'dark'
                      ? 'bg-[#1C1C24] border border-[#323242] text-[#F1F1F5] shadow-md'
                      : 'text-[#8B8BA7] hover:text-[#F1F1F5]'
                  }`}
                >
                  <Moon className="h-3.5 w-3.5" />
                  Dark
                </button>
                <button
                  onClick={() => toggleTheme('light')}
                  className={`flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold transition-all ${
                    theme === 'light'
                      ? 'bg-[#1C1C24] border border-[#323242] text-[#F1F1F5] shadow-md'
                      : 'text-[#8B8BA7] hover:text-[#F1F1F5]'
                  }`}
                >
                  <Sun className="h-3.5 w-3.5" />
                  Light
                </button>
              </div>
            </div>
          </aside>

          {/* RIGHT PANEL CONTENT */}
          <main className="flex-1 p-6 sm:p-8 flex flex-col justify-between overflow-y-auto">
            
            {/* TABS CONTAINER */}
            <div className="space-y-6">

              {/* 1. Profile Information Tab */}
              {activeTab === 'profile' && (
                <div className="space-y-6">
                  <div>
                    <h1 className="text-2xl font-extrabold text-[#F1F1F5] tracking-tight">Profile Information</h1>
                    <p className="text-sm text-[#8B8BA7] mt-1">Manage your undercover identity credentials and field bio.</p>
                  </div>

                  <form onSubmit={handleSaveChanges} className="space-y-5">
                    {/* Full Name field */}
                    <div className="space-y-2">
                      <label htmlFor="name" className="text-xs font-semibold text-[#8B8BA7] uppercase tracking-wider">Full Name</label>
                      <input
                        type="text"
                        id="name"
                        maxLength={50}
                        required
                        className="w-full px-4 py-3 rounded-xl bg-[#14141A] border border-[#323242] text-[#F1F1F5] text-sm focus:outline-none focus:border-indigo-500 transition-all font-medium"
                        placeholder="Agent Name"
                        value={form.name}
                        onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
                      />
                    </div>

                    {/* Email address field */}
                    <div className="space-y-2">
                      <label htmlFor="email" className="text-xs font-semibold text-[#8B8BA7] uppercase tracking-wider">Email Address</label>
                      <input
                        type="email"
                        id="email"
                        required
                        className="w-full px-4 py-3 rounded-xl bg-[#14141A] border border-[#323242] text-[#F1F1F5] text-sm focus:outline-none focus:border-indigo-500 transition-all font-medium"
                        placeholder="zero@undercover.net"
                        value={form.email}
                        onChange={(e) => setForm(prev => ({ ...prev, email: e.target.value }))}
                      />
                      <p className="text-[11px] text-[#5C5C7A]">Changing your email address will directly change your system login credentials.</p>
                    </div>

                    {/* Bio Text Area */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <label htmlFor="bio" className="text-xs font-semibold text-[#8B8BA7] uppercase tracking-wider">Bio</label>
                        <span className={`text-[10px] ${form.bio.length > 180 ? 'text-amber-500 font-semibold' : 'text-[#5C5C7A]'}`}>
                          {form.bio.length} / 200
                        </span>
                      </div>
                      <textarea
                        id="bio"
                        maxLength={200}
                        rows={4}
                        className="w-full px-4 py-3 rounded-xl bg-[#14141A] border border-[#323242] text-[#F1F1F5] text-sm focus:outline-none focus:border-indigo-500 transition-all font-medium resize-none"
                        placeholder="Specializing in encrypted network infiltrations and data extractions..."
                        value={form.bio}
                        onChange={(e) => setForm(prev => ({ ...prev, bio: e.target.value }))}
                      />
                    </div>

                    {/* Save Button & Feedback line */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4 pt-2">
                      <button
                        type="submit"
                        disabled={saving}
                        className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-sm shadow-[0_0_20px_rgba(14,185,77,0.2)] hover:shadow-[0_0_25px_rgba(14,185,77,0.3)] transition-all flex items-center justify-center gap-2"
                      >
                        {saving ? (
                          <>
                            <Loader className="h-4 w-4 animate-spin text-white" />
                            Saving Settings...
                          </>
                        ) : (
                          "Save Changes"
                        )}
                      </button>

                      {/* Inline feedback lines */}
                      {saveStatus === 'success' && (
                        <div className="flex items-center gap-2 text-xs font-bold text-indigo-400 animate-in fade-in slide-in-from-left-2 duration-200">
                          <CheckCircle className="h-4 w-4" />
                          Changes saved successfully.
                        </div>
                      )}

                      {saveStatus === 'error' && (
                        <div className="flex items-center gap-2 text-xs font-bold text-red-400 animate-in fade-in slide-in-from-left-2 duration-200">
                          <AlertTriangle className="h-4 w-4" />
                          {errorMessage || 'Failed to save changes.'}
                        </div>
                      )}
                    </div>
                  </form>

                  {/* DANGER ZONE BLOCK */}
                  <div className="border-t border-[#323242] pt-8 mt-4">
                    <div className="flex items-center gap-2 text-red-500/90 font-bold text-sm uppercase tracking-wider mb-4">
                      <AlertTriangle className="h-4 w-4" />
                      Danger Zone
                    </div>
                    
                    <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div className="max-w-md">
                        <h4 className="text-sm font-bold text-[#F1F1F5]">Delete Account</h4>
                        <p className="text-xs text-[#8B8BA7] mt-1">Once you delete your account, all field records, achievements, and completed missions will be permanently destroyed. There is no going back.</p>
                      </div>
                      
                      <button
                        onClick={() => setDeleteModal(true)}
                        className="px-5 py-2.5 rounded-lg border border-red-500/30 text-red-400 hover:text-red-300 hover:bg-red-500/10 font-semibold text-xs tracking-wider transition-all whitespace-nowrap self-start sm:self-center"
                      >
                        Delete Account
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* 2. Subscription Tab */}
              {activeTab === 'subscription' && (
                <div className="space-y-6">
                  <div>
                    <h1 className="text-2xl font-extrabold text-[#F1F1F5] tracking-tight">Subscription Plan</h1>
                    <p className="text-sm text-[#8B8BA7] mt-1">Manage your billing cycle and operational status limits.</p>
                  </div>

                  {/* Active Plan display card */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    
                    {/* Left: Plan Status */}
                    <div className="lg:col-span-2 rounded-2xl border border-[#323242] bg-[#14141A]/50 p-6 flex flex-col justify-between">
                      <div className="space-y-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="text-xs text-[#8B8BA7] font-semibold uppercase tracking-wider">Current Tier</span>
                            <h3 className="text-2xl font-black text-indigo-400 tracking-tight mt-1">Agent Free / Recruit</h3>
                          </div>
                          <span className="px-2.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-[10px] font-extrabold uppercase tracking-widest text-indigo-400">
                            Active
                          </span>
                        </div>

                        <p className="text-xs text-[#8B8BA7] leading-relaxed">
                          You are currently on the entry-level Recruit database tier. Complete tactical code infiltration missions, earn Aura Points, and level up your ranking to chameleon, eagle, or platypus.
                        </p>
                      </div>

                      <div className="mt-8 pt-6 border-t border-[#323242]/60 flex flex-col sm:flex-row gap-3">
                        <button
                          onClick={() => {
                            setShowUpgradeNote(true)
                            setTimeout(() => setShowUpgradeNote(false), 5000)
                          }}
                          className="px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm transition-all shadow-[0_0_15px_rgba(14,185,77,0.15)] flex items-center justify-center gap-2"
                        >
                          Upgrade to Agent Pro
                        </button>
                        
                        <button
                          disabled
                          className="px-5 py-3 rounded-xl border border-[#323242] text-[#5C5C7A] font-bold text-sm cursor-not-allowed opacity-50"
                        >
                          Billing Dashboard
                        </button>
                      </div>

                      {showUpgradeNote && (
                        <div className="mt-3 p-3 rounded-lg border border-indigo-500/20 bg-indigo-500/5 text-xs text-indigo-400 text-center font-semibold animate-in fade-in duration-200">
                          PRO Tier is coming soon! Enhanced sandboxes and extra C compiler challenges are in pipeline training.
                        </div>
                      )}
                    </div>

                    {/* Right: Compare Pro Perks */}
                    <div className="rounded-2xl border border-[#323242] bg-[#14141A]/30 p-6 space-y-4">
                      <h4 className="text-xs font-bold text-[#F1F1F5] uppercase tracking-wider border-b border-[#323242] pb-3">PRO Operative Features</h4>
                      
                      <ul className="space-y-3">
                        {[
                          "Unlimited Infiltration Missions",
                          "High-Performance compiler prioritization",
                          "Detailed telemetry debug reports",
                          "Elite rank badges & badge rewards",
                          "Advanced C sandbox memory bounds"
                        ].map((perk, i) => (
                          <li key={i} className="flex gap-2.5 items-start text-xs text-[#8B8BA7]">
                            <Sparkles className="h-4.5 w-4.5 text-indigo-400 shrink-0 mt-0.5" />
                            <span>{perk}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                  </div>
                </div>
              )}

            </div>

            {/* Bottom Brand footer inside shell */}
            <div className="border-t border-[#323242] pt-6 mt-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-[#5C5C7A] text-xs">
              <div>CODE-UNDERCOVER settings panel.</div>
              <div className="flex gap-4">
                <span className="hover:text-[#8B8BA7] transition-colors cursor-pointer">Security Policy</span>
                <span>•</span>
                <span className="hover:text-[#8B8BA7] transition-colors cursor-pointer">Support Desk</span>
              </div>
            </div>

          </main>

        </div>
      </div>

      {/* ACCOUNT DELETION MODAL OVERLAY */}
      {deleteModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div 
            className="w-full max-w-md bg-[#1C1C24] border border-[#323242] rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden transform animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 space-y-4">
              <div className="h-12 w-12 rounded-full bg-red-500/10 flex items-center justify-center border border-red-500/30 text-red-500">
                <AlertTriangle className="h-6 w-6 animate-pulse" />
              </div>
              
              <div className="space-y-2">
                <h3 className="text-lg font-black text-[#F1F1F5] tracking-tight">Destroy Operative Record?</h3>
                <p className="text-xs text-[#8B8BA7] leading-relaxed">
                  This action is permanent and completely irreversible. All your completed C challenges, sandbox codes, leaderboard rank points, and session keys will be wiped.
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-[#8B8BA7]">
                  Type <span className="text-red-400 font-black">DELETE</span> to authorize destruction:
                </label>
                <input
                  type="text"
                  required
                  placeholder="DELETE"
                  className="w-full px-4 py-2.5 rounded-xl bg-[#14141A] border border-[#323242] text-[#F1F1F5] text-xs focus:outline-none focus:border-red-500 transition-all font-mono tracking-widest uppercase text-center"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                />
              </div>
            </div>

            <div className="bg-[#14141A] px-6 py-4 flex justify-end gap-3 border-t border-[#323242]">
              <button
                type="button"
                onClick={() => {
                  setDeleteModal(false)
                  setDeleteConfirmText('')
                }}
                className="px-4 py-2 rounded-lg text-xs font-bold text-[#8B8BA7] hover:text-[#F1F1F5] hover:bg-[#2A2A35]/60 transition-all"
              >
                Abort Infiltration
              </button>
              
              <button
                type="button"
                disabled={deleteConfirmText !== 'DELETE' || deleting}
                onClick={handleDeleteAccount}
                className="px-4 py-2 rounded-lg bg-red-600/10 hover:bg-red-600 border border-red-500/30 hover:border-red-500 disabled:opacity-50 text-red-400 hover:text-white text-xs font-black transition-all flex items-center gap-1.5"
              >
                {deleting ? (
                  <>
                    <Loader className="h-3 w-3 animate-spin" />
                    Destroying...
                  </>
                ) : (
                  "Confirm Destruction"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
