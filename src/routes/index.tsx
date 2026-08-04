import { createFileRoute } from "@tanstack/react-router";
import { Game } from "@/components/game/Game";

const title = "Escape the Haunted House — 2D Browser Escape Game";
const description =
  "Trapped in a dark haunted house: collect 3 hidden keys, crack the 4-digit door code and escape before the ghost catches you. Play free in your browser.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  return <Game />;
}
