import { GroupMetadata, proto } from 'baileys';
import Table from '../Classes/PgTable.ts';
import Group from '../Classes/Group.ts';
import User from '../Classes/User.ts';
import { TFunction } from 'i18next';
import Bot from '../Classes/Bot.ts';
import postgres from 'postgres';
import { pino } from 'pino';

type Lang = 'py' | 'lua' | 'deno' | 'node' | 'eval' | 'cpp';

type Logger = pino.Logger<{ timestamp: () => str } & pino.ChildLoggerOptions>;

type MsgTypes =
	| 'text'
	| 'image'
	| 'sticker'
	| 'video'
	| 'contact'
	| 'document'
	| 'audio'
	| 'protocol'
	| 'reaction'
	| 'location';

interface Msg {
	id: str;
	chat: str;
	edited: bool;
	text: str;
	type: MsgTypes;
	isMedia: bool;
	raw: proto.IWebMessageInfo;
	quoted: Msg;
}

interface Cmd {
	name?: str;
	aliases?: str[];
	cooldown?: num;
	access?: {
		dm?: bool;
		groups?: bool;
		onlyDevs?: bool;
	};
	react?: bool;
	run?: Function;
}

interface CmdContext {
	msg: Msg;
	user: User;
	group: Group | undefined;
	bot: Bot;
	args: str[];
	cmd: Cmd;
	callCmd: str;
	t: TFunction<'translation', undefined>;
	sendUsage(): Promise<void>;
}

interface GroupMsg {
	author: str;
	count: num;
}

interface pg<T extends Record<string, postgres.PostgresType> = {}> extends
	postgres.Sql<
		Record<string, postgres.PostgresType> extends T ? {}
			: {
				[type in keyof T]: T[type] extends {
					serialize: (value: infer R) => any;
					parse: (raw: any) => infer R;
				} ? R
					: never;
			}
	> {
	users: Table<User>;
	groups: Table<Group>;
	msgs: Table<GroupMsg>;
}
