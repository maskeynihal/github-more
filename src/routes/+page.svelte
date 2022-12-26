<script>
	import { fetchRepoByName, getAllBranchesOfRepo, getOctokit } from '$lib/octokit';

	let githubToken = '';
	let formInput = {
		owner: '',
		repo: ''
	};

	/**
	 * @typedef Repo
	 * @type {object}
	 * @property {'idle' | 'loading'} status
	 * @property {Awaited<ReturnType<typeof import('$lib/octokit').fetchRepoByName>> | null} data
	 * @property {string} error
	 */

	/**
	 * @type {Repo}
	 */
	let repo = {
		status: 'idle',
		data: null,
		error: ''
	};

	/**
	 * @typedef Branches
	 * @type {Object}
	 * @property {'idle' | 'loading'} status
	 * @property {ReturnType<typeof import('$lib/octokit').getAllBranchesOfRepo> | null} data
	 * @property {string} error
	 */
	/**
	 * @type {Branches}
	 */
	let branches = {
		status: 'idle',
		data: null,
		error: ''
	};

	/**
	 * @type {import ('octokit').Octokit | null}
	 */
	let octokit;

	let protectedBranches = [];

	/**
	 * @type {Array<string>}
	 */
	let selectedBranches = [];

	let deletedBranches = {};

	/**
	 * Set the github token to use for API.
	 *
	 * @param {string} token
	 */
	const setGithubToken = (token) => {
		octokit = getOctokit(token);
	};

	/**
	 * Serach repo in github.
	 *
	 * @param {{owner: string, repo: string}} input
	 */
	const searchRepo = async (input) => {
		if (!octokit) {
			throw new Error('Github is not setup properly');
		}

		if (!input || !input.owner || !input.repo) {
			repo.error = 'Owner or repo is empty';
		}

		try {
			repo.status = 'loading';
			repo.data = await fetchRepoByName(input, octokit);
		} catch (error) {
			repo.error = error.response.data.message;

			throw error;
		} finally {
			repo.status = 'idle';
		}
	};

	/**
	 * Get branches of repo.
	 *
	 * @param input
	 */
	const getRepoBranches = async (input) => {
		if (!octokit) {
			throw new Error('Github is not setup properly');
		}

		if (!input || !input.owner || !input.repo) {
			repo.error = 'Owner or repo is empty';
		}

		try {
			branches.status = 'loading';
			const branchesIterator = getAllBranchesOfRepo(input, octokit);

			for await (const setOfBranches of branchesIterator) {
				branches.data = [...(branches.data || []), ...setOfBranches.data];

				selectedBranches = branches.data.map(({ name }) => name);
			}

			protectedBranches = branches.data.filter((branch) => branch.protected);
		} catch (error) {
			branches.error = error.response.data.message;

			throw error;
		} finally {
			branches.status = 'idle';
		}
	};

	const handleBranchDelete = async () => {
		const deletionPromises = selectedBranches.map(async (branch) => {
			deletedBranches = {
				...deletedBranches,
				[branch]: { processing: true }
			};

			const deleted = await octokit?.rest.git.deleteRef({
				...formInput,
				ref: `heads/${branch}`
			});

			console.log({ deleted });

			deletedBranches = {
				...deletedBranches,
				[branch]: { ...deletedBranches[branch], deleted: true, processing: false }
			};

			return deleted;
		});

		await Promise.all(deletionPromises);
	};
</script>

<div class="container">
	<div class="p-4">
		<h1>Github More</h1>
	</div>

	<div class="block">
		<input
			type="text"
			name="githubToken"
			placeholder="Enter your github token"
			class="required px-2 border-b border-indigo-500 focus:outline-none focus:border-indigo-800"
			bind:value={githubToken}
		/>

		<button
			class="p-2 bg-indigo-500 hover:bg-indigo-700 text-white rounded-sm"
			on:click={() => setGithubToken(githubToken)}>Use the token</button
		>
	</div>

	{#if octokit}
		<div class="flex flex-row gap-4 mt-8">
			<div class="gap-4">
				<div class="form">
					<input
						type="text"
						class="requred px-2 border-b border-indigo500 focus:outline-none focus:border-indigo-800"
						name="owner"
						placeholder="Enter organization or username"
						bind:value={formInput.owner}
						on:change={() => (repo.error = '')}
					/>

					<input
						type="text"
						class="requred px-2 border-b border-indigo500 focus:outline-none focus:border-indigo-800"
						name="repo"
						placeholder="Enter repo name"
						bind:value={formInput.repo}
						on:change={() => (repo.error = '')}
					/>

					<button
						class="p-2 bg-indigo-500 hover:bg-indigo-700 text-white rounded-sm"
						on:click={() => searchRepo(formInput)}>Search</button
					>
				</div>
				{#if repo.error}
					<p class="text-red-500">{repo.error}</p>
				{/if}
			</div>

			<div>
				<h2>Repo Description</h2>

				{#if repo.status === 'loading'}
					<p>Loading ...</p>
				{:else if !repo.data}
					<p>Write username/organization and repo that you want to search</p>
				{:else}
					<table>
						<tr>
							<th>Repo Name</th>
							<td>{repo.data?.data.name}</td>
						</tr>
						<tr>
							<th>Repo Link</th>
							<td> <a href={repo.data?.data.svn_url}>{repo.data?.data.svn_url}</a></td>
						</tr>
					</table>

					<button on:click={() => getRepoBranches(formInput)}>Get Branches</button>
				{/if}

				{#if branches.data}
					<h2>List of branches</h2>
					<h4>Total Branches: {branches.data?.length}</h4>
					<h5>{selectedBranches.length} of {branches.data?.length} selected</h5>

					<button
						class="bg-red-500 hover:bg-red-700 text-white p-2 rounded-sm"
						on:click={handleBranchDelete}>Delete Unprotected Branches</button
					>

					<ol class="list-decimal">
						{#each branches.data as branch}
							<li>
								<div class="">
									{#if deletedBranches[branch.name] && deletedBranches[branch.name].processing}
										<span class="text-yellow-600">Deleting</span>
									{/if}
									{#if deletedBranches[branch.name] && deletedBranches[branch.name].deleted}
										<span class="text-red-600">Deleted</span>
									{/if}

									<input
										type="checkbox"
										name={`branch[${branch.name}]`}
										id={`branch_${branch.name}`}
										value={branch.name}
										bind:group={selectedBranches}
									/>{branch.name} ({branch.protected ? 'protected' : 'not proteced'})
								</div>
							</li>
						{/each}
					</ol>
				{/if}
				{#if branches.status === 'loading'}
					<p>Loading Branches ...</p>
				{/if}
			</div>
		</div>
	{/if}
</div>
