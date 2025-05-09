import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import {
  gitTest,
  gitRepos,
  getCommitsForAllRepos,
  getTotalCommitsForOrg,
  getMonthlyCommitStatsForOrg,
} from "@/git";
import {
  GitCommitHorizontal,
  GitMerge,
  Rocket,
  GitCommitVertical,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CommitChart } from "@/components/charts/testChart";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export const Route = createFileRoute("/")({
  component: Index,
  loader: () => gitTest(),
});

const repos = await gitRepos();
const commits = await getCommitsForAllRepos();
const totalCommits = await getTotalCommitsForOrg("ghosty-labz");
const { stats, trendingPercentage } =
  await getMonthlyCommitStatsForOrg("ghosty-labz");

function Index() {
  const gitUser = Route.useLoaderData();
  return (
    <div className="min-h-screen">
      <div className="flex mx-auto justify-center bg-white pt-5 pb-5">
        <h1 className="text-9xl font-bold text-slate-900">
          Git in the Labz 🧪
        </h1>
      </div>
      <div className="flex mx-auto justify-center">
        <div className="p-4">
          <div>
            <Button>Click me</Button>
          </div>
          <div>
            <div>{gitUser.login}</div>
            <div>
              <img
                className="h-10 w-10 rounded-full"
                src={gitUser.avatar_url}
              />
            </div>
            {repos.data.map((repo) => (
              <div key={repo.id}>{repo.name}</div>
            ))}
            <div>
              <Select>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Theme" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">Light</SelectItem>
                  <SelectItem value="dark">Dark</SelectItem>
                  <SelectItem value="system">System</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 p-4 max-w-3/4 mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="flex justify-between">
              <div>Total Commits</div>
              <GitCommitHorizontal />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+{totalCommits}</div>
            <p className="text-xs text-muted-foreground">
              some cool stuff here
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex justify-between">
              <div>Total Merges</div>
              <GitMerge />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+170</div>
            <p className="text-xs text-muted-foreground">
              some cool stuff here
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex justify-between">
              <div>Total Deployments</div>
              <Rocket />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+2,000</div>
            <p className="text-xs text-muted-foreground">
              some cool stuff here
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex justify-between">
              <div>Total Commits</div>
              <GitCommitHorizontal />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+2,000</div>
            <p className="text-xs text-muted-foreground">
              some cool stuff here
            </p>
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7 p-4 max-w-3/4 mx-auto">
        <CommitChart stats={stats} trendingPercentage={trendingPercentage} />
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle className="flex justify-between">
              <div>Recent Commits</div>
              <GitCommitHorizontal />
            </CardTitle>
          </CardHeader>
          <CardContent>
            {commits.map((commit) => (
              <div className="border-2 rounded-md mb-2" key={commit.sha}>
                <div>
                  <div className="border-b-2 flex">
                    <div className="p-2">
                      <Avatar>
                        <AvatarImage src={commit.committerAvatar} />
                        <AvatarFallback>GV</AvatarFallback>
                      </Avatar>
                    </div>
                    <div className="p-2">
                      [{commit.repo}] {commit.message}
                    </div>
                  </div>
                  <div className="flex p-2">
                    <div className="flex">
                      <GitCommitVertical />
                      <span>{commit.sha.slice(0, 7)}</span>
                    </div>
                    <div className="ml-2">{commit.committer}</div>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
      <div className="h-12 max-w-3/4 mx-auto">Footer Stuff</div>
    </div>
  );
}
