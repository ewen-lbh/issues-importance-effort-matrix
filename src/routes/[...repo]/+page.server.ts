import type { PageServerLoad, Actions } from './$types';
import { execa } from 'execa';
import { existsSync, readFileSync, mkdirSync } from 'fs';
import { SAVES_DIR } from './consts';
import path from 'path';

export type Issue = {
	number: number;
	title: string;
	url: string;
};
export type SaveData = {
	importance: number[];
	effort: number[];
	git?: string;
};

async function issuesFromGitlab(url: URL): Promise<Issue[]> {
	const { stdout } = await execa(
		'glab',
		['issue', 'list', '-a', '@me', '-R', url.toString(), '-P', '100'],
		{
			cwd: '/home/ewen'
		}
	);

	return stdout
		.split('\n')
		.filter((i: string) => i.startsWith('#'))
		.map((i: string) => {
			const [number, _identifier, title, _labels, _openedAtRelative, ..._rest] = i.split('\t');
			return {
				number: Number(number.replace('#', '')),
				title,
				url: `${url}/-/issues/${number.replace('#', '')}`
			};
		});
}

async function issuesFromGithub(url: URL): Promise<Issue[]> {
	const { stdout } = await execa(
		'gh',
		['issue', 'list', '-R', url.toString(), '-a', '@me', '--json', 'number,title,url'],
		{
			cwd: '/home/ewen'
		}
	);

	return JSON.parse(stdout) as Issue[];
}

export const load: PageServerLoad = async ({ params, url }) => {
	const saveFilepath = path.join(SAVES_DIR, params.repo + '.json');
	console.log(`Using save file ${saveFilepath}...`);

	let saveData: SaveData = {
		importance: [],
		effort: []
	};
	mkdirSync(SAVES_DIR, { recursive: true });
	if (existsSync(saveFilepath)) {
		console.log(JSON.parse(readFileSync(saveFilepath))[params.repo]);
		saveData = JSON.parse(readFileSync(saveFilepath));
		console.log(`Got ${JSON.stringify(saveData)}`);
	}

	const remoteUrl = new URL(
		saveData?.git ?? url.searchParams.get('git') ?? `https://github.com/${params.repo}`
	);

	let issues: Issue[] = [];
	switch (remoteUrl.hostname) {
		case 'github.com':
			issues = await issuesFromGithub(remoteUrl);
			break;
		default:
			issues = await issuesFromGitlab(remoteUrl);
			break;
	}

	let importance = issues.map((i) => i.number);
	let effort = issues.map((i) => i.number);

	const updatedData = (sorteds: SaveData, k: 'importance' | 'effort'): number[] => [
		...issues.map((i) => i.number).filter((no) => !sorteds[k].includes(no)),
		...sorteds[k].filter((no) => issues.map((i) => i.number).includes(no))
	];

	importance = updatedData(saveData, 'importance');
	effort = updatedData(saveData, 'effort');

	return { importance, effort, issues };
};
