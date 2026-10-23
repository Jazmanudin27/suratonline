import React, { useState } from 'react'
import MobileHeader from './MobileHeader'
import MobileBottomNav from './MobileBottomNav'
import MobileDashboard from './MobileDashboard'
import MobileLetterList from './MobileLetterList'
import MobileApproverInbox from './MobileApproverInbox'
import MobileProfile from './MobileProfile'
import MobileDocumentReader from './MobileDocumentReader'
import LetterChatModal from '../components/LetterChatModal'
import { canUserApproveLetter } from '../components/ApproverInbox'
import { isLetterVisibleToUser } from '../services/storage'

export default function MobileLayout({
  currentUser,
  letters = [],
  branches = [],
  onLogout,
  onSwitchToDesktop,
  onApproveLetter,
  onRejectLetter,
  onRequestRevision,
  onUpdateNotes,
}) {
  const [activeTab, setActiveTab] = useState('dashboard') // 'dashboard' | 'archive' | 'inbox' | 'profile'
  const [chattingLetter, setChattingLetter] = useState(null)
  const [previewingLetter, setPreviewingLetter] = useState(null)

  // Filter surat persis seperti di Desktop (Hanya surat yang berhak dilihat user)
  const visibleLetters = letters.filter((l) => isLetterVisibleToUser(l, currentUser))

  // Hitung berapa surat yang butuh approval user saat ini
  const pendingApprovalsCount = visibleLetters.filter((l) => canUserApproveLetter(l, currentUser)).length

  return (
    <div className="min-h-screen bg-slate-900/70 sm:py-4 flex justify-center text-slate-800 antialiased selection:bg-blue-500 selection:text-white">
      {/* Mobile Container (max-w-md like native smartphone) */}
      <div className="w-full max-w-md min-h-screen sm:min-h-[844px] bg-[#F4F6FB] flex flex-col shadow-2xl relative sm:rounded-[36px] overflow-hidden border border-slate-700/30">
        {/* Top Header */}
        <MobileHeader
          currentUser={currentUser}
          onLogout={onLogout}
          onSwitchToDesktop={onSwitchToDesktop}
          pendingApprovalsCount={pendingApprovalsCount}
          onOpenInbox={() => setActiveTab('inbox')}
        />

        {/* Main Content Area */}
        <main className="flex-1 px-3 pt-3">
          {activeTab === 'dashboard' && (
            <MobileDashboard
              currentUser={currentUser}
              letters={visibleLetters}
              pendingApprovalsCount={pendingApprovalsCount}
              onNavigateTab={(tab) => setActiveTab(tab)}
              onPreviewLetter={(l) => setPreviewingLetter(l)}
              onOpenChat={(l) => setChattingLetter(l)}
            />
          )}

          {activeTab === 'archive' && (
            <MobileLetterList
              currentUser={currentUser}
              letters={visibleLetters}
              onPreviewLetter={(l) => setPreviewingLetter(l)}
              onOpenChat={(l) => setChattingLetter(l)}
              onApproveLetter={onApproveLetter}
              onRejectLetter={onRejectLetter}
              onRequestRevision={onRequestRevision}
            />
          )}

          {activeTab === 'inbox' && (
            <MobileApproverInbox
              currentUser={currentUser}
              letters={visibleLetters}
              onPreviewLetter={(l) => setPreviewingLetter(l)}
              onOpenChat={(l) => setChattingLetter(l)}
              onApproveLetter={onApproveLetter}
              onRejectLetter={onRejectLetter}
              onRequestRevision={onRequestRevision}
              onUpdateNotes={onUpdateNotes}
            />
          )}

          {activeTab === 'profile' && (
            <MobileProfile
              currentUser={currentUser}
              onLogout={onLogout}
              onSwitchToDesktop={onSwitchToDesktop}
            />
          )}
        </main>

        {/* Bottom Floating Navigation Bar (4 Tab Simple) */}
        <MobileBottomNav
          activeTab={activeTab}
          onTabChange={(tab) => setActiveTab(tab)}
          pendingApprovalsCount={pendingApprovalsCount}
        />

        {/* Chat Modal */}
        {chattingLetter && (
          <LetterChatModal
            letter={chattingLetter}
            currentUser={currentUser}
            onClose={() => setChattingLetter(null)}
          />
        )}

        {/* Mobile Document Reader (Card Sheet Mobile-First) */}
        {previewingLetter && (
          <MobileDocumentReader
            letter={previewingLetter}
            currentUser={currentUser}
            branches={branches}
            onClose={() => setPreviewingLetter(null)}
            onOpenChat={(l) => setChattingLetter(l)}
            onApprove={(id, note) => {
              if (onApproveLetter) onApproveLetter(id, note)
            }}
            onReject={(id, reason) => {
              if (onRejectLetter) onRejectLetter(id, reason)
            }}
            onRequestRevision={(id, note) => {
              if (onRequestRevision) onRequestRevision(id, note)
            }}
            onUpdateNotes={(targetIdx, newNote) => {
              if (onUpdateNotes) onUpdateNotes(previewingLetter.id, targetIdx, newNote)
            }}
          />
        )}
      </div>
    </div>
  )
}
