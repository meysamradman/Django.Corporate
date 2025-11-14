"use client"

import { useState } from "react"

import { Button } from "@/components/elements/Button"

export default function TestButtonPage() {
  const [loadingId, setLoadingId] = useState<string | null>(null)

  const handleLoading = (id: string) => {
    setLoadingId(id)
    setTimeout(() => setLoadingId(null), 1500)
  }

  return (
    <div className="flex flex-col gap-8 p-6">
      <section className="space-y-4 rounded-xl border bg-card p-6 shadow-sm">
        <header className="space-y-1">
          <h2 className="text-lg font-semibold">پیش‌نمایش حالت‌های دکمه</h2>
          <p className="text-sm text-muted-foreground">
            هر دکمه طبق variant اصلی است و در حالت لودینگ فقط Spinner و متن جایگزین می‌شوند.
          </p>
        </header>

        <div className="flex flex-wrap gap-4">
          <Button
            onClick={() => handleLoading("default")}
            isLoading={loadingId === "default"}
          >
            دکمه پیش‌فرض
          </Button>

          <Button
            variant="outline"
            onClick={() => handleLoading("outline")}
            isLoading={loadingId === "outline"}
          >
            دکمه Outline
          </Button>

          <Button
            variant="destructive"
            onClick={() => handleLoading("destructive")}
            isLoading={loadingId === "destructive"}
          >
            دکمه خطرناک
          </Button>

          <Button
            size="icon"
            onClick={() => handleLoading("icon")}
            isLoading={loadingId === "icon"}
            aria-label="آیکن"
          >
            {!loadingId && (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                className="size-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="3" x2="21" y1="6" y2="6" />
                <line x1="3" x2="21" y1="12" y2="12" />
                <line x1="3" x2="21" y1="18" y2="18" />
              </svg>
            )}
          </Button>
        </div>
      </section>
    </div>
  )
}

