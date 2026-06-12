// One-off: rasterize design/app-icon.svg into the PWA/app icons in public/.
// Run: node scripts/gen-icons.mjs   (requires the `sharp` devDependency)
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import sharp from 'sharp'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const src = readFileSync(join(root, 'design', 'app-icon.svg'))

const targets = [
  ['public/icon-192.png', 192],
  ['public/icon-512.png', 512],
  ['public/maskable-512.png', 512],
  ['public/apple-touch-icon.png', 180],
]

for (const [out, size] of targets) {
  await sharp(src, { density: 384 })
    .resize(size, size)
    .png()
    .toFile(join(root, out))
  console.log(`wrote ${out} (${size}px)`)
}
console.log('done')
