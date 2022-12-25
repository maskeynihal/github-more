import { Octokit } from 'octokit';

/**
 * Return the instance of octokit.
 *
 * @param {string} authToken
 * @returns {Octokit}
 */
export const getOctokit = (authToken) => {
	return new Octokit({ auth: authToken });
};

/**
 * Fetch repo details by owner and repo name.
 *
 * @param {{owner: string, repo: string}} parameter1
 * @param {Octokit} octokit
 */
export const fetchRepoByName = async ({ owner, repo }, octokit) => {
	return await octokit.rest.repos.get({ owner, repo });
};

/**
 * Get all the branches of repo.
 *
 * @param {{owner: string, repo: string}} param0
 * @param {Octokit} octokit
 * @returns
 */
export const getAllBranchesOfRepo = ({ owner, repo }, octokit) => {
	return octokit.paginate.iterator(octokit.rest.repos.listBranches, {
		owner,
		repo,
		per_page: 100
	});
};
