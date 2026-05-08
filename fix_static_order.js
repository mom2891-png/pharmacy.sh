const fs = require("fs");
let content = fs.readFileSync("backend/server.js", "utf8");

// The problem: express.static is placed BEFORE API routes, causing it to intercept them.
// Solution: Move express.static to AFTER all API routes (just before 404 handler).

// 1. Remove the static declaration from the top
const topStaticBlock = [
  "// [FIX]",
  "const rootDir = path.resolve(__dirname, '..');",
  "app.use(express.static(rootDir));",
  "",
  "// ",
  "app.use((req, res, next) => {",
  "  if (req.url.endsWith('.js') || req.url.endsWith('.css')) {",
  "    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');",
  "  }",
  "  next();",
  "});"
];

// Try removing the top static lines using line-by-line approach
const lines = content.split("\n");
const newLines = [];
let skipNext = 0;

for (let i = 0; i < lines.length; i++) {
  const l = lines[i].trim();
  if (skipNext > 0) { skipNext--; continue; }
  
  // Remove the FIX block (static at top)
  if (l.includes("[FIX]") || l.includes("const rootDir = path.resolve")) {
    // Skip this and next few related lines
    skipNext = 0;
    continue;
  }
  if (l === "app.use(express.static(rootDir));" && i < 30) {
    // Skip early static declaration
    continue;
  }
  // Remove the cache middleware that came right after
  if (l === "// " && lines[i+1] && lines[i+1].includes("app.use((req, res, next)") && i < 35) {
    skipNext = 5;
    continue;
  }
  newLines.push(lines[i]);
}

content = newLines.join("\n");

// 2. Add rootDir definition right after 'const port = 3000;'
content = content.replace(
  "const port = 3000;",
  "const port = 3000;\nconst rootDir = path.resolve(__dirname, '..');"
);

// 3. Add static serving + 404 handler at the bottom (before app.listen)
const listenLine = "app.listen(port, () => {";
const staticAndHandlers = `
// =====================================================
// 정적 파일 서빙 (API 라우트 이후에 배치해야 충돌 방지)
// =====================================================
app.use((req, res, next) => {
  if (req.url.endsWith('.js') || req.url.endsWith('.css')) {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  }
  next();
});
app.use(express.static(rootDir));

// 404 Handler
app.use((req, res) => {
  console.warn(\`[404] Not Found: \${req.method} \${req.url}\`);
  res.status(404).json({ success: false, error: \`요청하신 경로를 찾을 수 없습니다: \${req.url}\` });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('[Global Error]:', err);
  res.status(err.status || 500).json({ success: false, error: '서버 오류: ' + (err.message || 'Unknown Error') });
});

`;

// Remove old 404 and error handlers to avoid duplication
content = content.replace(/\/\/ 404 Handler[\s\S]*?(?=app\.listen)/g, "");
content = content.replace(/app\.use\(\(req, res\) => \{[\s\S]*?Not Found[\s\S]*?\}\);/g, "");
content = content.replace(/app\.use\(\(err, req, res, next\) => \{[\s\S]*?Global Error[\s\S]*?\}\);/g, "");
content = content.replace(/\/\/ \(Duplicate static[\s\S]*?\)/g, "");

content = content.replace(listenLine, staticAndHandlers + listenLine);

fs.writeFileSync("backend/server.js", content, "utf8");
console.log("Done: static moved after API routes");
