import puppeteer from 'puppeteer';
import type {Waypoints} from './models.ts';
import path from 'node:path';
import fs from 'node:fs';

export type YaMapsPageInit = {
	host: string;

	screenshotsFolder: string;
};

type LocatorProxy<T extends Record<string, string>> = {
	[K in keyof T]: puppeteer.Locator<puppeteer.NodeFor<T[K]>>;
};

export class YaMapsPage {
	private page?: puppeteer.Page;

	private readonly selectors = {
		main: '.body:has(.map-container)',
	};
	private readonly locators = new Proxy(this.selectors, {
		get: (obj, prop) => {
			if (!this.page) {
				throw new Error(
					`Error accessing locator "${prop.toString()}": page not instantiated`,
				);
			}

			if (typeof prop !== 'string' || !Object.hasOwn(obj, prop)) {
				throw new Error(`Locator "${prop.toString()}" does not exist`);
			}

			return this.page!.locator(obj[prop as keyof typeof obj]);
		},
	}) as unknown as LocatorProxy<typeof this.selectors>;

	constructor(
		private readonly browser: puppeteer.Browser,
		private readonly init: YaMapsPageInit,
	) {
		fs.mkdirSync(this.init.screenshotsFolder, {recursive: true});
	}

	public async open(waypoints: Waypoints) {
		this.page = await this.browser.newPage();

		const url = new URL('/maps', this.init.host);
		url.searchParams.set('mode', 'routes');
		url.searchParams.set('rtext', this.buildRtext(waypoints));

		await this.page.goto(url.href);
		try {
			await this.locators.main.wait();
			this.screenshot('opened');
		} catch {
			this.screenshot('error_opening');
		}
	}

	private buildRtext(waypoints: Waypoints) {
		return waypoints
			.map(([latitude, longitude]) => `${latitude},${longitude}`)
			.join('~');
	}

	public screenshot(name: string) {
		this.page?.screenshot({
			path: `${path.resolve(this.init.screenshotsFolder)}/${name}.png`,
		});
	}

	public async close() {
		this.page?.close();
	}
}
