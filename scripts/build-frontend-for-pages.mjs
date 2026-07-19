import { cpSync, rmSync } from 'node:fs'
import { resolve } from 'node:path'
import { spawnSync } from 'node:child_process'

const rootDir = process.cwd()
const frontendNextDir = resolve(rootDir, 'frontend', '.next')
const rootNextDir = resolve(rootDir, '.next')

const buildResult = spawnSync(
  process.platform === 'win32' ? 'npm.cmd' : 'npm',
  ['run', 'build', '--workspace', 'frontend'],
  { stdio: 'inherit' }
)

if (buildResult.status !== 0) {
  process.exit(buildResult.status ?? 1)
}

rmSync(rootNextDir, { recursive: true, force: true })
cpSync(frontendNextDir, rootNextDir, { recursive: true })