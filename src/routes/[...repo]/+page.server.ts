import type { PageServerLoad, Actions } from './$types';
import { execa } from 'execa';
import { existsSync, readFileSync } from 'fs';
import { SAVE_FILE } from './consts';

export type Issue = {
	number: number;
	title: string;
	url: string;
};

export const load: PageServerLoad = async ({ params }) => {
	const { stdout } = await execa('glab', ['issue', 'list', '-R', params.repo, '-P', '100'], {
		cwd: '/home/ewen'
	});

	const issues: Issue[] = stdout
		.split('\n')
		.filter((i: string) => i.startsWith('#'))
		.map((i: string) => {
			const [number, _identifier, title, _labels, _openedAtRelative, ..._rest] = i.split('\t');
			return {
				number: Number(number.replace('#', '')),
				title,
				url: `https://${params.repo}/-/issues/${number.replace('#', '')}`
			};
		});

	let importance = issues.map((i) => i.number);
	let effort = issues.map((i) => i.number);

	const updatedData = (sorteds, k: 'importance'|'effort') => [...issues.map(i => i.number).filter(no => !sorteds[k].includes(no)), ...sorteds[k].filter(no => issues.map(i => i.number).includes(no))]

	if (existsSync(SAVE_FILE)) {
		console.log(`Getting ${params.repo} from ${SAVE_FILE}...`);
		console.log(JSON.parse(readFileSync(SAVE_FILE))[params.repo]);
		const saveData = JSON.parse(readFileSync(SAVE_FILE));
		if (Object.keys(saveData).includes(params.repo)) {
			const sorteds = saveData[params.repo];
			importance = updatedData(sorteds, 'importance');
			effort = updatedData(sorteds, 'effort');
		}
	}

	return { importance, effort, issues };
};
