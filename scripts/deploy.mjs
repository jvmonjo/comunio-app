import sftpClient from 'ssh2-sftp-client'
import path from 'node:path'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, '..')

async function deploy() {
  const sftp = new sftpClient()

  // Load environment variables from .env.deploy
  const envFile = path.resolve(rootDir, '.env.deploy')
  let config = {}
  
  if (fs.existsSync(envFile)) {
    const content = fs.readFileSync(envFile, 'utf8')
    content.split('\n').forEach(line => {
      const [key, value] = line.split('=')
      if (key && value) config[key.trim()] = value.trim()
    })
  } else {
    console.warn('⚠️ No .env.deploy found, using process.env')
    config = process.env
  }

  const host = config.DEPLOY_HOST
  const user = config.DEPLOY_USER || 'root'
  const remotePath = config.DEPLOY_PATH

  if (!host || !remotePath) {
    console.error('❌ Error: DEPLOY_HOST and DEPLOY_PATH must be set in .env.deploy')
    process.exit(1)
  }

  console.log(`🚀 Deploying Edge Functions to ${user}@${host}:${remotePath}...`)

  try {
    const connectOptions = {
      host,
      username: user,
    }

    // Try to find a private key if no password is provided
    const keyPath = config.DEPLOY_KEY_PATH || path.resolve(process.env.USERPROFILE || process.env.HOME || '', '.ssh', 'id_rsa')
    const keyPathEd = config.DEPLOY_KEY_PATH || path.resolve(process.env.USERPROFILE || process.env.HOME || '', '.ssh', 'id_ed25519')
    
    if (fs.existsSync(keyPath)) {
      console.log(`🔑 Using private key: ${keyPath}`)
      connectOptions.privateKey = fs.readFileSync(keyPath)
    } else if (fs.existsSync(keyPathEd)) {
      console.log(`🔑 Using private key: ${keyPathEd}`)
      connectOptions.privateKey = fs.readFileSync(keyPathEd)
    } else {
      console.warn('⚠️ No private key found in default locations. SSH agent or password might be needed.')
    }

    await sftp.connect(connectOptions)

    const localPath = path.resolve(rootDir, 'supabase/functions')
    
    // Upload directory
    // Note: ssh2-sftp-client uploadDir is recursive
    await sftp.uploadDir(localPath, remotePath)

    console.log('✅ Deployment successful!')
  } catch (err) {
    console.error('❌ Deployment failed:', err.message)
    process.exit(1)
  } finally {
    await sftp.end()
  }
}

deploy()
