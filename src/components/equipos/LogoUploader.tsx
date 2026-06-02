"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { Upload, Loader2, X } from "lucide-react"
import Image from "next/image"
import { Button } from "@/components/ui/button"

interface LogoUploaderProps {
  equipoId: string
  equipoName: string
  logoUrl: string | null
}

export function LogoUploader({ equipoId, equipoName, logoUrl }: LogoUploaderProps) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(logoUrl)
  const [error, setError] = useState<string | null>(null)

  async function handleFileSelect(file: File) {
    setError(null)
    const VALID_TYPES = ["image/jpeg", "image/png", "image/webp"]
    const MAX_SIZE = 2 * 1024 * 1024

    if (!VALID_TYPES.includes(file.type)) {
      setError("Solo se aceptan JPEG, PNG o WebP")
      return
    }
    if (file.size > MAX_SIZE) {
      setError("El archivo no puede superar 2MB")
      return
    }

    setUploading(true)
    const previewUrl = URL.createObjectURL(file)
    setPreview(previewUrl)

    try {
      const formData = new FormData()
      formData.append("file", file)

      const res = await fetch(`/api/equipos/${equipoId}/logo`, {
        method: "POST",
        body: formData,
      })
      const data = await res.json() as { success: boolean; error?: string; data?: { logoUrl: string } }

      if (!res.ok || !data.success) {
        setError(data.error ?? "Error al subir")
        setPreview(logoUrl)
        return
      }

      router.refresh()
    } catch (err) {
      setError("No se pudo conectar")
      setPreview(logoUrl)
    } finally {
      setUploading(false)
    }
  }

  async function handleDelete() {
    if (!logoUrl) return
    setUploading(true)
    try {
      const res = await fetch(`/api/equipos/${equipoId}/logo`, { method: "DELETE" })
      const data = await res.json() as { success: boolean; error?: string }

      if (!res.ok || !data.success) {
        setError(data.error ?? "No se pudo eliminar")
        return
      }
      setPreview(null)
      router.refresh()
    } catch {
      setError("No se pudo conectar")
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-end gap-4">
        {/* Preview circular */}
        <div className="relative size-24 rounded-lg overflow-hidden border border-border bg-muted flex items-center justify-center shrink-0">
          {preview ? (
            <Image
              src={preview}
              alt={equipoName}
              fill
              className="object-cover"
              unoptimized={preview.startsWith("blob:")}
            />
          ) : (
            <div className="text-center text-muted-foreground">
              <Upload className="size-6 mx-auto mb-1 opacity-50" />
              <span className="text-xs">Logo</span>
            </div>
          )}
        </div>

        {/* Botones */}
        <div className="flex flex-col gap-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-2 px-3 py-2 rounded-lg border border-primary/30 bg-primary/8 text-sm font-medium text-primary hover:bg-primary/15 disabled:opacity-50 transition-colors"
          >
            {uploading ? <Loader2 className="size-3.5 animate-spin" /> : <Upload className="size-3.5" />}
            {uploading ? "Subiendo..." : "Cambiar logo"}
          </button>

          {logoUrl && (
            <button
              onClick={handleDelete}
              disabled={uploading}
              className="flex items-center gap-2 px-3 py-2 rounded-lg border border-destructive/30 text-sm font-medium text-destructive hover:bg-destructive/10 disabled:opacity-50 transition-colors"
            >
              <X className="size-3.5" />
              Quitar
            </button>
          )}
        </div>
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => {
          const file = e.currentTarget.files?.[0]
          if (file) handleFileSelect(file)
          e.currentTarget.value = ""
        }}
        disabled={uploading}
      />
    </div>
  )
}
