// commands/show.js
const { query } = require('../db/connection')
const MAX_ROWS = 50

module.exports = {
  name: 'show',
  description: 'Tampilkan DB / tabel / isi tabel. Owner only.',
  usage: '/show db | /show tables | /show table <name> [limit]',
  cooldown: 1,
  aliases: [],
  ownerOnly: true,
  /**
   * context: { reply, args, msg, body, from, sock }
   */
  async execute(context) {
    const { reply, args } = context
    try {
      if (!args || args.length === 0) {
        return await reply([
          'Usage /show:',
          '/show db            - list databases',
          '/show tables        - list tables in configured DB',
          '/show table <name> [limit] - show rows from table (limit default 50)'
        ].join('\n'))
      }

      const sub = args[0].toLowerCase()

      if (sub === 'db' || sub === 'dbs' || sub === 'databases') {
        // show databases
        const rows = await query('SHOW DATABASES')
        const out = rows.map(r => Object.values(r)[0]).join('\n') || '(empty)'
        return await reply(`📚 Databases:\n\`\`\`\n${out}\n\`\`\``)
      }

      if (sub === 'tables' || sub === 'table' && args.length === 1) {
        // list tables in configured DB
        const rows = await query('SHOW TABLES')
        if (!rows || rows.length === 0) return await reply('Tidak ada table di database ini.')
        // rows have key like 'Tables_in_<dbname>'
        const names = rows.map(r => Object.values(r)[0]).join('\n')
        return await reply(`📋 Tables:\n\`\`\`\n${names}\n\`\`\``)
      }

      if (sub === 'table') {
        if (args.length < 2) {
          return await reply('Usage: /show table <name> [limit]')
        }
        const tbl = args[1]
        const limit = Math.min(Number(args[2]) || MAX_ROWS, 1000) // batas aman
        // basic validation: table name alphanumeric + _ (prevent injection)
        if (!/^[a-zA-Z0-9_]+$/.test(tbl)) {
          return await reply('Nama table hanya boleh alfanumerik dan underscore.')
        }

        // Use parameterized query but table name cannot be parameterized -> we sanitize above
        const rows = await query(`SELECT * FROM \`${tbl}\` LIMIT ?`, [limit])
        if (!rows || rows.length === 0) return await reply(`Table \`${tbl}\` kosong atau tidak ada.`)

        // format output; jangan kirim terlalu panjang
        const preview = rows.map(r => JSON.stringify(r)).slice(0, 20).join('\n')
        let out = `Table: ${tbl}\nRows: ${rows.length} (showing up to ${limit})\n\n${preview}`
        if (out.length > 1500) {
          out = out.slice(0, 1400) + '\n... (truncated)'
        }
        return await reply(`\`\`\`\n${out}\n\`\`\``)
      }

      // fallback: unknown subcommand
      return await reply('Subcommand tidak dikenal. Ketik /show untuk bantuan.')

    } catch (e) {
      console.error('show command error', e)
      await reply(`❌ Error saat menjalankan /show: ${String(e.message || e)}`)
    }
  }
}
