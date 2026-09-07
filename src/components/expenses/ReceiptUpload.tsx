import { useRef, useState } from 'react'
import { Camera, X, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { validateReceiptFile } from '@/lib/validation'
import { useToast } from '@/context/ToastContext'

interface ReceiptUploadProps {
  userId: string
  value: string | null
  onChange: (url: string | null) => void
}

const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365

/**
 * Upload d'une photo de facture vers le bucket privé "receipts".
 * Chaque fichier est stocké sous {user_id}/... conformément aux policies RLS
 * du bucket (voir supabase/schema.sql), puis une URL signée longue durée est
 * générée pour l'affichage (le bucket n'étant pas public).
 */
export function ReceiptUpload({ userId, value, onChange }: ReceiptUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const toast = useToast()

  async function handleFile(file: File) {
    const validationError = validateReceiptFile(file)
    if (validationError) {
      toast.error(validationError)
      return
    }

    setUploading(true)
    const ext = file.name.split('.').pop() ?? 'jpg'
    const path = `${userId}/${crypto.randomUUID()}.${ext}`

    const { error: uploadError } = await supabase.storage.from('receipts').upload(path, file, {
      contentType: file.type,
      upsert: false,
    })

    if (uploadError) {
      toast.error("Échec de l'envoi de la photo.")
      setUploading(false)
      return
    }

    const { data: signed, error: signError } = await supabase.storage
      .from('receipts')
      .createSignedUrl(path, ONE_YEAR_SECONDS)

    setUploading(false)
    if (signError || !signed) {
      toast.error("Photo envoyée mais impossible de générer l'aperçu.")
      return
    }
    onChange(signed.signedUrl)
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/heic"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) handleFile(file)
          e.target.value = ''
        }}
      />

      {value ? (
        <div className="relative inline-block">
          <img src={value} alt="Facture" className="h-24 w-24 rounded-xl object-cover" />
          <button
            type="button"
            onClick={() => onChange(null)}
            aria-label="Retirer la photo"
            className="tap-scale absolute -right-2 -top-2 rounded-full bg-black/70 p-1 text-white"
          >
            <X size={14} />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="tap-scale flex h-24 w-24 flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-[var(--border-hairline)] text-[var(--text-muted)]"
        >
          {uploading ? <Loader2 size={20} className="animate-spin" /> : <Camera size={20} />}
          <span className="text-[10px] font-medium">Facture</span>
        </button>
      )}
    </div>
  )
}
