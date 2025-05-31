import {config} from './config.ts';

console.log(config.get('env'), config.get('app.routes'));

export {};
