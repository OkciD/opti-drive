import puppeteer from 'puppeteer';
import {config} from './config.ts';
import {YaMapsPage} from './YaMapsPage.ts';

const browser = await puppeteer.launch({
	defaultViewport: null,
	...config.get('browser'),
});

const page = new YaMapsPage(browser, {host: config.get('app.yaMapsHost')});
page.open(config.get('app.routes')[0]?.waypoints!);

export {};
