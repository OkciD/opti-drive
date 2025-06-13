import convict from 'convict';
import {url} from 'convict-format-with-validator';
import path from 'node:path';
import cron from 'cron';

type Route = {
	id: string;
	waypoints: Array<[number, number]>;
	cronExpression: string;
	timeZone: string;
};

export type Config = {
	env: 'production' | 'development';
	app: {
		routes: Route[];
		yaMapsHost: string;
	};
	browser: {
		headless: boolean;
		args: string[];
	};
	log: {
		level: 'trace' | 'info' | 'warn' | 'error';
	};
};

function required<T>(
	schemaObj: Omit<convict.SchemaObj<T>, 'default'>,
): convict.SchemaObj<T> {
	return {
		...schemaObj,
		default: null,
		nullable: false,
	};
}

convict.addFormat({
	name: 'waypoints',
	validate: (waypoints: Route['waypoints']) => {
		if (!Array.isArray(waypoints)) {
			throw new Error('waypoints must be of type Array');
		}

		for (const point of waypoints) {
			if (!Array.isArray(point) || point.length != 2) {
				throw new Error('waypoint must be a tuple of 2 coordinates');
			}

			for (const coordinate of point) {
				if (typeof coordinate != 'number' || isNaN(coordinate)) {
					throw new Error('coordinate must be a number');
				}
			}
		}
	},
});

convict.addFormat({
	name: 'cron-expression',
	validate: (expression: string) => {
		if (!expression) {
			throw new Error('cron expression required');
		}

		const {valid, error} = cron.validateCronExpression(expression);
		if (error) {
			throw error;
		} else if (!valid) {
			throw new Error('unknown cron validation error');
		}
	},
});

convict.addFormat({
	name: 'routes-array',
	validate: (routes: Route[]) => {
		if (!Array.isArray(routes)) {
			throw new Error('routes must be of type Array');
		}

		const routeSchema: convict.Schema<Route> = {
			id: required<string>({
				format: String,
				doc: 'Human-readable route identifier',
			}),
			waypoints: required<Route['waypoints']>({
				format: 'waypoints',
			}),
			cronExpression: required<string>({
				format: 'cron-expression',
			}),
			timeZone: {
				format: String,
				default: 'Europe/Moscow',
			},
		};
		const routeValidationConfig = convict(routeSchema);

		for (const route of routes) {
			routeValidationConfig.load(route).validate();
		}
	},
});

convict.addFormat(url);

convict.addFormat({
	name: 'chrome-args-array',
	validate: function (args: string[]) {
		if (!Array.isArray(args)) {
			throw new Error('must be of type Array');
		}

		if (!args.every((a) => a.startsWith('--'))) {
			throw new Error('arg must start with --');
		}
	},
});

const schema: convict.Schema<Config> = {
	env: {
		doc: 'The application environment',
		format: ['production', 'development'],
		default: 'production',
		env: 'NODE_ENV',
	},
	app: {
		routes: required<Route[]>({
			doc: 'Routes to check',
			format: 'routes-array',
		}),
		yaMapsHost: {
			doc: 'Yandex maps host',
			format: 'url',
			default: 'https://yandex.ru',
		},
	},
	browser: {
		headless: {
			format: Boolean,
			default: false,
		},
		args: {
			format: 'chrome-args-array',
			default: [],
		},
	},
	log: {
		level: {
			doc: 'Log level',
			format: ['trace', 'info', 'warn', 'error'],
			default: 'error',
		},
	},
};

const config = convict(schema);

const env = config.get('env');

config.loadFile(
	[
		path.resolve('config', 'production.json'),
		env !== 'production'
			? path.resolve('config', `${env}.json`)
			: undefined,
	].filter(Boolean) as string[],
);

config.validate({allowed: 'strict'});

export {config};
