import {config} from './config.ts';

export const sleep = (ms: number) =>
	new Promise((resolve) => {
		setTimeout(resolve, ms);
	});

await sleep(1000);

console.log(config.get('env'), config.get('app.routes'));

export {};
