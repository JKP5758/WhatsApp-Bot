// connect.js (fixed)
const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys')
const qrcode = require('qrcode-terminal')
const { handleMessage, initCommands } = require('./logic')

async function startSock() {
  // 1) load commands dulu — penting
  await initCommands()

  // 2) show cwd & commands count (debug)
  try {
    console.log('📂 current working dir:', process.cwd())
  } catch (e) {}

  const { state, saveCreds } = await useMultiFileAuthState('auth_info')

  // 3) buat socket
  const sock = makeWASocket({ auth: state })

  // 4) connection update (qr / pairing / reconnect)
  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect, qr, pairingCode } = update

    if (qr) {
      console.log('📷 QR Code untuk login (scan via WhatsApp > Linked Devices > Link a device):')
      qrcode.generate(qr, { small: true })
    }

    if (pairingCode) {
      console.log('🔑 Pairing code:', pairingCode)
    }

    if (connection === 'open') {
      console.log('✅ Bot berhasil connect ke WhatsApp')
    }

    if (connection === 'close') {
      console.log('🔌 Connection closed')
      if ((lastDisconnect?.error?.output?.statusCode) !== DisconnectReason.loggedOut) {
        console.log('🔁 Mencoba reconnect...')
        startSock()
      } else {
        console.log('❌ Sudah logout, hapus sesi dan scan ulang jika perlu.')
      }
    }
  })

  // 5) daftar listener pesan *setelah* commands sudah ter-load
  sock.ev.on('messages.upsert', async ({ messages }) => {
    try {
      for (const msg of messages) {
        if (!msg.message) continue
        if (msg.key && msg.key.remoteJid === 'status@broadcast') continue

        // debug: print commands count tiap pesan
        try {
          const logic = require('./logic')
          console.log(`🔍 commands map size (runtime): ${logic._debugCommandsSize ? logic._debugCommandsSize() : 'unknown'}`)
        } catch (e) {}

        await handleMessage(sock, msg)
      }
    } catch (e) {
      console.error('messages.upsert error', e)
    }
  })

  // simpan kredensial otomatis
  sock.ev.on('creds.update', saveCreds)

  return sock
}

module.exports = { startSock }
