import { useGmailAuth } from "@/hooks/useGmailAuth";
import { EmailLayout } from "@/components/EmailLayout";
import Login from "./Login";

export default function Dashboard() {
  const { isAuthenticated } = useGmailAuth();

  if (!isAuthenticated) {
    return <Login />;
  }

  return <EmailLayout />;
}
