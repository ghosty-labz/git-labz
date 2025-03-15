import { Octokit, App } from "octokit";

export interface Commit {
  repo: string;
  sha: string;
  message: string;
}

// Create a personal access token at https://github.com/settings/tokens/new?scopes=repo
const octokit = new Octokit({
  auth: import.meta.env.VITE_GIT_TOKEN,
});

export async function gitTest() {
  // Compare: https://docs.github.com/en/rest/reference/users#get-the-authenticated-user
  const {
    data: { login, avatar_url },
  } = await octokit.rest.users.getAuthenticated();
  return { login, avatar_url };
}

export async function gitRepos() {
  const repos = await octokit.rest.repos.listForOrg({ org: "ghosty-labz" });
  return repos;
}

export async function getCommitsForAllRepos(): Promise<Commit[]> {
  try {
    // Fetch all repositories for the organization "ghosty-labz"
    const reposResponse = await octokit.rest.repos.listForOrg({
      org: "ghosty-labz",
      type: "all",
    });

    const repos = reposResponse.data;

    // Fetch the last 5 commits for each repository concurrently
    const commitPromises: Promise<Commit[]>[] = repos.map(async (repo) => {
      const commitsResponse = await octokit.rest.repos.listCommits({
        owner: "ghosty-labz",
        repo: repo.name,
        per_page: 5,
      });

      return commitsResponse.data.map((commit) => ({
        repo: repo.name,
        sha: commit.sha,
        message: commit.commit.message,
        committer: commit.committer?.login,
        committerAvatar: commit.committer?.avatar_url,
      }));
    });

    // Flatten the array of arrays into one array of commits
    const commitsByRepo = await Promise.all(commitPromises);
    return commitsByRepo.flat().slice(0, 5);
  } catch (error) {
    console.error("Error fetching commits:", error);
    return [];
  }
}

export async function getTotalCommitsForOrg(org: string): Promise<number> {
  let totalCommits = 0;

  // Fetch all repositories for the organization using pagination
  const repos = await octokit.paginate(octokit.rest.repos.listForOrg, {
    org,
    type: "all",
    per_page: 100,
  });

  // For each repository, fetch all contributors (including anonymous ones)
  for (const repo of repos) {
    try {
      const contributors = await octokit.paginate(
        octokit.rest.repos.listContributors,
        {
          owner: org,
          repo: repo.name,
          anon: true,
          per_page: 100,
        }
      );

      // Sum the contributions from each contributor for this repository
      const repoCommitCount = contributors.reduce(
        (acc, contributor) => acc + contributor.contributions,
        0
      );

      totalCommits += repoCommitCount;
    } catch (error) {
      console.error(`Error fetching contributors for ${repo.name}:`, error);
    }
  }

  return totalCommits;
}
