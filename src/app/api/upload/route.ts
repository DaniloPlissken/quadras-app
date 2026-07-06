import { NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'Nenhum arquivo enviado.' }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Garantir que a pasta existe
    const uploadDir = join(process.cwd(), 'public', 'uploads', 'documentos')
    await mkdir(uploadDir, { recursive: true })

    // Nome único para o arquivo
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`
    const ext = file.name.split('.').pop()
    const filename = `${uniqueSuffix}.${ext}`
    
    const filePath = join(uploadDir, filename)
    await writeFile(filePath, buffer)

    // Retorna a URL pública
    const url = `/uploads/documentos/${filename}`
    
    return NextResponse.json({ url }, { status: 201 })
  } catch (error) {
    console.error('Erro no upload do arquivo:', error)
    return NextResponse.json({ error: 'Erro ao fazer upload do arquivo.' }, { status: 500 })
  }
}
