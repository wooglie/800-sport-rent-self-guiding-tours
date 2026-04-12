/**
 * Fire-and-forget trigger for the GitHub Actions "Deploy Tour App" workflow.
 * Called after a tour is created or updated so the self-guided app is rebuilt
 * and redeployed with the latest tour data.
 *
 * If GITHUB_DEPLOY_TOKEN or GITHUB_REPO are not set, this is a no-op —
 * safe to call in all environments without extra configuration.
 */
export async function triggerTourAppDeploy(): Promise<void> {
  const token = process.env.GITHUB_DEPLOY_TOKEN;
  const repo = process.env.GITHUB_REPO; // "owner/repo"
  const workflow = process.env.GITHUB_WORKFLOW_ID ?? "deploy-tour-app.yml";
  const branch = process.env.GITHUB_BRANCH ?? "main";

  if (!token || !repo) return;

  try {
    await fetch(
      `https://api.github.com/repos/${repo}/actions/workflows/${workflow}/dispatches`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github+json",
          "X-GitHub-Api-Version": "2022-11-28",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ref: branch }),
      },
    );
    console.log("Triggered tour app deploy workflow");
    // 204 No Content on success — nothing to parse.
  } catch (err) {
    // A failed deploy trigger must never roll back a successful tour save.
    console.error("triggerTourAppDeploy failed", err);
  }
}
