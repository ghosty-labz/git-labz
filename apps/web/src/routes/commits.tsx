import { createFileRoute } from "@tanstack/react-router";
import { getLatest30CommitsForOrg } from "@/git";

export const Route = createFileRoute("/commits")({
  component: Commits,
  loader: () => getLatest30CommitsForOrg("ghosty-labz"),
});

function Commits() {
  const commits = Route.useLoaderData();
  return (
    <div className="p-2">
      {commits.map((commit) => (
        <div key={commit.sha}>{commit.message}</div>
      ))}
    </div>
  );
}
