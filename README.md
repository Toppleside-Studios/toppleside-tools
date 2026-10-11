# Toppleside Tools
A collection of npm tools that Toppleside uses across various projects.

Notably, `Topple: Sync Dependencies`

## How the Sync Script Works

The `topple-sync` script automates the discovery, local linking, and validation of any `@toppleside/` dependencies inside a target project's `package.json`. 

Here is a breakdown of what the script executes under the hood:

### 1. Target Discovery & Validation
* **Detects Working Directory:** Accepts an optional target directory path via command-line arguments, defaulting to the current working directory (`process.cwd()`).
* **Verifies `package.json`:** Checks if a valid `package.json` exists at the target path, exiting with an error if it is missing.

### 2. Dependency Filtering
* Combines regular dependencies and devDependencies from the target `package.json`.
* Filters out all packages starting with the `@toppleside/` scope. If none are found, the script exits gracefully.

### 3. Automated Local Linking via Yalc
* Iterates through each discovered `@toppleside/` dependency.
* Executes `npx yalc add <package> --pure` inside the target directory:
  * `--pure` updates the files directly inside `node_modules` and the local `.yalc` store *without* mutating the project's `package.json` file.
  * This keeps local development overrides clean and prevents accidental check-ins of local file paths into source control.

### 4. Peer Dependency Verification
* Inspects the installed `@toppleside/*` packages inside `node_modules` to check their declared `peerDependencies`.
* Ignores tool-specific dependencies (such as `cross-env`, `typescript`, or `roblox-ts`).
* Warns developers if any required peer dependencies are missing from the consuming project's `node_modules`, ensuring runtime resolution in Roblox Studio succeeds.