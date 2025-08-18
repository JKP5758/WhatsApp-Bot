module.exports = {
    name: 'ping',
    description: 'Menunjukkan ping',
    usage: '/ping',
    cooldown: 3,
    aliases: [],
    ownerOnly: false,
    async execute({ reply }) {
        await reply('*Pong!*')
    }
}
