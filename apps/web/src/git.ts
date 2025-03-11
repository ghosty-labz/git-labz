import { Octokit, App } from "octokit";

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
  const repos = await octokit.rest.repos.listForAuthenticatedUser();
  return repos;
}
