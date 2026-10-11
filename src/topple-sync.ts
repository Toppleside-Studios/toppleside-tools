#!/usr/bin/env node
import fs from "fs";
import path from "path";
import { execSync } from "child_process";

const targetDir = process.argv[2] ? path.resolve(process.argv[2]) : process.cwd();
const pkgPath = path.join(targetDir, "package.json");

if (!fs.existsSync(pkgPath)) {
	console.error(`❌ No package.json found at target directory: ${targetDir}`);
	process.exit(1);
}

const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
const combinedDeps: Record<string, string> = {
	...pkg.dependencies,
	...pkg.devDependencies,
};

const toppleDeps = Object.keys(combinedDeps).filter((dep) =>
	dep.startsWith("@toppleside/"),
);

if (toppleDeps.length === 0) {
	console.log("ℹ️ No @toppleside dependencies declared in package.json.");
	process.exit(0);
}

console.log(`\n🔄 Syncing ${toppleDeps.length} @toppleside package(s) via yalc in: ${targetDir}\n`);

let hasErrors = false;

for (const dep of toppleDeps) {
	console.log(`📦 Running yalc add for ${dep}...`);
	try {
		// --pure updates files in node_modules without mutating package.json
		execSync(`npx yalc add ${dep} --pure`, {
			cwd: targetDir,
			stdio: "inherit",
		});
	} catch (error) {
		console.error(`❌ Failed to sync ${dep}`);
		hasErrors = true;
	}
}

// Validate peer dependencies required by synced @toppleside packages
const missingPeers: string[] = [];

for (const dep of toppleDeps) {
	const depPkgPath = path.join(targetDir, "node_modules", dep, "package.json");
	if (fs.existsSync(depPkgPath)) {
		try {
			const depPkg = JSON.parse(fs.readFileSync(depPkgPath, "utf-8"));
			if (depPkg.peerDependencies) {
				for (const peer of Object.keys(depPkg.peerDependencies)) {
					// Ignore node-only tool peer dependencies
					if (peer === "cross-env" || peer === "typescript" || peer === "roblox-ts")
						continue;

					const peerInstalled = fs.existsSync(
						path.join(targetDir, "node_modules", peer),
					);
					if (!peerInstalled && !missingPeers.includes(peer))
						missingPeers.push(peer);
				}
			}
		} catch (e) {
			console.warn(`⚠️ Could not parse package.json for ${dep}`);
		}
	}
}

if (missingPeers.length > 0) {
	console.warn("\n⚠️  Missing required peer dependencies in consuming project:");
	missingPeers.forEach((peer) => console.warn(`   - ${peer}`));
	console.warn(
		"Install these packages in the consuming project to ensure roblox-ts and Studio runtime resolution succeed.\n",
	);
}

if (!hasErrors) console.log("✅ Sync completed successfully.\n");