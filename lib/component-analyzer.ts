"use client"

import type React from "react"

import { useEffect, useState } from "react"

// Типы для анализа компонентов
export type ComponentLoadInfo = {
  name: string
  loadTime: number
  renderTime: number
  size?: number
  dependencies?: string[]
  timestamp: Date
}

// Хранилище информации о загрузке компонентов
const componentLoadStore: Record<string, ComponentLoadInfo[]> = {}

/**
 * Хук для анализа загрузки компонента
 * @param componentName Имя компонента
 */
export function useComponentAnalyzer(componentName: string) {
  const [renderTime, setRenderTime] = useState<number | null>(null)

  useEffect(() => {
    // Измеряем время загрузки компонента
    const loadStart = performance.now()

    return () => {
      // Компонент размонтирован, записываем информацию
      if (renderTime !== null) {
        const loadInfo: ComponentLoadInfo = {
          name: componentName,
          loadTime: performance.now() - loadStart,
          renderTime: renderTime,
          timestamp: new Date(),
        }

        storeComponentLoadInfo(loadInfo)
      }
    }
  }, [componentName, renderTime])

  // Функция для отметки завершения рендеринга
  const markRenderComplete = () => {
    setRenderTime(performance.now())
  }

  return { markRenderComplete }
}

/**
 * Сохранение информации о загрузке компонента
 */
function storeComponentLoadInfo(info: ComponentLoadInfo) {
  if (!componentLoadStore[info.name]) {
    componentLoadStore[info.name] = []
  }

  componentLoadStore[info.name].push(info)

  // Ограничиваем количество записей для каждого компонента
  if (componentLoadStore[info.name].length > 100) {
    componentLoadStore[info.name].shift()
  }
}

/**
 * Получение информации о загрузке компонентов
 */
export function getComponentLoadInfo(componentName?: string): ComponentLoadInfo[] {
  if (componentName) {
    return componentLoadStore[componentName] || []
  }

  // Возвращаем информацию обо всех компонентах
  return Object.values(componentLoadStore).flat()
}

/**
 * Получение агрегированной информации о загрузке компонентов
 */
export function getAggregatedComponentInfo() {
  const allComponents = Object.keys(componentLoadStore)

  return allComponents.map((name) => {
    const infos = componentLoadStore[name]

    if (infos.length === 0) {
      return {
        name,
        avgLoadTime: 0,
        avgRenderTime: 0,
        loadCount: 0,
      }
    }

    const avgLoadTime = infos.reduce((sum, info) => sum + info.loadTime, 0) / infos.length
    const avgRenderTime = infos.reduce((sum, info) => sum + info.renderTime, 0) / infos.length

    return {
      name,
      avgLoadTime,
      avgRenderTime,
      loadCount: infos.length,
    }
  })
}

/**
 * Очистка информации о загрузке компонентов
 */
export function clearComponentLoadInfo() {
  Object.keys(componentLoadStore).forEach((key) => {
    delete componentLoadStore[key]
  })
}

/**
 * HOC для анализа компонента
 */
export function withComponentAnalyzer<P>(Component: React.ComponentType<P>, componentName: string): React.FC<P> {
  return (props: P) => {
    const { markRenderComplete } = useComponentAnalyzer(componentName)

    useEffect(() => {
      // Отмечаем завершение рендеринга в следующем тике
      const timeoutId = setTimeout(markRenderComplete, 0)
      return () => clearTimeout(timeoutId)
    }, [markRenderComplete])

    return <Component {...props} />
  }
}

