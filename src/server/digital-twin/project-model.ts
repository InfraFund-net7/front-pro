import 'server-only';

import { HARDWIRED_PROJECT_MODEL as BASE_MODEL } from '@/lib/project-digital-twin';

export const HARDWIRED_PROJECT_MODEL = {
  ...BASE_MODEL,
  components: BASE_MODEL.components.map((component, index) => ({
    ...component,
    sortOrder: index,
  })),
} as const;
