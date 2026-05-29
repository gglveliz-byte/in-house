import { promises as fs } from 'fs'
import path from 'path'

const APP_DIR = path.resolve(__dirname, '../src/app')
const OUTPUT_PATH = path.resolve(__dirname, '../docs/ROUTES.md')

function normalizeSegment(name: string): string {
  if (name.startsWith('(') && name.endsWith(')')) {
    return ''
  }
  if (name.startsWith('[') && name.endsWith(']')) {
    const param = name.slice(1, -1)
    if (param.startsWith('...')) {
      return `*${param.slice(3) || ''}`
    }
    return `:${param}`
  }
  return name
}

async function walkDirectory(dir: string, baseUrl = ''): Promise<string[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true })
  const routes: string[] = []

  for (const entry of entries) {
    if (entry.name.startsWith('_') || entry.name === 'layout.tsx' || entry.name === 'loading.tsx' || entry.name === 'not-found.tsx') {
      continue
    }

    const absolutePath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      const segment = normalizeSegment(entry.name)
      const childBase = segment ? `${baseUrl}/${segment}` : baseUrl
      routes.push(...await walkDirectory(absolutePath, childBase))
      continue
    }

    if (entry.isFile() && entry.name === 'page.tsx') {
      const route = baseUrl || '/'
      routes.push(route)
    }
  }

  return routes
}

async function writeRoutes() {
  const routes = await walkDirectory(APP_DIR)
  const sorted = Array.from(new Set(routes)).sort((a, b) => a.localeCompare(b))

  const content = [
    '# Inventario de rutas Next.js',
    '',
    'Este archivo se genera automáticamente desde `scripts/scan-next-routes.ts`.',
    '',
    '## Rutas encontradas',
    '',
    ...sorted.map((route) => `- \`${route.replace(/\//g, '/')}\``),
    '',
    '## Nota',
    '',
    '- Las rutas con paréntesis `(group)` son rutas de agrupación internas y no aparecen en la URL final.',
    '- Los segmentos dinámicos se representan como `:param`.',
    '',
  ].join('\n')

  await fs.writeFile(OUTPUT_PATH, content, 'utf8')
  process.stdout.write(`Routes inventory written to ${OUTPUT_PATH}\n`)
}

writeRoutes().catch((error) => {
  console.error('Failed to generate routes:', error)
  process.exit(1)
})
