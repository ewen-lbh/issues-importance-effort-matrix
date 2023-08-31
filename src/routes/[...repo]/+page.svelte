<script lang="ts">
	import type { PageData, Snapshot } from './$types';
	import type { Issue } from './+page.server';
	import DragDropList, { VerticalDropZone, reorder, type DropEvent } from 'svelte-dnd-list';
	import { page } from '$app/stores';

	export let data: PageData;
	let importance: number[];
	let effort: number[];
	let issues: Issue[];
	let issuesInMilestone: Issue[];
	({ importance, effort, issues, issuesInMilestone } = data);

	let sorting: boolean = false;
	let categorized = true

	export const snapshot: Snapshot = {
		capture() {
			return {
				sorting
			};
		},
		restore(snapshot) {
			({ sorting } = snapshot);
		}
	};

	let issuesMatrix: (Issue | null)[][] = Array.from({ length: importance.length }, () =>
		Array.from({ length: effort.length }, () => 0)
	);

	$: {
		for (let importanceIndex = 0; importanceIndex < importance.length; importanceIndex++) {
			for (let effortIndex = 0; effortIndex < effort.length; effortIndex++) {
				issuesMatrix[importanceIndex][effortIndex] =
					issuesInMilestone.find(
						(issue) =>
							issue.number === importance[importanceIndex] && issue.number === effort[effortIndex]
					) ?? null;
			}
		}
	}

	async function saveChanges() {
		await fetch(
			`?importance=${encodeURIComponent(JSON.stringify(importance))}&effort=${encodeURIComponent(
				JSON.stringify(effort)
			)}` + ($page.url.searchParams.has('git') ? `&git=${$page.url.searchParams.get('git')}` : ``)
		);
	}

	const itemsHeight = 40;

	let dialog;

	let binarySorting = false;

	const displayIssue = (issues, inside, index) => {
	const issue = issues.find( i => inside[index] === i.number);
	return `${issue?.title} ${issue?.labels.map(l => `~${l}`).join(' ')}`
	}

	function urlIssuesOfLabel(...labels: string[]): string {
		return data.isGitlab ? `https://${data.remoteUrl.host}/${data.remoteUrl.pathname}/-/issues?${labels.map(label => `label_name[]=${encodeURIComponent(
						label
					)}`).join('&')}` : `https://${data.remoteUrl.host}/${data.remoteUrl.pathname}/issues?q=${labels.map(label => `label%3A${encodeURIComponent(
						label
					)}`).join('+')}`
	}
</script>

<input type="checkbox" name="sorting" id="sorting" bind:checked={sorting} on:change={saveChanges} />

{#if categorized}
<div class="matrix"
style:--rows={data.labels.importance.length + 1}
style:--cols={data.labels.effort.length + 1}
>
			<div class="header empty"></div>
			{#each data.labels.effort as label}
				<a href="{urlIssuesOfLabel(label)}" class="header">{label}</a>
			{/each}
		{#each data.labels.importance as im}
		<a href="{urlIssuesOfLabel(im)}" class="header">{im}</a>
			
			{#each data.labels.effort as ef}
				<div class="multiple-issues">
				<a href="{urlIssuesOfLabel(ef, im)}" class="all">all</a>
				{#each data.issues.filter(i => i.labels.includes(ef) && i.labels.includes(im)) as issue }	
				<a title="{issue.title} {issue.labels.filter(l => !l.startsWith('importance:') && !l.startsWith('difficulty:')).map(l => `[${l}]`).join(' ')}" href="https://{data.remoteUrl.host}{data.remoteUrl.pathname}{data.isGitlab ? '/-/issues/' : '/issue/'}{issue.number}">#{issue.number}</a>
				{/each}
				</div>
			{/each}
		{/each}
</div>
{:else if sorting}
	<div class="packed">
		<!-- <h2>Importance (current)</h2> -->
		<h2>Importance </h2>
		<!-- <h2>Effort (current)</h2> -->
		<h2>Effort </h2>
		<!-- <div>
			{#each importance as issueNumber}
				<div class="issue">{issues.find((i) => i.number === issueNumber)?.title}</div>
			{/each}
		</div> -->
		<p>Most important on top</p>
		<p>Easiest on top</p>
		<DragDropList
			type={VerticalDropZone}
			id="importance"
			itemSize={itemsHeight}
			itemCount={importance.length}
			let:index
			on:drop={async ({ detail: { from, to } }) => {
				if (!to || from === to) return;
				importance = reorder(importance, from.index, to.index);
				await saveChanges();
			}}
		>
		<div style:height="{itemsHeight}px" class="issue" title={displayIssue(issues, importance, index)}>
				{displayIssue(issues, importance, index)}
			</div>
		</DragDropList>
		<!-- <div>
			{#each effort as issueNumber}
				<div class="issue">{issues.find((i) => i.number === issueNumber)?.title}</div>
			{/each}
		</div> -->
		<DragDropList
			type={VerticalDropZone}
			id="effort"
			itemSize={itemsHeight}
			itemCount={effort.length}
			let:index
			on:drop={async ({ detail: { from, to } }) => {
				if (!to || from === to) return;
				effort = reorder(effort, from.index, to.index);
				await saveChanges();
			}}
		>
		<div style:height="{itemsHeight}px" class="issue" title={displayIssue(issues, effort, index)}>
				{displayIssue(issues, effort, index)}
			</div>
		</DragDropList>
	</div>
{:else}
	<div
		class="matrix"
		style:--rows={issuesMatrix[0]?.length ?? 0 + 1}
		style:--cols={issuesMatrix.length + 1}
	>
		{#each issuesMatrix as _, j}
			{#if j === 0}
				<div class="header">Important ↓ Easy →</div>
			{:else}
				<div class="empty header" />
			{/if}
		{/each}
		<div class="empty header" />
		{#each issuesMatrix as row, i}
			<div class="empty header" />
			{#each row as issue, j}
				{#if issue}
					<a href={issue.url} title={issue.title}>{issue.number}</a>
				{:else}
					<div class="empty" />
				{/if}
			{/each}
		{/each}
	</div>
{/if}

<style>
	input#sorting {
		position: fixed;
		bottom: 2rem;
		left: 2rem;
		height: 3rem;
		width: 3rem;
	}
	:global(body) {
		height: 100vh;
		margin: 0;
		padding: 0;
		background: #1f1f1f;
		color: white;
	}
	.matrix {
		display: grid;
		grid-template-columns: repeat(var(--cols), 1fr);
		grid-template-rows: repeat(var(--rows), 1fr);
		height: 100%;
	}
	.packed {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		height: 90vh;
	}
	.matrix > * {
		display: flex;
		justify-content: center;
		align-items: center;
		font-size: 1.2em;
		font-family: Space Mono;
		text-decoration: none;
		color: white;
		border: 1px solid rgba(255, 255, 255, 10%);
		font-weight: bold;
	}
	.matrix a:hover,
	.matrix a:focus {
		background: #2f2f2f;
		color: #1dd189;
	}
	.issue {
		border: 1px solid rgba(255, 255, 255, 10%);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		/* padding: 0.5em; */
		display: flex;
		justify-content: center;
		align-items: center;
		font-size: 0.75rem;
	}
	/* :global([data-dnd-item]) {
        height: unset !important;
    } */

	.multiple-issues {
		display: flex;
		flex-wrap: wrap;
		gap: 1rem;
		justify-content: space-evenly;
		align-items: center;

		
	}
	.multiple-issues a {
		text-decoration: none;
		color: white;
	}
</style>
