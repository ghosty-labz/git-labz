import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { gitTest, gitRepos } from "@/git";

export const Route = createFileRoute("/")({
  component: Index,
  loader: () => gitTest(),
});

const repos = await gitRepos();

function Index() {
  const gitUser = Route.useLoaderData();
  return (
    <div className="min-h-screen">
      <div className="flex mx-auto justify-center bg-white pt-5">
        <h1 className="text-9xl font-bold text-slate-900">
          Git in the Labz 🧪
        </h1>
      </div>
      <div>
        <Button>Click me</Button>
      </div>
      <div>
        <div>{gitUser.login}</div>
        <div>
          <img className="h-10 w-10 rounded-full" src={gitUser.avatar_url} />
        </div>
        <div>{repos.data[0].name}</div>
      </div>
    </div>
  );
}
