import { NextRequest, NextResponse } from 'next/server'
import { v2 as cloudinary } from 'cloudinary'

// Configurar Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

// POST /api/upload - Subir imagen a Cloudinary
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const folder = (formData.get('folder') as string) || 'general'

    if (!file) {
      return NextResponse.json({ error: 'No se recibió ningún archivo' }, { status: 400 })
    }

    // Validar tipo de archivo (incluir variantes comunes)
    const allowedTypes = [
      'image/jpeg', 
      'image/jpg',
      'image/png', 
      'image/webp', 
      'image/gif',
      'image/heic',
      'image/heif',
    ]
    
    // También verificar por extensión en caso de que el tipo MIME no sea reconocido
    const fileName = file.name.toLowerCase()
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.heic', '.heif']
    const hasValidExtension = allowedExtensions.some(ext => fileName.endsWith(ext))
    
    if (!allowedTypes.includes(file.type) && !hasValidExtension) {
      console.log('File type rejected:', file.type, 'File name:', file.name)
      return NextResponse.json(
        { error: 'Tipo de archivo no permitido. Use JPG, PNG, WEBP o GIF' },
        { status: 400 }
      )
    }

    // Validar tamaño (max 5MB)
    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'El archivo es muy grande. Máximo 5MB' },
        { status: 400 }
      )
    }

    // Convertir archivo a base64 para Cloudinary
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const base64 = buffer.toString('base64')
    const dataUri = `data:${file.type};base64,${base64}`

    // Subir a Cloudinary
    const result = await cloudinary.uploader.upload(dataUri, {
      folder: `inhouse/${folder}`,
      resource_type: 'image',
      transformation: [
        { quality: 'auto:good' },
        { fetch_format: 'auto' },
      ],
    })

    return NextResponse.json({
      url: result.secure_url,
      publicId: result.public_id,
    })
  } catch (error) {
    console.error('Error uploading to Cloudinary:', error)
    return NextResponse.json({ error: 'Error al subir imagen' }, { status: 500 })
  }
}
