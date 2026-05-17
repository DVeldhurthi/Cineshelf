if (process.platform !== "win32") {
  console.error("");
  console.error("Windows installers must be built on Windows.");
  console.error("");
  console.error("You are running this command on:", process.platform);
  console.error("Run it from PowerShell or Windows Terminal on your Windows laptop:");
  console.error("");
  console.error("  npm install");
  console.error("  npm run tauri:build:windows");
  console.error("");
  console.error("Tauri can only create .msi installers on Windows because MSI output uses WiX.");
  console.error("");
  process.exit(1);
}
