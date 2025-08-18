// index.js
const { startSock } = require('./connect')

async function main() {
    try {
        await startSock()
        console.log('Launcher: startSock berhasil dijalankan')
    } catch (err) {
        console.error('Launcher error:', err)
        process.exit(1)
    }
}

main()

// graceful shutdown
process.on('SIGINT', () => {
    console.log('SIGINT received, exiting...')
    process.exit(0)
})
process.on('SIGTERM', () => {
    console.log('SIGTERM received, exiting...')
    process.exit(0)
})
