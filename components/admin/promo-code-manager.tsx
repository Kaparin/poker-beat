"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { Loader2, Plus, Trash2, Edit, Eye } from "lucide-react"
import { format } from "date-fns"
import { ru } from "date-fns/locale"

interface PromoCode {
  id: number
  code: string
  reward: number
  description: string | null
  maxUses: number | null
  usedCount: number
  createdAt: string
  expiresAt: string | null
  isActive: boolean
  redemptionsCount: number
}

export default function PromoCodeManager() {
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState<number>(1)
  const [totalPages, setTotalPages] = useState<number>(1)

  // Состояние для формы создания/редактирования
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false)
  const [isEditMode, setIsEditMode] = useState<boolean>(false)
  const [currentPromoCode, setCurrentPromoCode] = useState<Partial<PromoCode> | null>(null)
  const [formCode, setFormCode] = useState<string>("")
  const [formReward, setFormReward] = useState<number>(100)
  const [formDescription, setFormDescription] = useState<string>("")
  const [formMaxUses, setFormMaxUses] = useState<number | null>(null)
  const [formExpiresAt, setFormExpiresAt] = useState<string>("")
  const [formIsActive, setFormIsActive] = useState<boolean>(true)
  const [formSubmitting, setFormSubmitting] = useState<boolean>(false)

  // Состояние для просмотра деталей
  const [detailsDialogOpen, setDetailsDialogOpen] = useState<boolean>(false)
  const [selectedPromoCode, setSelectedPromoCode] = useState<PromoCode | null>(null)
  const [redemptions, setRedemptions] = useState<any[]>([])
  const [loadingDetails, setLoadingDetails] = useState<boolean>(false)

  useEffect(() => {
    fetchPromoCodes()
  }, [page])

  const fetchPromoCodes = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/admin/promo-codes?page=${page}&pageSize=10`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "Ошибка при получении промокодов")
      }

      setPromoCodes(data.promoCodes)
      setTotalPages(data.totalPages)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Произошла неизвестная ошибка")
    } finally {
      setLoading(false)
    }
  }

  const fetchPromoCodeDetails = async (id: number) => {
    setLoadingDetails(true)

    try {
      const response = await fetch(`/api/admin/promo-codes/${id}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "Ошибка при получении деталей промокода")
      }

      setSelectedPromoCode(data.promoCode)
      setRedemptions(data.promoCode.redemptions)
    } catch (err) {
      console.error("Ошибка при получении деталей промокода:", err)
    } finally {
      setLoadingDetails(false)
    }
  }

  const handlePageChange = (newPage: number) => {
    if (newPage > 0 && newPage <= totalPages) {
      setPage(newPage)
    }
  }

  const openCreateDialog = () => {
    setIsEditMode(false)
    setCurrentPromoCode(null)
    setFormCode("")
    setFormReward(100)
    setFormDescription("")
    setFormMaxUses(null)
    setFormExpiresAt("")
    setFormIsActive(true)
    setIsDialogOpen(true)
  }

  const openEditDialog = (promoCode: PromoCode) => {
    setIsEditMode(true)
    setCurrentPromoCode(promoCode)
    setFormCode(promoCode.code)
    setFormReward(promoCode.reward)
    setFormDescription(promoCode.description || "")
    setFormMaxUses(promoCode.maxUses)
    setFormExpiresAt(promoCode.expiresAt ? new Date(promoCode.expiresAt).toISOString().split("T")[0] : "")
    setFormIsActive(promoCode.isActive)
    setIsDialogOpen(true)
  }

  const openDetailsDialog = (promoCode: PromoCode) => {
    setSelectedPromoCode(promoCode)
    fetchPromoCodeDetails(promoCode.id)
    setDetailsDialogOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormSubmitting(true)

    try {
      let response

      if (isEditMode && currentPromoCode) {
        // Обновление существующего промокода
        response = await fetch(`/api/admin/promo-codes/${currentPromoCode.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            reward: formReward,
            description: formDescription || null,
            maxUses: formMaxUses,
            expiresAt: formExpiresAt || null,
            isActive: formIsActive,
          }),
        })
      } else {
        // Создание нового промокода
        response = await fetch("/api/admin/promo-codes", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            code: formCode,
            reward: formReward,
            description: formDescription || null,
            maxUses: formMaxUses,
            expiresAt: formExpiresAt || null,
            isActive: formIsActive,
          }),
        })
      }

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "Произошла ошибка при сохранении промокода")
      }

      // Закрываем диалог и обновляем список
      setIsDialogOpen(false)
      fetchPromoCodes()
    } catch (err) {
      console.error("Ошибка при сохранении промокода:", err)
      alert(err instanceof Error ? err.message : "Произошла неизвестная ошибка")
    } finally {
      setFormSubmitting(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm("Вы уверены, что хотите удалить этот промокод?")) {
      return
    }

    try {
      const response = await fetch(`/api/admin/promo-codes/${id}`, {
        method: "DELETE",
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "Произошла ошибка при удалении промокода")
      }

      // Обновляем список
      fetchPromoCodes()
    } catch (err) {
      console.error("Ошибка при удалении промокода:", err)
      alert(err instanceof Error ? err.message : "Произошла неизвестная ошибка")
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Не указано"
    return format(new Date(dateString), "dd MMM yyyy", { locale: ru })
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Управление промокодами</CardTitle>
            <CardDescription>Создавайте и управляйте промокодами для пользователей</CardDescription>
          </div>
          <Button onClick={openCreateDialog}>
            <Plus className="mr-2 h-4 w-4" />
            Создать промокод
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className="text-center py-8 text-red-500">{error}</div>
        ) : promoCodes.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">Промокоды не найдены</div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Код</TableHead>
                  <TableHead>Награда</TableHead>
                  <TableHead>Использований</TableHead>
                  <TableHead>Срок действия</TableHead>
                  <TableHead>Статус</TableHead>
                  <TableHead>Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {promoCodes.map((promoCode) => (
                  <TableRow key={promoCode.id}>
                    <TableCell className="font-medium">{promoCode.code}</TableCell>
                    <TableCell>{promoCode.reward} фишек</TableCell>
                    <TableCell>
                      {promoCode.usedCount} {promoCode.maxUses ? `/ ${promoCode.maxUses}` : ""}
                    </TableCell>
                    <TableCell>{promoCode.expiresAt ? formatDate(promoCode.expiresAt) : "Бессрочно"}</TableCell>
                    <TableCell>
                      {promoCode.isActive ? (
                        <Badge variant="success">Активен</Badge>
                      ) : (
                        <Badge variant="secondary">Неактивен</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => openDetailsDialog(promoCode)}
                          title="Просмотреть детали"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => openEditDialog(promoCode)}
                          title="Редактировать"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleDelete(promoCode.id)}
                          title="Удалить"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {totalPages > 1 && (
              <Pagination className="mt-4">
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => handlePageChange(page - 1)}
                      className={page === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>

                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    // Логика для отображения страниц вокруг текущей
                    let pageNum
                    if (totalPages <= 5) {
                      pageNum = i + 1
                    } else if (page <= 3) {
                      pageNum = i + 1
                    } else if (page >= totalPages - 2) {
                      pageNum = totalPages - 4 + i
                    } else {
                      pageNum = page - 2 + i
                    }

                    return (
                      <PaginationItem key={i}>
                        <PaginationLink onClick={() => handlePageChange(pageNum)} isActive={pageNum === page}>
                          {pageNum}
                        </PaginationLink>
                      </PaginationItem>
                    )
                  })}

                  <PaginationItem>
                    <PaginationNext
                      onClick={() => handlePageChange(page + 1)}
                      className={page === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            )}
          </>
        )}
      </CardContent>

      {/* Диалог создания/редактирования промокода */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{isEditMode ? "Редактирование промокода" : "Создание промокода"}</DialogTitle>
            <DialogDescription>
              {isEditMode ? "Измените параметры промокода" : "Заполните форму для создания нового промокода"}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              {!isEditMode && (
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="code" className="text-right">
                    Код
                  </Label>
                  <Input
                    id="code"
                    value={formCode}
                    onChange={(e) => setFormCode(e.target.value)}
                    className="col-span-3"
                    required
                  />
                </div>
              )}

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="reward" className="text-right">
                  Награда
                </Label>
                <Input
                  id="reward"
                  type="number"
                  min="1"
                  value={formReward}
                  onChange={(e) => setFormReward(Number.parseInt(e.target.value) || 0)}
                  className="col-span-3"
                  required
                />
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="description" className="text-right">
                  Описание
                </Label>
                <Textarea
                  id="description"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="col-span-3"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="maxUses" className="text-right">
                  Макс. использований
                </Label>
                <Input
                  id="maxUses"
                  type="number"
                  min="1"
                  value={formMaxUses || ""}
                  onChange={(e) => setFormMaxUses(e.target.value ? Number.parseInt(e.target.value) : null)}
                  className="col-span-3"
                  placeholder="Без ограничений"
                />
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="expiresAt" className="text-right">
                  Срок действия
                </Label>
                <Input
                  id="expiresAt"
                  type="date"
                  value={formExpiresAt}
                  onChange={(e) => setFormExpiresAt(e.target.value)}
                  className="col-span-3"
                />
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="isActive" className="text-right">
                  Активен
                </Label>
                <div className="col-span-3 flex items-center space-x-2">
                  <Switch id="isActive" checked={formIsActive} onCheckedChange={setFormIsActive} />
                  <Label htmlFor="isActive">{formIsActive ? "Да" : "Нет"}</Label>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button type="submit" disabled={formSubmitting}>
                {formSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Сохранение...
                  </>
                ) : (
                  "Сохранить"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Диалог просмотра деталей промокода */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Детали промокода</DialogTitle>
            <DialogDescription>Подробная информация о промокоде и его использовании</DialogDescription>
          </DialogHeader>

          {loadingDetails ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : selectedPromoCode ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium">Код</h4>
                  <p className="text-lg font-bold">{selectedPromoCode.code}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium">Награда</h4>
                  <p className="text-lg">{selectedPromoCode.reward} фишек</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium">Создан</h4>
                  <p>{formatDate(selectedPromoCode.createdAt)}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium">Срок действия</h4>
                  <p>{selectedPromoCode.expiresAt ? formatDate(selectedPromoCode.expiresAt) : "Бессрочно"}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium">Использований</h4>
                  <p>
                    {selectedPromoCode.usedCount} {selectedPromoCode.maxUses ? `/ ${selectedPromoCode.maxUses}` : ""}
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-medium">Статус</h4>
                  <p>
                    {selectedPromoCode.isActive ? (
                      <Badge variant="success">Активен</Badge>
                    ) : (
                      <Badge variant="secondary">Неактивен</Badge>
                    )}
                  </p>
                </div>
              </div>

              {selectedPromoCode.description && (
                <div>
                  <h4 className="text-sm font-medium">Описание</h4>
                  <p className="text-muted-foreground">{selectedPromoCode.description}</p>
                </div>
              )}

              <div className="pt-4">
                <h4 className="text-sm font-medium mb-2">История использования</h4>
                {redemptions && redemptions.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Пользователь</TableHead>
                        <TableHead>Дата</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {redemptions.map((redemption) => (
                        <TableRow key={redemption.id}>
                          <TableCell>{redemption.user.username}</TableCell>
                          <TableCell>
                            {format(new Date(redemption.redeemedAt), "dd MMM yyyy, HH:mm", { locale: ru })}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-muted-foreground">Промокод еще не был использован</p>
                )}
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground">Информация не найдена</p>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  )
}

