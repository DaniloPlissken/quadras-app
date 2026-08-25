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

    // No ambiente de homologação na Vercel, o sistema de arquivos é read-only.
    // Portanto, o upload real está desativado temporariamente.
    // Retornamos uma URL fictícia para que o sistema de marcação de documentos funcione.
    
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`
    const ext = file.name.split('.').pop() || 'pdf'
    const filename = `dummy-doc-${uniqueSuffix}.${ext}`
    
    // Retorna a URL pública (mockada)
    const url = `/uploads/documentos/${filename}`
    
    console.log(`[Staging] Upload simulado de arquivo: ${file.name} -> ${url}`)
    
    return NextResponse.json({ url }, { status: 201 })
  } catch (error) {
    console.error('Erro no upload do arquivo:', error)
    return NextResponse.json({ error: 'Erro ao fazer upload do arquivo.' }, { status: 500 })
  }
}
