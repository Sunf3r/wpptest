import Command from '../../Components/Classes/Command';
import { CmdContext } from '../../Components/Typings';
import i18next from 'i18next';

export default class extends Command {
	constructor() {
		super({
			aliases: ['lang', 'idioma'],
		});
	}

	async run({ t, bot, args, msg, user, sendUsage }: CmdContext) {
		if (!i18next.languages.includes(args[0])) return sendUsage();

		user.lang = args[0].slice(0, 2);

		await bot.send(msg, t('language', { lng: user.lang }));
		return true;
	}
}