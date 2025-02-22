import {
	cleanTemp,
	Cmd,
	CmdCtx,
	delay,
	genStickerMeta,
	isVisual,
	makeTempFile,
	Msg,
	runCode,
} from '../../map.js'
import { Sticker } from 'wa-sticker-formatter'
import { readFile } from 'node:fs/promises'

export default class extends Cmd {
	constructor() {
		super({
			alias: ['s', 'sexo'],
		})
	}

	async run({ msg, bot, args, user, group, sendUsage, t }: CmdCtx) {
		// if (!user.warns.find((i) => i === 'MS')) {
		// 	await bot.send(
		// 		msg,
		// 		'[💡] Agora você pode fazer figurinhas de várias imagens enviando ".s" depois delas.',
		// 	)
		// 	user.warns.push('MS')
		// }

		let target = isVisual(msg.type) ? msg : (isVisual(msg?.quoted?.type) ? msg.quoted : null)
		// target = user msg or user quoted msg

		if (target) return createSticker(target)

		// this logic will create a sticker for each media sent by
		// the user until a msg is not from them
		const msgs = (group || user).msgs.reverse().slice(1)

		for (let i in msgs) {
			if (msgs[i].author !== msg.author || !isVisual(msgs[i].type)) {
				if (i === '0') return sendUsage()
				return
			}

			await createSticker(msgs[i])
			await delay(2_000)
		}

		async function createSticker(target: Msg) {
			// choose between msg media or quoted msg media
			let buffer = await bot.downloadMedia(target)

			if (!Buffer.isBuffer(buffer)) return bot.send(msg, t('sticker.nobuffer'))

			let stickerTypes = ['full', 'crop']
			let quality = 20 // media quality after compression

			switch (target.type) {
				case 'video':
					quality = 10 // videos needs to be more compressed
					// but compress a video too much can cause some glitches on video
					break
				case 'image':
					if (args[0] === 'rmbg') { // remove image background
						const file = await makeTempFile(buffer, 'sticker_', '.webp')
						// create temporary file

						await runCode({ // execute python background remover plugin on
							file: 'plugin/removeBg.py', // a separate thread
							code: `${file} ${file}.png`,
							// cli args
						})
						buffer = await readFile(`${file}.png`) || buffer
						// read new file

						cleanTemp() // clean temp folder
					}
			}

			for (const type of stickerTypes) {
				const metadata = new Sticker(buffer!, { // create sticker metadata
					...genStickerMeta(user, group), // sticker author and pack
					type,
					quality,
				})
				// send several crop types of the same sticker
				await bot.send(msg.chat, await metadata.toMessage())
			}

			return
		}
	}
}
