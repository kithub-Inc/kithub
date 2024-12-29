import { Framework } from '@/packages/framework';
import { Funk } from '@/packages/framework/funk';
import { Storage } from '@/packages/storage';
import { Mailer } from '@/packages/mailer';
import { Mysql } from '@/packages/mysql';

export const framework = new Framework({ port: 8080 });
new Funk(framework.app, framework.port);

export const storage = new Storage();
export const Mail = new Mailer();
export const mysql = new Mysql();

import '@/service';
