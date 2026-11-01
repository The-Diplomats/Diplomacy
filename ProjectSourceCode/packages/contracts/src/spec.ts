import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import yaml from 'js-yaml';
import type { OpenAPIV3_1 } from 'openapi-types';

const specPath = fileURLToPath(new URL('../api/public/openapi.yaml', import.meta.url));

export const openApiSpec = yaml.load(readFileSync(specPath, 'utf-8')) as OpenAPIV3_1.Document;
