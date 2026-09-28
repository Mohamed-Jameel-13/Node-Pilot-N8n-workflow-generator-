import { cpSync, rmSync, existsSync, symlinkSync } from 'node:fs'
import { resolve } from 'node:path'
import { spawnSync } from 'node:child_process'

const rootDir = process.cwd()
const frontendNextDir = resolve(rootDir, 'frontend', '.next')
const rootNextDir = resolve(rootDir, '.next')
const rootNodeModules = resolve(rootDir, 'node_modules')

// Ensure root node_modules resolves React 19 to avoid dual React dispatcher collision
if (existsSync(rootNodeModules)) {
  for (const pkg of ['react', 'react-dom']) {
    const rootPkg = resolve(rootNodeModules, pkg)
    const frontendPkg = resolve(rootDir, 'frontend', 'node_modules', pkg)
    if (!existsSync(rootPkg) && existsSync(frontendPkg)) {
      try {
        symlinkSync(frontendPkg, rootPkg, 'junction')
      } catch {}
    }
  }
}

const buildResult = spawnSync(
  process.platform === 'win32' ? 'npm.cmd' : 'npm',
  ['run', 'build', '--workspace', 'frontend'],
  { stdio: 'inherit', shell: process.platform === 'win32' }
)

if (buildResult.status !== 0) {
  process.exit(buildResult.status ?? 1)
}

rmSync(rootNextDir, { recursive: true, force: true })
cpSync(frontendNextDir, rootNextDir, { recursive: true })