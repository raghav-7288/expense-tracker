import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..");

// ─── CONFIGURATION (customize per project) ───────────────────────
const APP_NAME = "ExpenseTracker";
const APP_DESCRIPTION =
  "A modern personal finance app for tracking income and expenses, managing categories, and visualizing spending with interactive charts. Built with React 19, TypeScript, Supabase, and deployed on Vercel.";
const LIVE_URL = "https://expense-tracker-raghav.vercel.app/";

const KEY_FILES = [
  "src/main.tsx",
  "src/App.tsx",
  "src/lib/supabase.ts",
  "src/lib/queryClient.ts",
  "src/lib/queryKeys.ts",
  "src/context/AuthContext.tsx",
  "src/context/ThemeContext.tsx",
  "src/hooks/useAuth.tsx",
  "src/hooks/useTheme.ts",
  "src/hooks/useTransactions.ts",
  "src/hooks/useCategories.ts",
  "src/hooks/useProfile.ts",
  "src/hooks/useDashboard.ts",
  "src/services/transactions.ts",
  "src/services/categories.ts",
  "src/services/profiles.ts",
  "src/routes/index.tsx",
  "src/layouts/AuthLayout.tsx",
  "src/layouts/DashboardLayout.tsx",
  "src/pages/DashboardPage.tsx",
  "src/pages/TransactionsPage.tsx",
  "src/pages/CategoriesPage.tsx",
  "src/pages/ProfilePage.tsx",
  "src/pages/LoginPage.tsx",
  "src/pages/SignUpPage.tsx",
  "src/pages/ForgotPasswordPage.tsx",
  "src/pages/ResetPasswordPage.tsx",
  "src/components/auth/ProtectedRoute.tsx",
  "src/components/ui/Button.tsx",
  "src/components/ui/Input.tsx",
  "src/components/ui/Modal.tsx",
  "src/components/ui/Card.tsx",
  "src/components/ui/Skeleton.tsx",
  "src/components/ui/ErrorState.tsx",
  "src/components/ErrorBoundary.tsx",
  "src/types/index.ts",
  "src/utils/cn.ts",
  "src/utils/formatCurrency.ts",
  "src/utils/formatDate.ts",
  "src/utils/constants.ts",
];

const ROUTES = [
  { path: "/login", component: "LoginPage", lazy: false },
  { path: "/signup", component: "SignUpPage", lazy: false },
  { path: "/forgot-password", component: "ForgotPasswordPage", lazy: false },
  { path: "/reset-password", component: "ResetPasswordPage", lazy: false },
  { path: "/dashboard", component: "DashboardPage", lazy: false },
  { path: "/transactions", component: "TransactionsPage", lazy: false },
  { path: "/categories", component: "CategoriesPage", lazy: false },
  { path: "/profile", component: "ProfilePage", lazy: false },
  { path: "*", component: "Navigate → /dashboard", lazy: false },
];

const EXCLUDED_DIRS = [
  "node_modules",
  "dist",
  ".git",
  ".idea",
  "coverage",
  "playwright-report",
  "test-results",
];

const MAX_TREE_DEPTH = 4;
// ─────────────────────────────────────────────────────────────────

// ─── HELPERS ─────────────────────────────────────────────────────

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(path.resolve(ROOT, filePath), "utf-8"));
}

function countLines(filePath) {
  const abs = path.resolve(ROOT, filePath);
  if (!fs.existsSync(abs)) return 0;
  return fs.readFileSync(abs, "utf-8").split("\n").length;
}

function extractExports(filePath) {
  const abs = path.resolve(ROOT, filePath);
  if (!fs.existsSync(abs)) return [];
  const content = fs.readFileSync(abs, "utf-8");
  const regex =
    /export\s+(?:async\s+)?(?:function|const|let|var|class|type|interface)\s+(\w+)/g;
  const exports = [];
  let match;
  while ((match = regex.exec(content)) !== null) {
    exports.push(match[1]);
  }
  // Also catch default exports with name
  const defaultMatch = content.match(
    /export\s+default\s+(?:function|class)\s+(\w+)/
  );
  if (defaultMatch) {
    exports.push(`${defaultMatch[1]} (default)`);
  }
  return exports;
}

function buildTree(dir, prefix = "", depth = 0) {
  if (depth >= MAX_TREE_DEPTH) return "";

  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return "";
  }

  // Filter
  entries = entries.filter((e) => {
    if (e.name.startsWith(".")) return false;
    if (EXCLUDED_DIRS.includes(e.name)) return false;
    return true;
  });

  // Sort: folders first, then files, alphabetically
  const folders = entries
    .filter((e) => e.isDirectory())
    .sort((a, b) => a.name.localeCompare(b.name));
  const files = entries
    .filter((e) => !e.isDirectory())
    .sort((a, b) => a.name.localeCompare(b.name));
  const sorted = [...folders, ...files];

  let result = "";
  sorted.forEach((entry, idx) => {
    const isLast = idx === sorted.length - 1;
    const connector = isLast ? "└── " : "├── ";
    const childPrefix = isLast ? "    " : "│   ";
    const name = entry.isDirectory() ? `${entry.name}/` : entry.name;
    result += `${prefix}${connector}${name}\n`;

    if (entry.isDirectory()) {
      result += buildTree(
        path.join(dir, entry.name),
        prefix + childPrefix,
        depth + 1
      );
    }
  });
  return result;
}

function countSourceLines() {
  let total = 0;
  function walk(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name.startsWith(".") || EXCLUDED_DIRS.includes(entry.name))
        continue;
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(full);
      } else if (/\.(ts|tsx|js|jsx|css|sql)$/.test(entry.name)) {
        total += fs.readFileSync(full, "utf-8").split("\n").length;
      }
    }
  }
  walk(ROOT);
  return total;
}

// ─── GENERATE ────────────────────────────────────────────────────

function generate() {
  const pkg = readJson("package.json");
  const now = new Date().toISOString().split("T")[0];
  const totalLines = countSourceLines();

  let md = "";

  // ── 1. Header
  md += `# ${APP_NAME} — Project Context\n\n`;
  md += `> Auto-generated on ${now} | ${totalLines.toLocaleString()} source lines | [${LIVE_URL}](${LIVE_URL})\n\n`;
  md += `---\n\n`;

  // ── 2. Project Overview
  md += `## Project Overview\n\n`;
  md += `${APP_DESCRIPTION}\n\n`;

  // ── 3. Tech Stack
  md += `## Tech Stack\n\n`;
  md += `| Layer | Technology | Version |\n`;
  md += `| ----- | ---------- | ------- |\n`;

  const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };
  const stack = [
    ["Framework", "react", allDeps["react"]],
    ["Language", "typescript", allDeps["typescript"]],
    ["Build", "vite", allDeps["vite"]],
    ["Styling", "tailwindcss", allDeps["tailwindcss"]],
    ["Server State", "@tanstack/react-query", allDeps["@tanstack/react-query"]],
    ["Forms", "react-hook-form", allDeps["react-hook-form"]],
    ["Validation", "zod", allDeps["zod"]],
    ["Routing", "react-router-dom", allDeps["react-router-dom"]],
    ["Backend/Auth", "@supabase/supabase-js", allDeps["@supabase/supabase-js"]],
    ["Charts", "recharts", allDeps["recharts"]],
    ["Icons", "lucide-react", allDeps["lucide-react"]],
    ["Toasts", "react-hot-toast", allDeps["react-hot-toast"]],
    ["Lint", "eslint", allDeps["eslint"]],
  ];
  for (const [layer, tech, version] of stack) {
    md += `| ${layer} | ${tech} | ${version ?? "—"} |\n`;
  }
  md += `\n`;

  // ── 4. Folder Structure
  md += `## Folder Structure\n\n`;
  md += "```\n";
  md += `${APP_NAME.toLowerCase().replace(/\s+/g, "-")}/\n`;
  md += buildTree(ROOT);
  md += "```\n\n";

  // ── 5. File Map & Exports
  md += `## File Map & Exports\n\n`;
  md += `| File | Lines | Exports |\n`;
  md += `| ---- | ----- | ------- |\n`;

  let filesAnalyzed = 0;
  for (const file of KEY_FILES) {
    const lines = countLines(file);
    if (lines === 0) continue;
    filesAnalyzed++;
    const exports = extractExports(file);
    const exportStr = exports.length > 0 ? exports.join(", ") : "—";
    md += `| \`${file}\` | ${lines} | ${exportStr} |\n`;
  }
  md += `\n`;

  // ── 6. Routing
  md += `## Routing\n\n`;
  md += `| Path | Component | Protected | Lazy |\n`;
  md += `| ---- | --------- | --------- | ---- |\n`;
  const protectedPaths = ["/dashboard", "/transactions", "/categories", "/profile"];
  for (const route of ROUTES) {
    const isProtected = protectedPaths.includes(route.path) ? "✅" : "❌";
    md += `| \`${route.path}\` | ${route.component} | ${isProtected} | ${route.lazy ? "✅" : "❌"} |\n`;
  }
  md += `\n`;

  // ── 7. Data Models
  md += `## Data Models\n\n`;
  md += `| Model | Key Fields | Table |\n`;
  md += `| ----- | ---------- | ----- |\n`;
  md += `| Profile | id, email, full_name, currency, avatar_url | \`profiles\` |\n`;
  md += `| Category | id, user_id, name, type, color, icon | \`categories\` |\n`;
  md += `| Transaction | id, user_id, category_id, type, amount, description, date, notes | \`transactions\` |\n`;
  md += `\n`;
  md += `All tables use UUID primary keys, \`created_at\`/\`updated_at\` timestamps, and Row Level Security (users only access own data).\n\n`;

  // ── 8. State Management
  md += `## State Management\n\n`;
  md += `| What | Where | Key/Pattern |\n`;
  md += `| ---- | ----- | ----------- |\n`;
  md += `| Auth (user, session) | React Context | \`AuthContext\` |\n`;
  md += `| Theme (dark mode) | React Context + localStorage | \`expense-tracker-dark-mode\` |\n`;
  md += `| Server data (transactions, categories, profile, dashboard) | TanStack Query cache | \`queryKeys.*\` |\n`;
  md += `| Auth session tokens | Supabase managed (localStorage) | \`expense-tracker-auth\` |\n`;
  md += `| Form state | React Hook Form (local) | per-form instance |\n`;
  md += `\n`;

  // ── 9. Environment Variables
  md += `## Environment Variables\n\n`;
  md += `| Variable | Purpose | Required |\n`;
  md += `| -------- | ------- | -------- |\n`;
  md += `| \`VITE_SUPABASE_URL\` | Supabase project URL | ✅ |\n`;
  md += `| \`VITE_SUPABASE_ANON_KEY\` | Supabase anonymous/public key | ✅ |\n`;
  md += `\n`;

  // ── 10. Scripts
  md += `## Scripts\n\n`;
  md += "```json\n";
  md += JSON.stringify(pkg.scripts, null, 2);
  md += "\n```\n\n";

  // ── 11. Dependencies
  md += `## Dependencies\n\n`;
  md += `### Production\n\n`;
  md += `| Package | Version |\n`;
  md += `| ------- | ------- |\n`;
  for (const [name, version] of Object.entries(pkg.dependencies ?? {}).sort()) {
    md += `| ${name} | ${version} |\n`;
  }
  md += `\n### Dev\n\n`;
  md += `| Package | Version |\n`;
  md += `| ------- | ------- |\n`;
  for (const [name, version] of Object.entries(pkg.devDependencies ?? {}).sort()) {
    md += `| ${name} | ${version} |\n`;
  }
  md += `\n`;

  // ── 12. Testing
  md += `## Testing\n\n`;
  // Count test files
  let testFileCount = 0;
  function countTests(dir) {
    if (!fs.existsSync(dir)) return;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (EXCLUDED_DIRS.includes(entry.name)) continue;
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) countTests(full);
      else if (/\.(test|spec)\.(ts|tsx|js|jsx)$/.test(entry.name)) testFileCount++;
    }
  }
  countTests(ROOT);

  if (testFileCount > 0) {
    md += `- **Framework:** Vitest (recommended)\n`;
    md += `- **Test files:** ${testFileCount}\n`;
    md += `- **Run:** \`npm test\`\n`;
  } else {
    md += `No test framework configured yet. Recommended: Vitest + React Testing Library.\n`;
    md += `\n`;
    md += `\`\`\`bash\n`;
    md += `npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom\n`;
    md += `\`\`\`\n`;
  }
  md += `\n`;

  // ── 13. Deployment
  md += `## Deployment\n\n`;
  md += `| Setting | Value |\n`;
  md += `| ------- | ----- |\n`;
  md += `| Platform | Vercel |\n`;
  md += `| Framework | Vite (auto-detected) |\n`;
  md += `| Build command | \`npm run build\` |\n`;
  md += `| Output directory | \`dist\` |\n`;
  md += `| SPA routing | \`vercel.json\` rewrite → \`/index.html\` |\n`;
  md += `| Environment vars | Set in Vercel dashboard |\n`;
  md += `\n`;

  // ── 14. Design Decisions
  md += `## Design Decisions\n\n`;
  md += `1. **Client-side SPA** — No SSR needed; auth app behind login. Supabase RLS handles authorization.\n`;
  md += `2. **TanStack Query for server state** — Caching, background refetch, optimistic updates, automatic invalidation.\n`;
  md += `3. **React Context for auth & theme** — Needed before TanStack Query hydrates; available on public routes.\n`;
  md += `4. **Services return \`{ data, error }\`** — Consistent with Supabase client pattern; never throw from service layer.\n`;
  md += `5. **Centralized query keys** — \`src/lib/queryKeys.ts\` factory prevents key drift and enables precise invalidation.\n`;
  md += `6. **Optimistic deletes** — Transactions/categories removed from cache immediately; rolled back on error.\n`;
  md += `7. **Dark mode via body class** — CSS overrides with \`body.dark-mode\` + localStorage persistence + FOUC prevention script.\n`;
  md += `8. **Zod for runtime validation** — Single source of truth for form rules; types derived with \`z.infer<>\`.\n`;
  md += `9. **One component per file** — PascalCase filename = default export name.\n`;
  md += `10. **\`@/\` path alias** — All imports from \`src/\` use this; configured in tsconfig + vite.\n`;
  md += `\n`;

  // ── Write
  const outputPath = path.resolve(ROOT, "CONTEXT.md");
  fs.writeFileSync(outputPath, md, "utf-8");

  const outputLines = md.split("\n").length;
  console.log(
    `✅ CONTEXT.md generated (${outputLines} lines), ${filesAnalyzed} files analyzed`
  );
}

generate();

