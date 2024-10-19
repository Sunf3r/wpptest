import { DateTime, Duration } from 'luxon'
import { inspect } from 'node:util'
import { getFixedT } from 'i18next'
import { bot } from '../map.js'
import chalk from 'chalk'

// get 'now' date time formatted
const now = () =>
	DateTime.now()
		.setZone(bot.region.timezone)
		.setLocale(bot.region.logLanguage)
		.toFormat('T')

export { now }

export default () => {
	/* String Prototypes */
	Object.defineProperties(String.prototype, {
		//      'deno'.toPascalCase() === 'Deno'
		toPascalCase: {
			value: function () {
				return this.slice(0, 1).toUpperCase() + this.slice(1)
			},
		},
		encode: { // encode strings
			value: function () {
				return '```\n' + this + '```'
			},
		},
		filterForRegex: { // remove some chars that conflict with regex chars
			value: function () {
				return this.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')
			},
		},
		t: { // get locale
			value: function (lang: str) {
				// 'help.menu'.t('en') => 'help menu'
				return getFixedT(lang)(this)
			},
		},
		align: { // align a word between spaces
			value: function (limit: number, endPosition?: boolean) {
				const ratio = (limit - this.length) / 2
				const start = ' '.repeat(Math.ceil(ratio))
				const end = ' '.repeat(Math.floor(ratio))

				if (endPosition) return (end + this + start).slice(0, limit)
				else return (start + this + end).slice(0, limit)
			},
		},
		toMs: { // convert a str on ms
			value: function () { // '10s' => 1_000 * 10
				const match: str[] = this.match(/(\d+)(d|h|m|s|w)/gi)
				if (!match[0]) return 0

				const ms = match
					.map((m) => {
						const quantity = parseInt(m, 10)
						const unit = m.replace(String(quantity), '')

						const duration = Duration.fromObject({
							days: unit === 'd' ? quantity : undefined, // Convert 'd' to 'days'
							hours: unit === 'h' ? quantity : undefined,
							minutes: unit === 'm' ? quantity : undefined,
							seconds: unit === 's' ? quantity : undefined,
							weeks: unit === 'w' ? quantity : undefined,
						})
						return duration.as('milliseconds')
					})
					.reduce((prev, crt) => prev + crt)

				return [ms, match]
			},
		},
	})

	/* Number Prototypes */
	Object.defineProperties(Number.prototype, {
		bytes: { // convert bytes to human readable nums
			value: function (onlyNumbers?: bool) {
				const types = ['B', 'KB', 'MB', 'GB']
				let type = 0
				let number = this

				while (number / 1024 >= 1) {
					type++
					number = number / 1024
				}

				number = number.toFixed()

				// if (number.slice(-2) === '.0') number = number.slice(0, -2);

				return onlyNumbers ? Number(number) : number + types[type]
			},
		},
	})

	/*      console.error        */
	// easier way to print error messages
	console.error = (error: { stack: str }) => {
		const msg = String(error?.stack || error)
			.slice(0, 512)

		console.log('ERROR', msg, 'red')
	}

	/*      console.log        */
	// The same console.log but styled differently
	global.print = console.log = (...args) => { // print() === console.log()
		if (typeof args[0] !== 'string' || !args[2]) {
			if (typeof args[0] === 'object') return console.info(inspect(args[0], { depth: null }))
			console.info(...args)
			return
		}

		const [title, msg, color]: string[] = [...args]

		const str = `[${title.align(12)}| ${now()} | ${
			(process.memoryUsage().rss.bytes() as str).align(6, true)
		}] - ${msg}`

		// console.log(str);
		console.info(chalk.bold[color as 'red'](str))
		// it prints: [ TITLE | 18:04 | 69MB ] - msg (colored)
		return
	}

	print('PROTO', 'All set.', 'yellowBright')
	return
}
