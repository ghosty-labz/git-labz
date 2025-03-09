import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
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
    </div>
  );
}
