module.exports = {
    name: 'say',
    description: 'Bot mengulangi pesan yang kamu tulis.',
    usage: '/say <teks>',
    cooldown: 3,
    aliases: [],
    ownerOnly: false,
    async execute({ reply, args }) {
        if (!args || args.length === 0) {
            await reply('Usage: /say <teks>')
            return
        }
        const text = args.join(' ')
        await reply(text)
    }
}