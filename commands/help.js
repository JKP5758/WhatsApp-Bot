const fs = require('fs')
const path = require('path')

module.exports = {
    name: 'help',
    description: 'Menampilkan daftar perintah.',
    usage: '/help',
    cooldown: 3,
    aliases: ['h'],
    ownerOnly: false,
    async execute({ reply }) {
        // list file commands — simple, karena logic.js juga menampilkan daftar di startup
        // kita akan baca folder commands untuk generate help
        const commandsDir = path.join(__dirname)
        const files = fs.readdirSync(commandsDir).filter(f => f.endsWith('.js'))
        const lines = []
        for (const file of files) {
            const cmd = require(path.join(commandsDir, file))
            if (!cmd || !cmd.name) continue
            lines.push(`/${cmd.name} - ${cmd.description || '-'}\nUsage: ${cmd.usage || '-'}\n`)
        }
        const helpText = ['📚 Daftar Perintah:', ...lines].join('\n')
        await reply(helpText)
    }
}