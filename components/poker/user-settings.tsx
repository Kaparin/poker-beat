"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Settings, Volume2, VolumeX, MessageSquare, Clock, Eye } from "lucide-react"
import { toast } from "@/hooks/use-toast"

interface UserSettings {
  soundEnabled: boolean
  soundVolume: number
  chatEnabled: boolean
  showHandHistory: boolean
  showSpectators: boolean
  autoFoldWhenAway: boolean
  confirmActions: boolean
}

interface UserSettingsProps {
  settings: UserSettings
  onUpdateSettings: (settings: Partial<UserSettings>) => void
}

export function UserSettings({ settings, onUpdateSettings }: UserSettingsProps) {
  const [localSettings, setLocalSettings] = useState<UserSettings>(settings)
  const [isOpen, setIsOpen] = useState(false)

  // Update local settings when props change
  useEffect(() => {
    setLocalSettings(settings)
  }, [settings])

  const handleChange = (key: keyof UserSettings, value: any) => {
    setLocalSettings((prev) => ({
      ...prev,
      [key]: value,
    }))
  }

  const handleSave = () => {
    onUpdateSettings(localSettings)
    setIsOpen(false)
    toast({
      title: "Settings saved",
      description: "Your game settings have been updated",
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon" className="h-9 w-9">
          <Settings className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Game Settings</DialogTitle>
        </DialogHeader>
        <div className="space-y-6 py-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {localSettings.soundEnabled ? (
                  <Volume2 className="h-4 w-4 text-gray-500" />
                ) : (
                  <VolumeX className="h-4 w-4 text-gray-500" />
                )}
                <Label htmlFor="sound-enabled">Sound Effects</Label>
              </div>
              <Switch
                id="sound-enabled"
                checked={localSettings.soundEnabled}
                onCheckedChange={(checked) => handleChange("soundEnabled", checked)}
              />
            </div>

            {localSettings.soundEnabled && (
              <div className="pl-6">
                <Label htmlFor="sound-volume" className="mb-2 block text-sm">
                  Volume: {localSettings.soundVolume}%
                </Label>
                <Slider
                  id="sound-volume"
                  min={0}
                  max={100}
                  step={5}
                  value={[localSettings.soundVolume]}
                  onValueChange={(value) => handleChange("soundVolume", value[0])}
                  className="w-full"
                />
              </div>
            )}

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <MessageSquare className="h-4 w-4 text-gray-500" />
                <Label htmlFor="chat-enabled">Chat</Label>
              </div>
              <Switch
                id="chat-enabled"
                checked={localSettings.chatEnabled}
                onCheckedChange={(checked) => handleChange("chatEnabled", checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-gray-500" />
                <Label htmlFor="hand-history">Hand History</Label>
              </div>
              <Switch
                id="hand-history"
                checked={localSettings.showHandHistory}
                onCheckedChange={(checked) => handleChange("showHandHistory", checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Eye className="h-4 w-4 text-gray-500" />
                <Label htmlFor="spectators">Show Spectators</Label>
              </div>
              <Switch
                id="spectators"
                checked={localSettings.showSpectators}
                onCheckedChange={(checked) => handleChange("showSpectators", checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="auto-fold">Auto-fold when away</Label>
              <Switch
                id="auto-fold"
                checked={localSettings.autoFoldWhenAway}
                onCheckedChange={(checked) => handleChange("autoFoldWhenAway", checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="confirm-actions">Confirm actions</Label>
              <Switch
                id="confirm-actions"
                checked={localSettings.confirmActions}
                onCheckedChange={(checked) => handleChange("confirmActions", checked)}
              />
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>Save Changes</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

