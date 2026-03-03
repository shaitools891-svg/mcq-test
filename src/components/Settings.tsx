import { useState, useRef } from 'react'
import { 
  Trash2, Moon, Sun, Monitor,
  ChevronRight, Info, Zap, RotateCcw, ShieldCheck, Settings2,
  Upload, Download, Cloud, Shield, CloudOff, Share2,
  Navigation, Hand, CheckCircle, AlertTriangle, Vibrate, Bell, Volume2, VolumeX,
  X, Plus, Pencil, User, BookOpen, Calendar
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { clearActivity } from '../utils/recentActivity'
import { toast } from 'sonner'
import { Theme } from '../types'
import { NativeToolLayout } from './tools/shared/NativeToolLayout'
import { hapticImpact, hapticSelection, getHapticSettings, saveHapticSettings, HapticSettings } from '../utils/haptics'
import { isAdminMode, setAdminMode, loadAppData, saveAppData, getChangeLog, setLastSyncTime, saveDataSnapshot, ChangeLog } from '../utils/routineStorage'
import { syncSave, syncLoad, SYNC_KEYS, getLatestVersion, APP_VERSION } from '../utils/supabaseClient'
import { exportBackup, shareBackup, importBackup } from '../utils/backupUtils'
import { Capacitor } from '@capacitor/core'
import { Filesystem, Directory } from '@capacitor/filesystem'
import { getNotificationSettings, saveNotificationSettings, NotificationSettings, getVolumeButtonControlSetting, saveVolumeButtonControlSetting } from '../utils/notificationUtils'

// --- Custom UI Components ---

const ToggleSwitch = ({ checked, onChange }: { checked: boolean, onChange: () => void }) => (
  <button 
    onClick={(e) => { e.stopPropagation(); onChange() }}
    className={`w-12 h-7 rounded-full p-1 transition-all duration-300 ${checked ? 'bg-rose-500 shadow-lg shadow-rose-500/20' : 'bg-gray-200 dark:bg-zinc-700'}`}
  >
    <div className={`w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-300 ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
  </button>
)

const SettingItem = ({ 
  icon: Icon, 
  title, 
  subtitle, 
  action, 
  onClick,
  danger,
  iconColor
}: { 
  icon: any, 
  title: string, 
  subtitle?: string, 
  action?: React.ReactNode,
  onClick?: () => void,
  danger?: boolean,
  iconColor?: string
}) => {
  const Container = onClick ? 'button' : 'div'
  return (
    <Container 
      onClick={onClick}
      className={`w-full flex items-center justify-between p-4 px-5 transition-all text-left group ${onClick ? 'active:bg-gray-50 dark:active:bg-white/5 cursor-pointer' : 'cursor-default'}`}
    >
      <div className="flex items-center gap-4 flex-1 overflow-hidden">
        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 transition-colors ${danger ? 'bg-red-50 dark:bg-red-900/20 text-red-500' : (iconColor || 'bg-gray-100 dark:bg-zinc-800 text-gray-500 group-hover:text-rose-500 group-hover:bg-rose-50 dark:group-hover:bg-rose-900/20')}`}>
          <Icon size={18} strokeWidth={2.5} />
        </div>
        <div className="min-w-0 flex-1">
          <h4 className={`text-[13px] font-black truncate mb-0.5 tracking-tight ${danger ? 'text-red-500' : 'text-gray-900 dark:text-white'}`}>{title}</h4>
          {subtitle && <p className="text-[10px] text-gray-500 dark:text-zinc-500 font-bold uppercase tracking-tight truncate">{subtitle}</p>}
        </div>
      </div>
      <div className="flex items-center gap-3 shrink-0 ml-3">
        {action}
        {onClick && !action && <ChevronRight size={16} className="text-gray-300" />}
      </div>
    </Container>
  )
}

const SettingGroup = ({ title, children }: { title: string, children: React.ReactNode }) => (
  <div className="mb-6">
    <h3 className="px-6 mb-2 text-[9px] font-black uppercase tracking-[0.3em] text-gray-400 dark:text-zinc-600">{title}</h3>
    <div className="bg-white dark:bg-zinc-900 rounded-[2.25rem] border border-gray-100 dark:border-white/5 divide-y divide-gray-50 dark:divide-white/5 shadow-sm overflow-hidden">
      {children}
    </div>
  </div>
)

export default function Settings({ theme, setTheme }: { theme: Theme, setTheme: (t: Theme) => void }) {
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [hapticSettings, setHapticSettings] = useState<HapticSettings>(getHapticSettings())
  const [showHapticDetails, setShowHapticDetails] = useState(false)
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>(getNotificationSettings())
  const [showNotificationDetails, setShowNotificationDetails] = useState(false)
  const [volumeButtonControl, setVolumeButtonControl] = useState<boolean>(getVolumeButtonControlSetting())
  const [adminMode, setAdminModeState] = useState(isAdminMode())
  const [checkingUpdate, setCheckingUpdate] = useState(false)
  const [updateAvailable, setUpdateAvailable] = useState<{version: string; downloadUrl: string} | null>(null)
  const [downloadingUpdate, setDownloadingUpdate] = useState(false)
  const [showChangeLog, setShowChangeLog] = useState(false)
  const [changeLog, setChangeLog] = useState<ChangeLog | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  
  // Update a specific haptic category
  const updateHapticSetting = (key: keyof HapticSettings, value: boolean) => {
    const newSettings = { ...hapticSettings, [key]: value }
    setHapticSettings(newSettings)
    saveHapticSettings(newSettings)
    hapticSelection()
    toast.success(`${key.charAt(0).toUpperCase() + key.slice(1)} haptics ${value ? 'enabled' : 'disabled'}`)
  }

  // Update a specific notification setting
  const updateNotificationSetting = (key: keyof NotificationSettings, value: boolean) => {
    const newSettings = { ...notificationSettings, [key]: value }
    setNotificationSettings(newSettings)
    saveNotificationSettings(newSettings)
    hapticSelection()
    toast.success(`${key.charAt(0).toUpperCase() + key.slice(1)} notifications ${value ? 'enabled' : 'disabled'}`)
  }

  // Check for app updates
  const checkForUpdates = async () => {
    setCheckingUpdate(true)
    toast.message('Checking for updates...')
    
    const latestVersion = await getLatestVersion()
    
    if (!latestVersion) {
      toast.error('Could not check for updates. Please try again.')
    } else if (latestVersion.version === APP_VERSION) {
      toast.success('You have the latest version!')
    } else {
      setUpdateAvailable({ version: latestVersion.version, downloadUrl: latestVersion.downloadUrl || '' })
    }
    
    setCheckingUpdate(false)
  }

  // Handle update download - in-app download + install
  const handleUpdateDownload = async () => {
    if (!updateAvailable?.downloadUrl) return

    if (Capacitor.isNativePlatform()) {
      // Android: Download APK in-app and prompt for install
      setDownloadingUpdate(true)
      try {
        toast.message('Downloading update...')
        
        const fileName = `paperknife-${updateAvailable.version}.apk`
        
        // Check if already downloaded
        try {
          await Filesystem.stat({
            path: fileName,
            directory: Directory.Cache
          })
          // File exists, try to open it
          const fileUri = await Filesystem.getUri({
            path: fileName,
            directory: Directory.Cache
          })
          window.open(fileUri.uri, '_system')
          toast.success('APK already downloaded! Opening installer...')
          setUpdateAvailable(null)
          setDownloadingUpdate(false)
          return
        } catch {
          // File doesn't exist, proceed with download
        }
        
        // Download the APK
        const response = await fetch(updateAvailable.downloadUrl)
        const blob = await response.arrayBuffer()
        
        // Convert to base64
        const base64 = btoa(String.fromCharCode(...new Uint8Array(blob)))
        
        // Save to cache directory
        await Filesystem.writeFile({
          path: fileName,
          data: base64,
          directory: Directory.Cache,
        })
        
        // Get the file URI
        const fileUri = await Filesystem.getUri({
          path: fileName,
          directory: Directory.Cache
        })
        
        // Open the APK with the system installer using intent URL
        const intentUrl = `intent://${fileUri.uri.replace('file://', '')}#Intent;scheme=file;type=application/vnd.android.package-archive;end`
        
        // Try using capacitor-intent or fall back to opening in browser
        window.open(intentUrl, '_system')
        
        toast.success('Download complete! Please install from the notification.')
        setUpdateAvailable(null)
      } catch (error) {
        console.error('Download failed:', error)
        // Fallback to browser download
        window.open(updateAvailable.downloadUrl, '_blank')
        toast.error('In-app download failed, opening browser instead')
      } finally {
        setDownloadingUpdate(false)
      }
    } else {
      // Web: Open in browser
      window.open(updateAvailable.downloadUrl, '_blank')
    }
    setUpdateAvailable(null)
  }

  // Toggle admin mode
  const handleAdminModeToggle = () => {
    const newValue = !adminMode
    setAdminMode(newValue)
    setAdminModeState(newValue)
    hapticImpact()
    toast.success(newValue ? 'Admin mode enabled - You can now upload changes to cloud' : 'Admin mode disabled - Read-only mode')
  }

  // Manual upload to cloud - show changelog preview first
  const handleUploadToCloud = async () => {
    if (!adminMode) {
      toast.error('Enable Admin Mode first to upload data')
      return
    }
    
    // Get the changelog and show preview
    const log = getChangeLog()
    const totalChanges = log.summary.students.added + log.summary.students.modified + log.summary.students.deleted +
                        log.summary.teachers.added + log.summary.teachers.modified + log.summary.teachers.deleted +
                        log.summary.schedule.added + log.summary.schedule.modified + log.summary.schedule.deleted
    
    if (totalChanges === 0) {
      toast.message('No changes to upload. Data is already in sync with cloud.')
      return
    }
    
    setChangeLog(log)
    setShowChangeLog(true)
  }
  
  // Confirm upload after reviewing changelog
  const confirmUpload = async () => {
    setShowChangeLog(false)
    setIsUploading(true)
    
    toast.message('Uploading to cloud...')
    const data = loadAppData()
    
    const results = await Promise.all([
      syncSave(SYNC_KEYS.SCHEDULE, data.schedule),
      syncSave(SYNC_KEYS.TEACHERS, data.teachers),
      syncSave(SYNC_KEYS.STUDENTS, data.students)
    ])
    
    const allSucceeded = results.every(r => r === true)
    
    if (allSucceeded) {
      // Save snapshot and update sync time after successful upload
      saveDataSnapshot()
      setLastSyncTime(Date.now())
      toast.success('Data uploaded to cloud!')
    } else {
      toast.error('Upload failed. Check internet connection.')
    }
    
    setIsUploading(false)
    hapticImpact()
  }

  // Manual download from cloud
  const handleDownloadFromCloud = async () => {
    toast.message('Downloading from cloud...')
    const [schedule, teachers, students] = await Promise.all([
      syncLoad(SYNC_KEYS.SCHEDULE),
      syncLoad(SYNC_KEYS.TEACHERS),
      syncLoad(SYNC_KEYS.STUDENTS)
    ])
    
    const hasData = schedule || teachers || students
    
    if (hasData) {
      const data = loadAppData()
      if (schedule) data.schedule = schedule
      if (teachers) data.teachers = teachers
      if (students) data.students = students
      saveAppData(data, false)
      toast.success('Data downloaded from cloud!')
      hapticImpact()
      window.location.reload()
    } else {
      toast.error('No data found in cloud. Make sure you have uploaded data first.')
    }
  }

  // Export data to JSON file
  const handleExport = async () => {
    const result = await exportBackup()
    
    if (result.success) {
      toast.success('Data exported successfully!')
      hapticImpact()
    } else {
      toast.error(result.error || 'Export failed')
    }
  }

  // Share backup via system share sheet
  const handleShare = async () => {
    const result = await shareBackup()
    
    if (result.success) {
      toast.success('Data shared successfully!')
      hapticImpact()
    } else {
      toast.error(result.error || 'Share failed')
    }
  }

  // Import data from JSON file
  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    
    const reader = new FileReader()
    reader.onload = (e) => {
      const result = importBackup(e.target?.result as string)
      
      if (result.success) {
        if (confirm('This will replace all your current data. Continue?')) {
          toast.success('Data imported successfully! Please refresh.')
          hapticImpact()
        }
      } else {
        toast.error(result.error || 'Invalid backup file')
      }
    }
    reader.readAsText(file)
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const restoreDefaults = () => {
    if (confirm("Restore all settings to factory defaults?")) {
      localStorage.clear()
      localStorage.setItem('theme', 'system')
      window.location.reload()
    }
  }

  return (
    <NativeToolLayout title="System" description="Core Configuration" actions={null}>
      {/* Update Available Modal */}
      {updateAvailable && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm"
            onClick={() => setUpdateAvailable(null)}
          />
          <div className="relative bg-white dark:bg-zinc-900 rounded-[2rem] p-6 w-full max-w-sm shadow-2xl border border-gray-100 dark:border-zinc-800 animate-in zoom-in-95 duration-200">
            <div className="text-center">
              <div className="w-16 h-16 bg-rose-100 dark:bg-rose-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <Download size={32} className="text-rose-500" />
              </div>
              <h3 className="text-xl font-black dark:text-white mb-2">Update Available!</h3>
              <p className="text-gray-500 dark:text-zinc-400 text-sm mb-6">
                Version <span className="font-bold text-rose-500">{updateAvailable.version}</span> is now available. Would you like to download it?
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setUpdateAvailable(null)}
                  className="flex-1 px-4 py-3 bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400 rounded-2xl font-bold text-sm transition-colors hover:bg-gray-200 dark:hover:bg-zinc-700"
                >
                  Later
                </button>
                <button
                  onClick={handleUpdateDownload}
                  disabled={downloadingUpdate}
                  className="flex-1 px-4 py-3 bg-rose-500 text-white rounded-2xl font-bold text-sm shadow-lg shadow-rose-500/20 transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                >
                  {downloadingUpdate ? 'Downloading...' : 'Download'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 pb-40">
        
        {/* Integrated Header */}
        <div className="flex items-center gap-4 px-2 mb-8 mt-2">
           <div className="w-12 h-12 bg-rose-500 rounded-2xl flex items-center justify-center shadow-lg shadow-rose-500/20 text-white shrink-0">
              <Settings2 size={24} strokeWidth={2.5} />
           </div>
           <div>
              <h2 className="text-xl font-black dark:text-white tracking-tighter leading-none mb-1">Preferences</h2>
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Protocol v{APP_VERSION} • Local</p>
           </div>
        </div>

        {/* Check for Updates */}
        <button
          onClick={checkForUpdates}
          disabled={checkingUpdate}
          className="w-full mb-4 p-3 bg-rose-500 text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg"
        >
          <Download size={18} />
          {checkingUpdate ? 'Checking...' : 'Check for Updates'}
        </button>

         {/* Visual Interface */}
        <SettingGroup title="Interface">
          <div className="p-2 grid grid-cols-3 gap-2">
            {[
              { id: 'light', icon: Sun, label: 'Light' },
              { id: 'dark', icon: Moon, label: 'Dark' },
              { id: 'system', icon: Monitor, label: 'System' }
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => {
                  setTheme(t.id as Theme)
                  hapticSelection()
                }}
                className={`flex flex-col items-center gap-2 py-3.5 rounded-[1.25rem] transition-all border border-transparent ${theme === t.id ? 'bg-zinc-950 dark:bg-white text-white dark:text-black shadow-xl scale-[1.02]' : 'bg-gray-50 dark:bg-black/40 text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-800'}`}
              >
                <t.icon size={18} strokeWidth={2.5} />
                <span className="text-[9px] font-black uppercase tracking-[0.1em]">{t.label}</span>
              </button>
            ))}
          </div>
          <SettingItem 
            icon={Vibrate} 
            title="Haptic Feedback" 
            subtitle={hapticSettings.enabled ? 'Tactile Response Active' : 'Tactile Response Disabled'}
            action={<ToggleSwitch checked={hapticSettings.enabled} onChange={() => updateHapticSetting('enabled', !hapticSettings.enabled)} />}
          />
          <SettingItem 
            icon={Bell} 
            title="Running Class Notifications" 
            subtitle={notificationSettings.enabled ? 'Notify on app startup' : 'Notifications disabled'}
            action={<ToggleSwitch checked={notificationSettings.enabled} onChange={() => updateNotificationSetting('enabled', !notificationSettings.enabled)} />}
          />
          {notificationSettings.enabled && (
            <div className="px-4 pb-4">
              <button
                onClick={() => setShowNotificationDetails(!showNotificationDetails)}
                className="text-[10px] font-black uppercase text-rose-500 flex items-center gap-1 mb-3"
              >
                <Settings2 size={12} /> {showNotificationDetails ? 'Hide' : 'Customize'} Notification Settings
              </button>
              {showNotificationDetails && (
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => updateNotificationSetting('soundEnabled', !notificationSettings.soundEnabled)}
                    className={`flex items-center gap-2 p-3 rounded-xl text-left transition-all ${notificationSettings.soundEnabled ? 'bg-rose-50 dark:bg-rose-900/20 text-rose-600' : 'bg-gray-50 dark:bg-zinc-800 text-gray-400'}`}
                  >
                    {notificationSettings.soundEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
                    <span className="text-[9px] font-black uppercase">Sound</span>
                  </button>
                  <button
                    onClick={() => updateNotificationSetting('vibrationEnabled', !notificationSettings.vibrationEnabled)}
                    className={`flex items-center gap-2 p-3 rounded-xl text-left transition-all ${notificationSettings.vibrationEnabled ? 'bg-rose-50 dark:bg-rose-900/20 text-rose-600' : 'bg-gray-50 dark:bg-zinc-800 text-gray-400'}`}
                  >
                    <Vibrate size={14} />
                    <span className="text-[9px] font-black uppercase">Vibration</span>
                  </button>
                  <button
                    onClick={() => {
                      const newValue = !volumeButtonControl
                      setVolumeButtonControl(newValue)
                      saveVolumeButtonControlSetting(newValue)
                    }}
                    className={`flex items-center gap-2 p-3 rounded-xl text-left transition-all ${volumeButtonControl ? 'bg-rose-50 dark:bg-rose-900/20 text-rose-600' : 'bg-gray-50 dark:bg-zinc-800 text-gray-400'}`}
                  >
                    <Volume2 size={14} />
                    <span className="text-[9px] font-black uppercase">Volume Button Control</span>
                  </button>
                </div>
              )}
            </div>
          )}
          {hapticSettings.enabled && (
            <div className="px-4 pb-4">
              <button
                onClick={() => setShowHapticDetails(!showHapticDetails)}
                className="text-[10px] font-black uppercase text-rose-500 flex items-center gap-1 mb-3"
              >
                <Settings2 size={12} /> {showHapticDetails ? 'Hide' : 'Customize'} Categories
              </button>
              {showHapticDetails && (
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => updateHapticSetting('navigation', !hapticSettings.navigation)}
                    className={`flex items-center gap-2 p-3 rounded-xl text-left transition-all ${hapticSettings.navigation ? 'bg-rose-50 dark:bg-rose-900/20 text-rose-600' : 'bg-gray-50 dark:bg-zinc-800 text-gray-400'}`}
                  >
                    <Navigation size={14} />
                    <span className="text-[9px] font-black uppercase">Navigation</span>
                  </button>
                  <button
                    onClick={() => updateHapticSetting('actions', !hapticSettings.actions)}
                    className={`flex items-center gap-2 p-3 rounded-xl text-left transition-all ${hapticSettings.actions ? 'bg-rose-50 dark:bg-rose-900/20 text-rose-600' : 'bg-gray-50 dark:bg-zinc-800 text-gray-400'}`}
                  >
                    <Hand size={14} />
                    <span className="text-[9px] font-black uppercase">Actions</span>
                  </button>
                  <button
                    onClick={() => updateHapticSetting('selection', !hapticSettings.selection)}
                    className={`flex items-center gap-2 p-3 rounded-xl text-left transition-all ${hapticSettings.selection ? 'bg-rose-50 dark:bg-rose-900/20 text-rose-600' : 'bg-gray-50 dark:bg-zinc-800 text-gray-400'}`}
                  >
                    <Zap size={14} />
                    <span className="text-[9px] font-black uppercase">Selection</span>
                  </button>
                  <button
                    onClick={() => updateHapticSetting('success', !hapticSettings.success)}
                    className={`flex items-center gap-2 p-3 rounded-xl text-left transition-all ${hapticSettings.success ? 'bg-rose-50 dark:bg-rose-900/20 text-rose-600' : 'bg-gray-50 dark:bg-zinc-800 text-gray-400'}`}
                  >
                    <CheckCircle size={14} />
                    <span className="text-[9px] font-black uppercase">Success</span>
                  </button>
                  <button
                    onClick={() => updateHapticSetting('errors', !hapticSettings.errors)}
                    className={`flex items-center gap-2 p-3 rounded-xl text-left transition-all col-span-2 ${hapticSettings.errors ? 'bg-rose-50 dark:bg-rose-900/20 text-rose-600' : 'bg-gray-50 dark:bg-zinc-800 text-gray-400'}`}
                  >
                    <AlertTriangle size={14} />
                    <span className="text-[9px] font-black uppercase">Errors & Warnings</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </SettingGroup>

        {/* Backup Section */}
        <SettingGroup title="Backup">
          <SettingItem 
            icon={Upload} 
            title="Export Data" 
            subtitle="Save to JSON file"
            iconColor="text-green-600 bg-green-50 dark:bg-green-900/20"
            onClick={handleExport}
          />
          <SettingItem 
            icon={Share2} 
            title="Share Backup" 
            subtitle="Send via apps"
            iconColor="text-purple-600 bg-purple-50 dark:bg-purple-900/20"
            onClick={handleShare}
          />
          <SettingItem 
            icon={Download} 
            title="Import Data" 
            subtitle="Restore from JSON"
            iconColor="text-blue-600 bg-blue-50 dark:bg-blue-900/20"
            onClick={() => fileInputRef.current?.click()}
          />
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleImport}
            className="hidden"
          />
        </SettingGroup>

        {/* Cloud Sync Section */}
        <SettingGroup title="Cloud Sync">
          <SettingItem 
            icon={Shield} 
            title="Admin Mode" 
            subtitle={adminMode ? 'Can upload changes to cloud' : 'Read-only mode - others can view'}
            iconColor="text-amber-500 bg-amber-50 dark:bg-amber-900/20"
            action={<ToggleSwitch checked={adminMode} onChange={handleAdminModeToggle} />}
          />
          <SettingItem 
            icon={Upload} 
            title="Upload to Cloud" 
            subtitle="Push your data to Supabase"
            iconColor="text-blue-500 bg-blue-50 dark:bg-blue-900/20"
            onClick={handleUploadToCloud}
          />
          <SettingItem 
            icon={Download} 
            title="Download from Cloud" 
            subtitle="Pull data from Supabase"
            iconColor="text-green-500 bg-green-50 dark:bg-green-900/20"
            onClick={handleDownloadFromCloud}
          />
          <SettingItem 
            icon={adminMode ? Cloud : CloudOff} 
            title="Sync Status" 
            subtitle={adminMode ? 'Connected - Changes will upload automatically' : 'Connected - Read only mode'}
            iconColor="text-rose-500 bg-rose-50 dark:bg-rose-900/20"
          />
        </SettingGroup>

        {/* Ecosystem */}
        <SettingGroup title="Ecosystem">
          {/* REMOVED: Sponsor Project - not related to routine scrapper */}
          {/* REMOVED: Report Issue - not related to routine scrapper */}
          <SettingItem 
            icon={Info} 
            title="About Routine Scrapper" 
            subtitle="Protocol Details"
            onClick={() => navigate('/about')}
          />
          <SettingItem 
            icon={ShieldCheck} 
            title="Privacy Protocol" 
            subtitle="Data Handling Spec"
            onClick={() => navigate('/privacy')}
          />
        </SettingGroup>

        {/* Danger Zone - Moved to absolute bottom */}
        <div className="mt-12">
           <h3 className="px-6 mb-2 text-[9px] font-black uppercase tracking-[0.3em] text-red-500">Danger Zone</h3>
           <div className="bg-white dark:bg-zinc-900 rounded-[2.25rem] border border-red-100 dark:border-red-900/20 divide-y divide-red-50 dark:divide-red-900/10 shadow-sm overflow-hidden mb-4">
              <SettingItem 
                icon={RotateCcw} 
                title="Restore Defaults" 
                subtitle="Reset Preferences" 
                onClick={restoreDefaults}
                iconColor="text-gray-500 bg-gray-100 dark:bg-zinc-800"
              />
              <SettingItem 
                icon={Trash2} 
                title="Nuke All Data" 
                subtitle="Irreversible Wipedown" 
                danger
                onClick={async () => {
                  if(confirm("DANGER: This will permanently delete your history and reset all configuration. Proceed?")) {
                    await clearActivity()
                    localStorage.clear()
                    window.location.reload()
                  }
                }}
              />
           </div>
           <p className="text-[8px] font-black uppercase text-center text-gray-300 dark:text-zinc-700 tracking-[0.5em] mt-10">Configuration Engine v{APP_VERSION} Stable</p>
        </div>

      </div>

      {/* Changelog Preview Modal */}
      {showChangeLog && changeLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setShowChangeLog(false)}>
          <div 
            className="bg-white dark:bg-zinc-900 rounded-3xl w-full max-w-md max-h-[80vh] overflow-hidden shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-50 dark:bg-rose-900/20 flex items-center justify-center">
                  <Cloud size={20} className="text-rose-500" />
                </div>
                <div>
                  <h3 className="text-base font-black text-gray-900 dark:text-white">Upload to Cloud</h3>
                  <p className="text-[10px] text-gray-500 dark:text-zinc-500 font-medium">Review changes before uploading</p>
                </div>
              </div>
              <button 
                onClick={() => setShowChangeLog(false)}
                className="w-8 h-8 rounded-full bg-gray-100 dark:bg-zinc-800 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-zinc-700 transition-colors"
              >
                <X size={16} className="text-gray-500" />
              </button>
            </div>

            {/* Summary Cards */}
            <div className="p-4 border-b border-gray-100 dark:border-white/10">
              <div className="grid grid-cols-3 gap-2">
                {/* Students */}
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-2xl p-3 text-center">
                  <User size={18} className="mx-auto mb-1 text-blue-500" />
                  <p className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase">Students</p>
                  <p className="text-lg font-black text-blue-700 dark:text-blue-300">
                    {changeLog.summary.students.added + changeLog.summary.students.modified + changeLog.summary.students.deleted}
                  </p>
                  <div className="flex justify-center gap-1 mt-1">
                    {changeLog.summary.students.added > 0 && <span className="text-[8px] text-green-600 font-bold">+{changeLog.summary.students.added}</span>}
                    {changeLog.summary.students.modified > 0 && <span className="text-[8px] text-amber-600 font-bold">~{changeLog.summary.students.modified}</span>}
                    {changeLog.summary.students.deleted > 0 && <span className="text-[8px] text-red-600 font-bold">-{changeLog.summary.students.deleted}</span>}
                  </div>
                </div>
                {/* Teachers */}
                <div className="bg-purple-50 dark:bg-purple-900/20 rounded-2xl p-3 text-center">
                  <BookOpen size={18} className="mx-auto mb-1 text-purple-500" />
                  <p className="text-[10px] font-black text-purple-600 dark:text-purple-400 uppercase">Teachers</p>
                  <p className="text-lg font-black text-purple-700 dark:text-purple-300">
                    {changeLog.summary.teachers.added + changeLog.summary.teachers.modified + changeLog.summary.teachers.deleted}
                  </p>
                  <div className="flex justify-center gap-1 mt-1">
                    {changeLog.summary.teachers.added > 0 && <span className="text-[8px] text-green-600 font-bold">+{changeLog.summary.teachers.added}</span>}
                    {changeLog.summary.teachers.modified > 0 && <span className="text-[8px] text-amber-600 font-bold">~{changeLog.summary.teachers.modified}</span>}
                    {changeLog.summary.teachers.deleted > 0 && <span className="text-[8px] text-red-600 font-bold">-{changeLog.summary.teachers.deleted}</span>}
                  </div>
                </div>
                {/* Schedule */}
                <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl p-3 text-center">
                  <Calendar size={18} className="mx-auto mb-1 text-emerald-500" />
                  <p className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase">Schedule</p>
                  <p className="text-lg font-black text-emerald-700 dark:text-emerald-300">
                    {changeLog.summary.schedule.added + changeLog.summary.schedule.modified + changeLog.summary.schedule.deleted}
                  </p>
                  <div className="flex justify-center gap-1 mt-1">
                    {changeLog.summary.schedule.added > 0 && <span className="text-[8px] text-green-600 font-bold">+{changeLog.summary.schedule.added}</span>}
                    {changeLog.summary.schedule.modified > 0 && <span className="text-[8px] text-amber-600 font-bold">~{changeLog.summary.schedule.modified}</span>}
                    {changeLog.summary.schedule.deleted > 0 && <span className="text-[8px] text-red-600 font-bold">-{changeLog.summary.schedule.deleted}</span>}
                  </div>
                </div>
              </div>
              
              {/* Legend */}
              <div className="flex justify-center gap-4 mt-3">
                <span className="flex items-center gap-1 text-[9px] text-green-600 font-bold">
                  <Plus size={12} /> Added
                </span>
                <span className="flex items-center gap-1 text-[9px] text-amber-600 font-bold">
                  <Pencil size={12} /> Modified
                </span>
                <span className="flex items-center gap-1 text-[9px] text-red-600 font-bold">
                  <Trash2 size={12} /> Deleted
                </span>
              </div>
            </div>

            {/* Change List */}
            <div className="p-4 max-h-48 overflow-y-auto">
              <h4 className="text-[10px] font-black uppercase text-gray-400 dark:text-zinc-600 mb-2">Change Details</h4>
              <div className="space-y-1">
                {changeLog.entries.slice(0, 20).map((entry, idx) => (
                  <div 
                    key={`${entry.id}-${idx}`}
                    className="flex items-center gap-2 p-2 rounded-xl bg-gray-50 dark:bg-zinc-800/50"
                  >
                    {entry.type === 'added' && (
                      <div className="w-6 h-6 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                        <Plus size={14} className="text-green-600" />
                      </div>
                    )}
                    {entry.type === 'modified' && (
                      <div className="w-6 h-6 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                        <Pencil size={14} className="text-amber-600" />
                      </div>
                    )}
                    {entry.type === 'deleted' && (
                      <div className="w-6 h-6 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                        <Trash2 size={14} className="text-red-600" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-gray-900 dark:text-white truncate">{entry.name}</p>
                      <p className="text-[9px] text-gray-500 dark:text-zinc-500 capitalize">
                        {entry.category === 'students' && 'Student'}
                        {entry.category === 'teachers' && 'Teacher'}
                        {entry.category === 'schedule' && 'Class Schedule'}
                      </p>
                    </div>
                  </div>
                ))}
                {changeLog.entries.length > 20 && (
                  <p className="text-[10px] text-center text-gray-400 dark:text-zinc-500 py-2">
                    +{changeLog.entries.length - 20} more changes...
                  </p>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="p-4 border-t border-gray-100 dark:border-white/10 flex gap-3">
              <button
                onClick={() => setShowChangeLog(false)}
                className="flex-1 py-3 px-4 rounded-2xl bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 font-bold text-sm hover:bg-gray-200 dark:hover:bg-zinc-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmUpload}
                disabled={isUploading}
                className="flex-1 py-3 px-4 rounded-2xl bg-rose-500 text-white font-bold text-sm hover:bg-rose-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isUploading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload size={16} />
                    Confirm Upload
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </NativeToolLayout>
  )
}
