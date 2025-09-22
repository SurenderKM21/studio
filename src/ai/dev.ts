import { config } from 'dotenv';
config();

import '@/ai/flows/generate-optimal-route.ts';
import '@/ai/flows/classify-zone-density.ts';
import '@/ai/flows/suggest-alternative-routes.ts';
import '@/ai/flows/identify-user-zone.ts';
