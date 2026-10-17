import { redirect } from "next/navigation";

/** Game Rules is now the "Game Rules" tab on the Admin page. */
export default function GameRulesRedirect() {
  redirect("/admin");
}
