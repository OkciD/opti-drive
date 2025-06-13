import puppeteer from 'puppeteer';
import {config} from './config.ts';
import {YaMapsPage} from './YaMapsPage.ts';
import path from 'node:path';
import {randomUUID} from 'node:crypto';

const browser = await puppeteer.launch({
	defaultViewport: null,
	...config.get('browser'),
});

const page = new YaMapsPage(browser, {
	host: config.get('app.yaMapsHost'),
	screenshotsFolder: path.resolve(
		config.get('app.screenshotsFolder'),
		randomUUID(),
	),
});
page.open(config.get('app.routes')[0]!.waypoints);

export {};
