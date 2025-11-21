import { redirect } from "next/navigation";

export default function Home() {
  // Redirect the root path to the login page so the app opens the login UI by default.
  redirect("/login");
  return null;
}
