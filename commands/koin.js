module.exports = {
    name: 'koin',
    description: 'Lempar koin',
    usage: '/koin',
    cooldown: 3,
    aliases: ['coin', 'flip'],
    ownerOnly: false,

    async execute(context) {
        const { sock, msg, reply } = context

        const hasil = Math.random() < 0.5 ? 'Kepala 🪙' : 'Ekor 🪙'

        // pakai reply helper dari context biar aman
        await reply(`🎲 Hasil lempar koin: *${hasil}*`)
    }
}
