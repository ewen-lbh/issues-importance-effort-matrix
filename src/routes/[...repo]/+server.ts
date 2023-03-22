import type { RequestHandler } from './$types';
import { SAVE_FILE } from './consts';
import { readFileSync, writeFileSync, existsSync } from 'fs';

export const GET: RequestHandler = async ({ url, params }) => {
	const importance = JSON.parse(url.searchParams.get('importance') ?? '[]');
	const effort = JSON.parse(url.searchParams.get('effort') ?? '[]');

	const otherData = existsSync(SAVE_FILE) ? JSON.parse(readFileSync(SAVE_FILE)) : {};

	const jsoned = JSON.stringify(
		{
			...otherData,
			[params.repo]: { importance, effort }
		},
		null,
		4
	);

	writeFileSync(SAVE_FILE, jsoned);

	return new Response(`Written ${jsoned} to ${SAVE_FILE}`, { status: 200 });
};
