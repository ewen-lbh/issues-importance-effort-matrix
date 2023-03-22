<script lang="ts">
	import type { PageData, Snapshot } from './$types';
	import type { Issue } from './+page.server';
	import DragDropList, { VerticalDropZone, reorder, type DropEvent } from 'svelte-dnd-list';

	export let data: PageData;
	let importance: number[];
	let effort: number[];
	let issues: Issue[];
	({ importance, effort, issues } = data);

	let sorting: boolean = false;

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
					issues.find(
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
			)}`
		);
	}

	const itemsHeight = 40;

	let dialog;

    let binarySorting = false;
</script>

<input type="checkbox" name="sorting" id="sorting" bind:checked={sorting} on:change={saveChanges} />

<button
	on:click={() => {
		dialog.showModal();
	}}>binsort</button
>

<dialog bind:this={dialog}>
    
</dialog>

{#if sorting}
	<div class="packed">
		<!-- <h2>Importance (current)</h2> -->
		<h2>Importance (new)</h2>
		<!-- <h2>Effort (current)</h2> -->
		<h2>Effort (new)</h2>
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
			<div style:height="{itemsHeight}px" class="issue">
				{issues.find((i) => i.number === importance[index])?.title}
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
			<div style:height="{itemsHeight}px" class="issue">
				{issues.find((i) => i.number === effort[index])?.title}
			</div>
		</DragDropList>
	</div>
{:else}
	<div
		class="matrix"
		style:--rows={issuesMatrix[0]?.length ?? 0}
		style:--cols={issuesMatrix.length}
	>
		{#each issuesMatrix as row}
			{#each row as issue}
				{#if issue}
					<a href={issue.url} title={issue.title}>#{issue.number}</a>
				{:else}
					<div class="empty" />
				{/if}
			{/each}
		{/each}
	</div>
{/if}

<style>
	.matrix {
		display: grid;
		grid-template-columns: repeat(var(--cols), 1fr);
		grid-template-rows: repeat(var(--rows), 1fr);
	}
	.packed {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		height: 90vh;
	}
	.issue {
		font-size: 0.75rem;
		border: 1px solid black;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		/* padding: 0.5em; */
		display: flex;
		justify-content: center;
		align-items: center;
	}
	/* :global([data-dnd-item]) {
        height: unset !important;
    } */
</style>
