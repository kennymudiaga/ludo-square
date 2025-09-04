# VS Code Recommended Settings for Ludo Square

This project works best with the following VS Code configuration. Copy the contents below to your local `.vscode/settings.json` file if you want to use these recommended settings.

## Recommended Settings

```json
{
  "json.schemas": [
    {
      "fileMatch": ["tsconfig.json", "tsconfig.*.json"],
      "url": "https://www.schemastore.org/schemas/json/tsconfig.json"
    },
    {
      "fileMatch": ["package.json"],
      "url": "https://www.schemastore.org/schemas/json/package.json"
    }
  ],
  "json.schemaDownload.enable": true,
  "typescript.preferences.includePackageJsonAutoImports": "on",
  "eslint.workingDirectories": ["packages/game-engine", "apps/frontend", "apps/backend"],
  "typescript.preferences.includePackageJsonAutoImports": "on",
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  }
}
```

## Recommended Extensions

- ESLint (`dbaeumer.vscode-eslint`)
- Prettier (`esbenp.prettier-vscode`) 
- TypeScript Importer (`pmneo.tsimporter`)
- Jest (`orta.vscode-jest`)

## Setup Instructions

1. Copy the settings above to `.vscode/settings.json` in your local workspace
2. Install the recommended extensions
3. Restart VS Code

Note: The `.vscode/settings.json` file is gitignored to allow personal customization.
