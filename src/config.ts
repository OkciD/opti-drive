import convict from 'convict';
import path from 'node:path';
import {isNumberObject} from 'node:util/types';

type Route = {
	id: string;
	waypoints: Array<[number, number]>;
	cronExpression: string;
};

export type Config = {
	env: 'production' | 'development';
	app: {
		routes: Route[];
	};
	log: {
		level: 'trace' | 'info' | 'warn' | 'error';
	};
};

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
	name: 'routes-array',
	validate: (routes: Route[], schema: convict.SchemaObj<Route[]>) => {
		if (!Array.isArray(routes)) {
			throw new Error('routes must be of type Array');
		}

		const routeSchema: convict.Schema<Route> = {
			id: {
				format: String,
				doc: 'Human-readable route identifier',
				default: '',
			},
			waypoints: {
				format: 'waypoints',
				doc: '',
				default: [],
			},
			cronExpression: {
				format: String,
				default: '',
			},
		};

		for (const route of routes) {
			convict(routeSchema).load(route).validate();
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
		routes: {
			doc: 'Routes to check',
			format: 'routes-array',
			default: [] as Route[],
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
