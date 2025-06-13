import puppeteer from 'puppeteer';
import type {Waypoints} from './models.ts';

export type YaMapsPageInit = {
	host: string;
};

export class YaMapsPage {
	private page?: puppeteer.Page;

	constructor(
		private readonly browser: puppeteer.Browser,
		private readonly init: YaMapsPageInit,
	) {}

	public async open(waypoints: Waypoints) {
		this.page = await this.browser.newPage();

		const url = new URL('/maps', this.init.host);
		url.searchParams.set('mode', 'routes');
		url.searchParams.set('rtext', this.buildRtext(waypoints));

		await this.page.goto(url.href);
	}

	private buildRtext(waypoints: Waypoints) {
		return waypoints
			.map(([latitude, longitude]) => `${latitude},${longitude}`)
			.join('~');
	}

	public async close() {
		this.page?.close();
	}
}
