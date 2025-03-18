"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { format } from "date-fns"
import { ru } from "date-fns/locale"
import { Edit, Trash2, Plus, Search, RefreshCw } from "lucide-react"

interface Bonus {
  id: number
  title: string
  description: string
  type: string
  amount: number
  requiredAction: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
  expiresAt: string | null
}

export const BonusManager: React.FC = () => {
  const [bonuses, setBonuses] = useState<Bonus[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [currentBonus, setCurrentBonus] = useState<Bonus | null>(null)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    type: "welcome",
    amount: 1000,
    requiredAction: "",
    isActive: true,
    expiresAt: "",
  })
  const { toast } = useToast()

  useEffect(() => {
    fetchBonuses()
  }, [activeTab])

  const fetchBonuses = async () => {
    setLoading(true)
    try {
      let url = "/api/admin/bonuses?"

      if (activeTab !== "all") {
        if (activeTab === "active") {
          url += "isActive=true&"
        } else if (activeTab === "inactive") {
          url += "isActive=false&"
        } else {
          url += `type=${activeTab}&`
        }
      }

      if (searchQuery) {
        url += `search=${encodeURIComponent(searchQuery)}&`
      }

      const response = await fetch(url)
      if (!response.ok) {
        throw new Error("Не удалось загрузить бонусы")
      }

      const data = await response.json()
      setBonuses(data.bonuses)
    } catch (error) {
      console.error("Ошибка при загрузке бонусов:", error)
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить бонусы",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCreateBonus = async () => {
    try {
      const response = await fetch("/api/admin/bonuses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        throw new Error("Не удалось создать бонус")
      }

      const data = await response.json()

      toast({
        title: "Успех",
        description: "Бонус успешно создан",
      })

      setIsCreateDialogOpen(false)
      resetForm()
      fetchBonuses()
    } catch (error) {
      console.error("Ошибка при создании бонуса:", error)
      toast({
        title: "Ошибка",
        description: "Не удалось создать бонус",
        variant: "destructive",
      })
    }
  }

  const handleUpdateBonus = async () => {
    if (!currentBonus) return

    try {
      const response = await fetch(`/api/admin/bonuses/${currentBonus.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        throw new Error("Не удалось обновить бонус")
      }

      const data = await response.json()

      toast({
        title: "Успех",
        description: "Бонус успешно обновлен",
      })

      setIsEditDialogOpen(false)
      resetForm()
      fetchBonuses()
    } catch (error) {
      console.error("Ошибка при обновлении бонуса:", error)
      toast({
        title: "Ошибка",
        description: "Не удалось обновить бонус",
        variant: "destructive",
      })
    }
  }

  const handleDeleteBonus = async () => {
    if (!currentBonus) return

    try {
      const response = await fetch(`/api/admin/bonuses/${currentBonus.id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Не удалось удалить бонус")
      }

      toast({
        title: "Успех",
        description: "Бонус успешно удален",
      })

      setIsDeleteDialogOpen(false)
      fetchBonuses()
    } catch (error) {
      console.error("Ошибка при удалении бонуса:", error)
      toast({
        title: "Ошибка",
        description: "Не удалось удалить бонус",
        variant: "destructive",
      })
    }
  }

  const openEditDialog = (bonus: Bonus) => {
    setCurrentBonus(bonus)
    setFormData({
      title: bonus.title,
      description: bonus.description,
      type: bonus.type,
      amount: bonus.amount,
      requiredAction: bonus.requiredAction || "",
      isActive: bonus.isActive,
      expiresAt: bonus.expiresAt ? new Date(bonus.expiresAt).toISOString().split("T")[0] : "",
    })
    setIsEditDialogOpen(true)
  }

  const openDeleteDialog = (bonus: Bonus) => {
    setCurrentBonus(bonus)
    setIsDeleteDialogOpen(true)
  }

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      type: "welcome",
      amount: 1000,
      requiredAction: "",
      isActive: true,
      expiresAt: "",
    })
    setCurrentBonus(null)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSwitchChange = (name: string, checked: boolean) => {
    setFormData((prev) => ({ ...prev, [name]: checked }))
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    fetchBonuses()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Управление бонусами</h2>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Создать бонус
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle>Список бонусов</CardTitle>
            <div className="flex items-center space-x-2">
              <form onSubmit={handleSearch} className="flex items-center space-x-2">
                <Input
                  placeholder="Поиск бонусов..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-64"
                />
                <Button type="submit" variant="outline" size="icon">
                  <Search className="h-4 w-4" />
                </Button>
              </form>
              <Button variant="outline" size="icon" onClick={fetchBonuses}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4 grid w-full grid-cols-7">
              <TabsTrigger value="all">Все</TabsTrigger>
              <TabsTrigger value="active">Активные</TabsTrigger>
              <TabsTrigger value="inactive">Неактивные</TabsTrigger>
              <TabsTrigger value="welcome">Приветственные</TabsTrigger>
              <TabsTrigger value="deposit">Депозит</TabsTrigger>
              <TabsTrigger value="daily">Ежедневные</TabsTrigger>
              <TabsTrigger value="special">Специальные</TabsTrigger>
            </TabsList>

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Название</TableHead>
                    <TableHead>Тип</TableHead>
                    <TableHead>Сумма</TableHead>
                    <TableHead>Статус</TableHead>
                    <TableHead>Срок действия</TableHead>
                    <TableHead>Действия</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-4">
                        Загрузка...
                      </TableCell>
                    </TableRow>
                  ) : bonuses.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-4">
                        Бонусы не найдены
                      </TableCell>
                    </TableRow>
                  ) : (
                    bonuses.map((bonus) => (
                      <TableRow key={bonus.id}>
                        <TableCell>{bonus.id}</TableCell>
                        <TableCell>{bonus.title}</TableCell>
                        <TableCell>
                          {bonus.type === "welcome" && "Приветственный"}
                          {bonus.type === "deposit" && "Депозит"}
                          {bonus.type === "daily" && "Ежедневный"}
                          {bonus.type === "loyalty" && "Лояльность"}
                          {bonus.type === "special" && "Специальный"}
                        </TableCell>
                        <TableCell>{bonus.amount.toLocaleString()} фишек</TableCell>
                        <TableCell>
                          <span
                            className={`px-2 py-1 rounded-full text-xs ${
                              bonus.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                            }`}
                          >
                            {bonus.isActive ? "Активен" : "Неактивен"}
                          </span>
                        </TableCell>
                        <TableCell>
                          {bonus.expiresAt
                            ? format(new Date(bonus.expiresAt), "dd.MM.yyyy", { locale: ru })
                            : "Бессрочно"}
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button variant="outline" size="icon" onClick={() => openEditDialog(bonus)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="icon" onClick={() => openDeleteDialog(bonus)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </Tabs>
        </CardContent>
      </Card>

      {/* Диалог создания бонуса */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Создать новый бонус</DialogTitle>
            <DialogDescription>Заполните форму для создания нового бонуса</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Название</Label>
              <Input id="title" name="title" value={formData.title} onChange={handleInputChange} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Описание</Label>
              <Textarea id="description" name="description" value={formData.description} onChange={handleInputChange} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="type">Тип бонуса</Label>
                <Select value={formData.type} onValueChange={(value) => handleSelectChange("type", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите тип" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="welcome">Приветственный</SelectItem>
                    <SelectItem value="deposit">Депозит</SelectItem>
                    <SelectItem value="daily">Ежедневный</SelectItem>
                    <SelectItem value="loyalty">Лояльность</SelectItem>
                    <SelectItem value="special">Специальный</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="amount">Сумма (фишки)</Label>
                <Input id="amount" name="amount" type="number" value={formData.amount} onChange={handleInputChange} />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="requiredAction">Требуемое действие (опционально)</Label>
              <Input
                id="requiredAction"
                name="requiredAction"
                value={formData.requiredAction}
                onChange={handleInputChange}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="expiresAt">Срок действия (опционально)</Label>
              <Input
                id="expiresAt"
                name="expiresAt"
                type="date"
                value={formData.expiresAt}
                onChange={handleInputChange}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) => handleSwitchChange("isActive", checked)}
              />
              <Label htmlFor="isActive">Активен</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Отмена
            </Button>
            <Button onClick={handleCreateBonus}>Создать</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Диалог редактирования бонуса */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Редактировать бонус</DialogTitle>
            <DialogDescription>Измените параметры бонуса</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-title">Название</Label>
              <Input id="edit-title" name="title" value={formData.title} onChange={handleInputChange} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-description">Описание</Label>
              <Textarea
                id="edit-description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-type">Тип бонуса</Label>
                <Select value={formData.type} onValueChange={(value) => handleSelectChange("type", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите тип" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="welcome">Приветственный</SelectItem>
                    <SelectItem value="deposit">Депозит</SelectItem>
                    <SelectItem value="daily">Ежедневный</SelectItem>
                    <SelectItem value="loyalty">Лояльность</SelectItem>
                    <SelectItem value="special">Специальный</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-amount">Сумма (фишки)</Label>
                <Input
                  id="edit-amount"
                  name="amount"
                  type="number"
                  value={formData.amount}
                  onChange={handleInputChange}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-requiredAction">Требуемое действие (опционально)</Label>
              <Input
                id="edit-requiredAction"
                name="requiredAction"
                value={formData.requiredAction}
                onChange={handleInputChange}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-expiresAt">Срок действия (опционально)</Label>
              <Input
                id="edit-expiresAt"
                name="expiresAt"
                type="date"
                value={formData.expiresAt}
                onChange={handleInputChange}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="edit-isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) => handleSwitchChange("isActive", checked)}
              />
              <Label htmlFor="edit-isActive">Активен</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Отмена
            </Button>
            <Button onClick={handleUpdateBonus}>Сохранить</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Диалог подтверждения удаления */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Вы уверены?</AlertDialogTitle>
            <AlertDialogDescription>
              Это действие нельзя отменить. Бонус будет удален из системы.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteBonus}>Удалить</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

