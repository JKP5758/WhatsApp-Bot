// logic.js
const fs = require('fs')
const path = require('path')

const COMMANDS_DIR = path.join(__dirname, 'commands')
const PREFIX = '/'
const commands = new Map()
const cooldowns = new Map()
// const OWNER_ID = null // optional
require('dotenv').config()
const OWNER_RAW = process.env.OWNER || ''   // "62812...,62813..."
const OWNER_LIST = OWNER_RAW.split(',')
    .map(s => s.trim())
    .filter(Boolean)
    .map(n => {
        // normalisasi: hilangkan + jika ada, pastikan punya domain @s.whatsapp.net
        n = n.replace(/^\+/, '')
        return n.includes('@') ? n : `${n}@s.whatsapp.net`
    })

async function initCommands() {
    commands.clear()
    try {
        if (!fs.existsSync(COMMANDS_DIR)) {
            console.warn('⚠️ Folder commands/ tidak ditemukan:', COMMANDS_DIR)
            return
        }
        const files = fs.readdirSync(COMMANDS_DIR).filter(f => f.endsWith('.js'))
        for (const file of files) {
            const filepath = path.join(COMMANDS_DIR, file)
            // remove cache so we can reload while developing
            delete require.cache[require.resolve(filepath)]
            const cmd = require(filepath)
            if (!cmd || !cmd.name || typeof cmd.execute !== 'function') {
                console.warn(`⚠️ Perintah di ${file} tidak valid, di-skip.`)
                continue
            }
            // store with lowercase name
            commands.set(cmd.name.toLowerCase(), cmd)
            if (Array.isArray(cmd.aliases)) {
                for (const a of cmd.aliases) commands.set(String(a).toLowerCase(), cmd)
            }
            console.log(`🔌 Loaded command: ${cmd.name}`)
        }
        console.log(`✅ Total commands loaded: ${commands.size}`)
    } catch (e) {
        console.error('initCommands error', e)
    }
}

function isOnCooldown(from, command) {
    const key = `${from}|${command}`
    const now = Date.now()
    if (!cooldowns.has(key)) return false
    const expires = cooldowns.get(key)
    if (now > expires) {
        cooldowns.delete(key)
        return false
    }
    return Math.ceil((expires - now) / 1000)
}
function setCooldown(from, command, seconds) {
    const key = `${from}|${command}`
    cooldowns.set(key, Date.now() + seconds * 1000)
}

async function makeReply(sock, from, text, quoted) {
    if (!text) return
    const payload = { text }
    const opts = {}
    if (quoted) opts.quoted = quoted
    await sock.sendMessage(from, payload, opts)
}

function extractTextFromMessage(msg) {
    if (!msg || !msg.message) return ''
    if (msg.message.conversation) return msg.message.conversation
    if (msg.message.extendedTextMessage?.text) return msg.message.extendedTextMessage.text
    if (msg.message.imageMessage?.caption) return msg.message.imageMessage.caption
    if (msg.message.videoMessage?.caption) return msg.message.videoMessage.caption
    return ''
}

async function handleMessage(sock, msg) {
    try {
        const from = msg.key.remoteJid
        const text = extractTextFromMessage(msg)
        if (!text) return
        const body = text.trim()
        console.log(`📩 Pesan dari ${from}: ${body}`)

        // debug: print number of loaded commands
        if (!commands || typeof commands.size === 'undefined') {
            console.warn('⚠️ commands map belum tersedia')
        } else {
            console.log(`🔍 commands map size: ${commands.size}`)
        }

        if (!body.startsWith(PREFIX)) {
            // not a command
            return
        }

        // parse
        const parts = body.slice(PREFIX.length).split(/\s+/)
        const commandName = parts.shift().toLowerCase()
        const args = parts

        const cmd = commands.get(commandName)
        if (!cmd) {
            await makeReply(sock, from, `❌ Command tidak ditemukan. Ketik /help untuk daftar perintah.`, msg)
            return
        }

        if (cmd.ownerOnly && !OWNER_LIST.includes(from)) {
            await makeReply(sock, from, '❌ Command ini hanya bisa digunakan oleh owner.', msg)
            return
        }

        if (cmd.cooldown && cmd.cooldown > 0) {
            const cd = isOnCooldown(from, cmd.name)
            if (cd) {
                await makeReply(sock, from, `⏳ Tunggu ${cd}s lagi sebelum menggunakan /${cmd.name}.`, msg)
                return
            }
            setCooldown(from, cmd.name, cmd.cooldown)
        }

        const context = {
            sock,
            msg,
            from,
            args,
            body,
            reply: async (text, opts) => {
                const quoted = opts?.quoted || msg
                await makeReply(sock, from, text, quoted)
            }
        }

        try {
            await cmd.execute(context)
        } catch (e) {
            console.error(`Error executing ${cmd.name}:`, e)
            await makeReply(sock, from, `❌ Terjadi error saat menjalankan perintah /${cmd.name}.`, msg)
        }

    } catch (e) {
        console.error('handleMessage error:', e)
    }
}

module.exports = { initCommands, handleMessage }
