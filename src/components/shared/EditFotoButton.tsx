"use client"

import { useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Camera, Loader2, X } from "lucide-react"

interface EditFotoButtonProps {
  imagenActual: string | null
  nombre: string
  esFotoPropia: boolean
}

const VALID_TYPES = ["image/jpeg", "image/png", "image/webp"]
const MAX_SIZE = 2 * 1024 * 1024 // 2MB

export function EditFotoButton({ imagenActual, nombre, esFotoPropia }: EditFotoButtonProps) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string | null>(imagenActual)
  const [puedeQuitar, setPuedeQuitar] = useState(esFotoPropia)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleFileSelect(file: File) {
    setError(null)

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

      const res = await fetch("/api/perfil/foto", { method: "POST", body: formData })
      const data = (await res.json()) as { success: boolean; error?: string; data?: { image: string } }

      if (!res.ok || !data.success) {
        setError(data.error ?? "No se pudo subir la foto")
        setPreview(imagenActual)
        return
      }

      setPuedeQuitar(true)
      router.refresh()
    } catch {
      setError("No se pudo conectar")
      setPreview(imagenActual)
    } finally {
      setUploading(false)
    }
  }

  async function handleQuitar() {
    setError(null)
    setUploading(true)
    try {
      const res = await fetch("/api/perfil/foto", { method: "DELETE" })
      const data = (await res.json()) as { success: boolean; error?: string }

      if (!res.ok || !data.success) {
        setError(data.error ?? "No se pudo quitar la foto")
        return
      }

      setPreview(null)
      setPuedeQuitar(false)
      router.refresh()
    } catch {
      setError("No se pudo conectar")
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="flex flex-col gap-1.5">
      <div className="group relative size-14 shrink-0">
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={preview}
            alt={nombre}
            className="size-14 rounded-full object-cover ring-2 ring-border"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="flex size-14 items-center justify-center rounded-full bg-primary/10 text-xl font-bold text-primary">
            {nombre.charAt(0).toUpperCase()}
          </div>
        )}

        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="absolute -bottom-0.5 -right-0.5 flex size-5.5 items-center justify-center rounded-full border-2 border-background bg-primary text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
          title="Cambiar foto"
          aria-label="Cambiar foto de perfil"
        >
          {uploading ? (
            <Loader2 className="size-3 animate-spin" aria-hidden="true" />
          ) : (
            <Camera className="size-3" aria-hidden="true" />
          )}
        </button>
      </div>

      {puedeQuitar && (
        <button
          onClick={handleQuitar}
          disabled={uploading}
          className="flex items-center gap-1 text-[11px] text-muted-foreground transition-colors hover:text-destructive disabled:opacity-50"
        >
          <X className="size-3" aria-hidden="true" />
          Quitar foto
        </button>
      )}

      {error && <p className="max-w-32 text-[11px] text-destructive">{error}</p>}

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
