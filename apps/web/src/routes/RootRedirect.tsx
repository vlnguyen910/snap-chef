import HomePage from "@/pages/HomePage";

/**
 * RootRedirect Component
 * Handles conditional rendering for the root path (/)
 * - Home is the shared landing page for both authenticated
 *   and unauthenticated users.
 */
export default function RootRedirect() {
  return <HomePage />;
}
