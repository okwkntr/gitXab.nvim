#!/usr/bin/env -S deno run --allow-env --allow-net --allow-read
/**
 * GitXab Provider Example
 *
 * This script demonstrates how to use the multi-provider support.
 *
 * Usage:
 *   # Auto-detect provider
 *   ./deno-backend/examples/provider_example.ts
 *
 *   # Force GitHub
 *   ./deno-backend/examples/provider_example.ts github
 *
 *   # Force GitLab (not yet implemented)
 *   ./deno-backend/examples/provider_example.ts gitlab
 *
 * Environment variables:
 *   GITHUB_TOKEN or GH_TOKEN - GitHub personal access token
 *   GITLAB_TOKEN - GitLab personal access token
 */

import {
  createProvider,
  detectCurrentProvider,
  type ProviderType,
} from "../mod.ts";

async function main() {
  try {
    // Get provider type from command line or auto-detect
    let providerType: ProviderType | undefined;
    if (Deno.args.length > 0) {
      providerType = Deno.args[0] as ProviderType;
      console.log(`Using specified provider: ${providerType}\n`);
    } else {
      providerType = await detectCurrentProvider();
      console.log(`Auto-detected provider: ${providerType}\n`);
    }

    // Create provider instance
    console.log("Creating provider...");
    const provider = await createProvider({
      provider: providerType,
    });

    console.log(`✓ Connected to ${provider.name} at ${provider.baseUrl}\n`);

    // List repositories
    console.log("Fetching repositories...");
    const repos = await provider.listRepositories();

    if (repos.length === 0) {
      console.log("No repositories found.");
    } else {
      console.log(`\n📦 Found ${repos.length} repositories:\n`);

      // Show first 5 repositories
      for (const repo of repos.slice(0, 5)) {
        console.log(`  ${repo.fullName}`);
        if (repo.description) {
          console.log(`    └─ ${repo.description}`);
        }
        console.log(`    └─ Default branch: ${repo.defaultBranch}`);
        console.log(`    └─ URL: ${repo.url}\n`);
      }

      if (repos.length > 5) {
        console.log(`  ... and ${repos.length - 5} more\n`);
      }
    }

    // If we have repositories, try to get issues from the first one
    if (repos.length > 0) {
      const firstRepo = repos[0];
      const repoId = firstRepo.fullName;

      console.log(`\nFetching issues from ${repoId}...`);

      try {
        const issues = await provider.listIssues(repoId, "open");

        if (issues.length === 0) {
          console.log("No open issues found.");
        } else {
          console.log(`\n🐛 Found ${issues.length} open issues:\n`);

          // Show first 3 issues
          for (const issue of issues.slice(0, 3)) {
            console.log(`  #${issue.number}: ${issue.title}`);
            console.log(`    └─ Author: ${issue.author.username}`);
            console.log(`    └─ State: ${issue.state}`);
            if (issue.labels && issue.labels.length > 0) {
              console.log(`    └─ Labels: ${issue.labels.join(", ")}`);
            }
            console.log(`    └─ URL: ${issue.url}\n`);
          }

          if (issues.length > 3) {
            console.log(`  ... and ${issues.length - 3} more\n`);
          }
        }
      } catch (error) {
        const err = error as Error;
        console.error(`Failed to fetch issues: ${err.message}`);
      }

      // Try to get pull requests
      console.log(`\nFetching pull requests from ${repoId}...`);

      try {
        const prs = await provider.listPullRequests(repoId, "open");

        if (prs.length === 0) {
          console.log("No open pull requests found.");
        } else {
          console.log(`\n🔀 Found ${prs.length} open pull requests:\n`);

          // Show first 3 PRs
          for (const pr of prs.slice(0, 3)) {
            console.log(`  #${pr.number}: ${pr.title}`);
            console.log(`    └─ ${pr.sourceBranch} → ${pr.targetBranch}`);
            console.log(`    └─ Author: ${pr.author.username}`);
            console.log(
              `    └─ State: ${pr.state}${pr.draft ? " (draft)" : ""}`,
            );
            console.log(`    └─ URL: ${pr.url}\n`);
          }

          if (prs.length > 3) {
            console.log(`  ... and ${prs.length - 3} more\n`);
          }
        }
      } catch (error) {
        const err = error as Error;
        console.error(`Failed to fetch pull requests: ${err.message}`);
      }

      // Try to get branches
      console.log(`\nFetching branches from ${repoId}...`);

      try {
        const branches = await provider.listBranches(repoId);

        if (branches.length === 0) {
          console.log("No branches found.");
        } else {
          console.log(`\n🌿 Found ${branches.length} branches:\n`);

          // Show default branch first, then others
          const defaultBranch = branches.find((b) => b.default);
          if (defaultBranch) {
            console.log(
              `  ${defaultBranch.name} (default)${
                defaultBranch.protected ? " 🔒" : ""
              }`,
            );
          }

          const otherBranches = branches.filter((b) => !b.default).slice(0, 4);
          for (const branch of otherBranches) {
            console.log(`  ${branch.name}${branch.protected ? " 🔒" : ""}`);
          }

          if (branches.length > 5) {
            console.log(`  ... and ${branches.length - 5} more`);
          }
        }
      } catch (error) {
        const err = error as Error;
        console.error(`Failed to fetch branches: ${err.message}`);
      }
    }

    console.log("\n✓ Example completed successfully!");
  } catch (error) {
    const err = error as Error;
    console.error("\n❌ Error:", err.message);

    if (err.message.includes("No authentication token")) {
      console.error("\nPlease set one of the following environment variables:");
      console.error("  - GITHUB_TOKEN or GH_TOKEN for GitHub");
      console.error("  - GITLAB_TOKEN for GitLab");
      console.error(
        "\nOr create a config file at ~/.config/gitxab/config.json",
      );
    }

    Deno.exit(1);
  }
}

// Run main function
if (import.meta.main) {
  await main();
}
