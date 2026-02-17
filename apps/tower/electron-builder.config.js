/**
 * Electron Builder Configuration
 */

module.exports = {
  appId: "com.oxlayer.tower",
  productName: "OxLayer Tower",

  directories: {
    buildResources: "build",
    output: "dist",
  },

  // Native module rebuild disabled (handled by electron-vite)
  nodeGypRebuild: false,
  npmRebuild: false,

  // Explicitly configure app files to include
  files: [
    "out/**/*",
    "package.json",
    "!**/package-lock.json",
    "!**/.vscode/*",
    "!src/*",
    "!electron.vite.config.{js,ts,mjs,cjs}",
    "!{.eslintcache,eslint.config.mjs,CHANGELOG.md,README.md}",
    "!{.env,.env.*,.npmrc,pnpm-lock.yaml}",
    "!{tsconfig.json,tsconfig.node.json,tsconfig.web.json}",
    "!**/*.map",
  ],

  // Unpack native modules and resources from ASAR
  asarUnpack: ["**/*.node"],

  // Build compression for production
  compression: "normal",

  // macOS Configuration
  mac: {
    icon: "build/icon.icns",
    target: [
      { target: "dmg" },
      { target: "zip" },
    ],
    hardenedRuntime: true,
    gatekeeperAssess: false,
    category: "public.app-category.developer-tools",
  },

  // macOS DMG Configuration
  dmg: {
    artifactName: "${name}-${version}-${arch}.${ext}",
    title: "Install ${productName}",
    background: null,
    backgroundColor: "#ffffff",
    window: {
      width: 540,
      height: 380,
    },
    contents: [
      { x: 410, y: 220, type: "link", path: "/Applications" },
      { x: 130, y: 220, type: "file" },
    ],
  },

  // Windows Configuration
  win: {
    icon: "build/icon.ico",
    target: ["nsis", "portable"],
    signAndEditExecutable: false,
    requestedExecutionLevel: "asInvoker",
  },

  nsis: {
    artifactName: "${name}-${version}-setup-${arch}.${ext}",
    oneClick: false,
    allowToChangeInstallationDirectory: true,
    createDesktopShortcut: true,
  },

  portable: {
    artifactName: "${name}-${version}-portable-${arch}.${ext}",
  },

  // Linux Configuration
  linux: {
    icon: "build/icon.png",
    target: [
      { target: "AppImage", arch: ["x64", "arm64"] },
      { target: "deb", arch: ["x64", "arm64"] },
    ],
    maintainer: "OxLayer",
    category: "Development",
  },

  appImage: {
    artifactName: "${name}-${version}-${arch}.${ext}",
  },

  deb: {
    artifactName: "${name}-${version}-${arch}.${ext}",
  },
};
