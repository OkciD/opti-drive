import packageJson from '../package.json' with {type: 'json'};

export const sleep = (ms: number) =>
	new Promise((resolve) => {
		setTimeout(resolve, ms);
	});

await sleep(1000);

console.log(`${packageJson.name}@${packageJson.version} start`);

export {};
