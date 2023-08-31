import type { PageServerLoad, Actions } from './$types';
import { execa } from 'execa';
import { existsSync, readFileSync, mkdirSync } from 'fs';
import { SAVES_DIR } from './consts';
import path from 'path';

const IMPORTANCE_LABEL_ORDER = ['low', 'medium', 'high', 'urgent'].map(l => `importance:${l}`);
const EFFORT_LABEL_ORDER = ['braindead', 'easy', 'medium', 'hard', 'unknown'].map(l => `difficulty:${l}`);

export type Issue = {
	number: number;
	title: string;
	url: string;
	labels: string[];
};
export type SaveData = {
	importance: number[];
	effort: number[];
	git?: string;
};

async function getIssues(url: URL, milestone: string | null = null): Promise<Issue[]> {
	if (url.hostname === 'github.com') {
		return await issuesFromGithub(url, milestone);
	}
	return await issuesFromGitlab(url, milestone);
}

async function issuesFromGitlab(url: URL, milestone: string | null): Promise<Issue[]> {
	const { stdout } = await execa('glab', [
		'issue',
		'list',
		// '-a',
		// '@me',
		'-R',
		url.toString(),
		'-P',
		'100',
		...(milestone ? ['-m', milestone] : [])
	]);

	return stdout
		.split('\n')
		.filter((i: string) => i.startsWith('#'))
		.map((i: string) => {
			const [number, _identifier, title, labels, _openedAtRelative, ..._rest] = i.split('\t');
			return {
				number: Number(number.replace('#', '')),
				title,
				labels: labels.replace(/^\(/, '').replace(/\)$/, '').split(', '),
				url: `${url}/-/issues/${number.replace('#', '')}`
			};
		});
}

async function issuesFromGithub(url: URL, milestone: string | null): Promise<Issue[]> {
	console.log(url);
	const { stdout } = await execa('gh', [
		'issue',
		'list',
		'-R',
		url.toString().replace(/^https?:\/\/github.com\//i, ''),
		'-a',
		'@me',
		'--json',
		'number,title,url',
		...(milestone ? ['-m', milestone] : [])
	]);

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

	if (existsSync(saveFilepath) && !url.searchParams.get('reset')) {
		console.log('Save file exists');
		console.log(JSON.parse(readFileSync(saveFilepath))[params.repo]);
		saveData = JSON.parse(readFileSync(saveFilepath));
		console.log(`Got ${JSON.stringify(saveData)}`);
	}

	const remoteUrl = new URL(
		saveData?.git ?? url.searchParams.get('git') ?? `https://github.com/${params.repo}`
	);

	const issues = await getIssues(remoteUrl);

	console.log(issues)

	const issuesInMilestone = await getIssues(remoteUrl, url.searchParams.get('milestone'));

	let importance = issues.sort((a, b) => {
		const importanceLabel = (a: Issue) => a.labels.find((l) => IMPORTANCE_LABEL_ORDER.includes(l));
		const aLabel = importanceLabel(a);
		const bLabel = importanceLabel(b);
		if (!aLabel && !bLabel) return 0;
		if (!aLabel) return 1;
		if (!bLabel) return -1;
		return IMPORTANCE_LABEL_ORDER.indexOf(bLabel) - IMPORTANCE_LABEL_ORDER.indexOf(aLabel);
	} ).map((i) => i.number);
	let effort = issues.sort((a, b) => {
	const effortLabel = (a: Issue) => a.labels.find((l) => EFFORT_LABEL_ORDER.includes(l));
	const aLabel = effortLabel(a);
	const bLabel = effortLabel(b);
	if (!aLabel && !bLabel) return 0;
	if (!aLabel) return 1;
	if (!bLabel) return -1;
	return EFFORT_LABEL_ORDER.indexOf(bLabel) - EFFORT_LABEL_ORDER.indexOf(aLabel);	
	} ).map((i) => i.number);

	const updatedData = (sorteds: SaveData, k: 'importance' | 'effort'): number[] => [
		...issues.map((i) => i.number).filter((no) => !sorteds[k].includes(no)),
		...sorteds[k].filter((no) => issues.map((i) => i.number).includes(no))
	];

	console.log(importance, effort);

	importance = updatedData(saveData, 'importance');
	effort = updatedData(saveData, 'effort');

	return { remoteUrl: {
		hostname: remoteUrl.hostname,
		host: remoteUrl.host,
		pathname: remoteUrl.pathname,
	}, isGitlab: remoteUrl.hostname !== 'github.com' , importance, effort, issues, issuesInMilestone, labels: {
		importance: IMPORTANCE_LABEL_ORDER,
		effort: EFFORT_LABEL_ORDER
	} };
};
