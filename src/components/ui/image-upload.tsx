'use client'

import { useState, useRef, useId } from 'react'
import { Button } from './button'

interface ImageUploadProps {
  value: string
  onChange: (url: string) => void
  folder?: string
  label?: string
  placeholder?: string
  id?: string
}

export function ImageUpload({
  value,
  onChange,
  folder = 'general',
  label = 'Imagen',
  placeholder = 'https://ejemplo.com/imagen.jpg',
  id,
}: ImageUploadProps) {
  const [mode, setMode] = useState<'upload' | 'url'>('upload')
  const [uploading, setUploading] = useState(false)
  const [urlInput, setUrlInput] = useState(value || '')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  // Generar ID único para cada instancia del componente
  const uniqueId = useId()
  const inputId = id || `file-${folder}-${uniqueId}`

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    setErrorMsg(null)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('folder', folder)

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Error al subir imagen')
      }

      const data = await response.json()
      onChange(data.url)
    } catch (error) {
      console.error('Error uploading:', error)
      setErrorMsg(error instanceof Error ? error.message : 'Error al subir imagen')
    } finally {
      setUploading(false)
    }
  }

  const handleUrlSubmit = () => {
    if (urlInput.trim()) {
      onChange(urlInput.trim())
    }
  }

  const handleRemove = () => {
    onChange('')
    setUrlInput('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">{label}</label>

      {/* Preview */}
      {value && (
        <div className="relative w-full h-32 bg-gray-100 rounded-lg overflow-hidden mb-2">
          <img
            src={value}
            alt="Preview"
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/placeholder.png'
            }}
          />
          <button
            type="button"
            onClick={handleRemove}
            className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600"
          >
            ×
          </button>
        </div>
      )}

      {/* Toggle */}
      <div className="flex gap-2 mb-2">
        <button
          type="button"
          onClick={() => setMode('upload')}
          className={`flex-1 py-1.5 px-3 rounded text-sm font-medium transition-colors ${
            mode === 'upload'
              ? 'bg-primary-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Subir archivo
        </button>
        <button
          type="button"
          onClick={() => setMode('url')}
          className={`flex-1 py-1.5 px-3 rounded text-sm font-medium transition-colors ${
            mode === 'url'
              ? 'bg-primary-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Pegar URL
        </button>
      </div>

      {/* Upload mode */}
      {mode === 'upload' && (
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={handleFileChange}
            className="hidden"
            id={inputId}
          />
          <label
            htmlFor={inputId}
            className={`flex items-center justify-center w-full h-20 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-primary-500 transition-colors ${
              uploading ? 'opacity-50 cursor-wait' : ''
            }`}
          >
            {uploading ? (
              <span className="text-sm text-gray-500">Subiendo...</span>
            ) : (
              <div className="text-center">
                <span className="text-2xl">📷</span>
                <p className="text-sm text-gray-500">Click para seleccionar imagen</p>
                <p className="text-xs text-gray-400">JPG, PNG, WEBP, GIF (max 5MB)</p>
              </div>
            )}
          </label>
        </div>
      )}

      {/* URL mode */}
      {mode === 'url' && (
        <div className="flex gap-2">
          <input
            type="url"
            className="input flex-1"
            placeholder={placeholder}
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
          />
          <Button type="button" size="sm" onClick={handleUrlSubmit}>
            Aplicar
          </Button>
        </div>
      )}
      {errorMsg && (
        <p className="text-xs text-red-600 font-medium mt-1 flex items-center gap-1">
          <span className="material-symbols-outlined text-[14px]">error</span>
          {errorMsg}
        </p>
      )}
    </div>
  )
}
