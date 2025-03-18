"use client"

import type React from "react"

import { useState } from "react"
import type { UserSettings } from "@/types/user"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { ThemeToggle } from "@/components/theme-toggle"
import { toast } from "@/hooks/use-toast"

interface SettingsFormProps {
  settings: UserSettings
  onSave: (settings: UserSettings) => Promise<void>
}

export function SettingsForm({ settings, onSave }: SettingsFormProps) {
  const [formData, setFormData] = useState<UserSettings>(settings)
  const [isLoading, setIsLoading] = useState(false)

  const handleChange = (field: keyof UserSettings, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      await onSave(formData)
      toast({
        title: "Settings saved",
        description: "Your profile settings have been updated successfully.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Settings</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="inGameName">In-Game Name</Label>
              <Input
                id="inGameName"
                value={formData.inGameName || ""}
                onChange={(e) => handleChange("inGameName", e.target.value)}
                placeholder="Your display name in the game"
              />
              <p className="text-xs text-gray-500 mt-1">This name will be displayed to other players during games</p>
            </div>

            <div>
              <Label htmlFor="email">Email (Optional)</Label>
              <Input
                id="email"
                type="email"
                value={formData.email || ""}
                onChange={(e) => handleChange("email", e.target.value)}
                placeholder="your.email@example.com"
              />
              <p className="text-xs text-gray-500 mt-1">For notifications and account recovery</p>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="notifications">Notifications</Label>
                <p className="text-xs text-gray-500">Receive game invites and updates</p>
              </div>
              <Switch
                id="notifications"
                checked={formData.notifications}
                onCheckedChange={(checked) => handleChange("notifications", checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="soundEffects">Sound Effects</Label>
                <p className="text-xs text-gray-500">Play sounds during gameplay</p>
              </div>
              <Switch
                id="soundEffects"
                checked={formData.soundEffects}
                onCheckedChange={(checked) => handleChange("soundEffects", checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Theme</Label>
                <p className="text-xs text-gray-500">Choose light or dark mode</p>
              </div>
              <ThemeToggle />
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Saving..." : "Save Settings"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

