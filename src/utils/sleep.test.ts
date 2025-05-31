import assert from 'node:assert/strict';
import {test, mock, beforeEach, afterEach} from 'node:test';
import {sleep} from './sleep.ts';

test.suite('sleep', async () => {
	beforeEach(() => {
		mock.timers.enable({apis: ['setTimeout']});
	});

	afterEach(() => {
		mock.timers.reset();
	});

	await test('resolves sleep promise only after the specified time', async () => {
		const [thenMock, catchMock, finallyMock] = [
			mock.fn(),
			mock.fn(),
			mock.fn(),
		];

		const sleepPromise = sleep(1000)
			.then(thenMock)
			.catch(catchMock)
			.finally(finallyMock);

		mock.timers.tick(500);

		assert.strictEqual(
			thenMock.mock.callCount(),
			0,
			'then should not have been called yet',
		);
		assert.strictEqual(
			catchMock.mock.callCount(),
			0,
			'catch should not have been called yet',
		);
		assert.strictEqual(
			finallyMock.mock.callCount(),
			0,
			'finally should not have been called yet',
		);

		mock.timers.tick(1500);

		await sleepPromise;

		assert.strictEqual(
			thenMock.mock.callCount(),
			1,
			'then should have been called',
		);
		assert.strictEqual(
			catchMock.mock.callCount(),
			0,
			'catch should not have been called',
		);
		assert.strictEqual(
			finallyMock.mock.callCount(),
			1,
			'finally should have been called',
		);
	});
});
