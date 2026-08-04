import { createFileRoute } from "@tanstack/react-router";
import { Arena } from "@/components/arena/Arena";

const title = "Tic-Tac-Toe Arena AI — Neon 5-in-a-Row Strategy Game";
const description =
  "Play Tic-Tac-Toe Arena AI: connect 5 on a 5x5 or 7x7 neon board, use bombs, shields and power-ups, and beat four AI difficulty levels in your browser.";

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
  return <Arena />;
}
