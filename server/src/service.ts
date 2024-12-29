import '@/services/auth/sign-up/sign-up.service';
import '@/services/auth/sign-up/check-code.service';

import '@/services/auth/sign-in/sign-in.service';

import '@/services/auth/token/verify.service';

import '@/services/repository/repository-create/repository-create.service';

import '@/services/branch/branch-create/branch-create.service';
import '@/services/branch/branch-push/branch-push.service';

import '@/services/event/create/event-create.service';

/* ------ */
import { framework } from '@/index';
framework.opener();
