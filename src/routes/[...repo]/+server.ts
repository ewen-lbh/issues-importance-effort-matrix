import type { RequestHandler } from './$types';
import { SAVES_DIR } from './consts';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import path from 'path';

export const GET: RequestHandler = async ({ url, params }) => {
	const importance = JSON.parse(url.searchParams.get('importance') ?? '[]');
	const effort = JSON.parse(url.searchParams.get('effort') ?? '[]');

	mkdirSync(SAVES_DIR, { recursive: true });
	const saveFilepath = path.join(SAVES_DIR, params.repo + '.json');
	const otherData = existsSync(saveFilepath) ? JSON.parse(readFileSync(saveFilepath)) : {};

	if (url.searchParams.has("git")) {
		otherData.git = url.searchParams.get("git");
	}

	const jsoned = JSON.stringify({ ...otherData, importance, effort });

	console.log(`Writing ${jsoned} to ${saveFilepath}...`);
	writeFileSync(saveFilepath, jsoned);

	return new Response(`Written ${jsoned} to ${SAVES_DIR}`, { status: 200 });
};
