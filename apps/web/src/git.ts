import { Octokit, App } from "octokit";

export interface Commit {
  repo: string;
  sha: string;
  message: string;
}

export interface MonthlyCommitStats {
  month: string;
  commits: number;
}

export interface OrgCommitStats {
  stats: MonthlyCommitStats[];
  trendingPercentage: number;
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

/**
 * Returns commit counts for the last 6 months grouped by month,
 * and a trending percentage comparing the current month to the previous month.
 *
 * @param org - The GitHub organization name.
 */
export async function getMonthlyCommitStatsForOrg(
  org: string
): Promise<OrgCommitStats> {
  // Determine the 6-month window (including the current month)
  const now = new Date();
  // Start at the beginning of the month 5 months ago (current month + 5 previous = 6 months)
  const startMonth = new Date(now.getFullYear(), now.getMonth() - 5, 1);

  // Fetch all repositories for the organization
  const repos = await octokit.paginate(octokit.rest.repos.listForOrg, {
    org,
    type: "all",
    per_page: 100,
  });

  // For each repository, fetch all commits since startMonth
  const commitPromises = repos.map(async (repo) => {
    try {
      const commits = await octokit.paginate(octokit.rest.repos.listCommits, {
        owner: org,
        repo: repo.name,
        since: startMonth.toISOString(),
        per_page: 100,
      });
      return commits;
    } catch (error) {
      console.error(`Error fetching commits for repo ${repo.name}:`, error);
      return [];
    }
  });

  const commitsByRepo = await Promise.all(commitPromises);
  // Flatten commits from all repositories into a single array
  const allCommits = commitsByRepo.flat();

  // Build an ordered array of months for the last 6 months.
  // Each element holds a key ("YYYY-M") for mapping and a display month name.
  const statsArray: { key: string; month: string; commits: number }[] = [];
  for (let i = 0; i < 6; i++) {
    const d = new Date(startMonth.getFullYear(), startMonth.getMonth() + i, 1);
    // Use key format "YYYY-M" (month is 0-indexed)
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    const monthName = d.toLocaleString("default", { month: "long" });
    statsArray.push({ key, month: monthName, commits: 0 });
  }

  // Group commits by month based on the commit author date
  allCommits.forEach((commit) => {
    const commitDate = new Date(commit.commit.author.date);
    // Only count commits within our window
    if (commitDate >= startMonth && commitDate <= now) {
      const key = `${commitDate.getFullYear()}-${commitDate.getMonth()}`;
      const monthEntry = statsArray.find((entry) => entry.key === key);
      if (monthEntry) {
        monthEntry.commits += 1;
      }
    }
  });

  // Map the stats to the desired output format (omit the key)
  const monthlyStats: MonthlyCommitStats[] = statsArray.map(
    ({ month, commits }) => ({
      month,
      commits,
    })
  );

  // Calculate trending percentage between the current month and the previous month.
  let trendingPercentage = 0;
  if (monthlyStats.length >= 2) {
    const previousCommits = monthlyStats[monthlyStats.length - 2].commits;
    const currentCommits = monthlyStats[monthlyStats.length - 1].commits;
    // Handle division-by-zero if previous month had no commits.
    if (previousCommits === 0) {
      trendingPercentage = currentCommits > 0 ? 100 : 0;
    } else {
      trendingPercentage =
        ((currentCommits - previousCommits) / previousCommits) * 100;
    }
  }

  return { stats: monthlyStats, trendingPercentage };
}
