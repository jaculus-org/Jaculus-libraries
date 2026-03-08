# Jaculus libraries repository

This repository contains libraries for Jaculus.

## Creating a new library

Libraries mostly follow the same structure as npm packages, i.e. they use a `package.json` file to define metadata and dependencies. An additional field `jaculus` can be used to specify additional options for Jaculus, such as block definitions.

We want to encourage separation of different build artifacts and source files, so we recommend the following structure:

```
my-library/
  ├── blocks/          # JacLy block definitions
  ├── src/             # Source files (TypeScript, etc.)
  ├── dist/
  │   ├── js/          # Compiled JavaScript files
  │   └── types/       # TypeScript declaration files
  ├── package.json     # npm package metadata
  └── README.md        # Documentation
```

You can use the `empty-template` directory in this repository as a starting point for your new library. Just copy its contents and modify them as needed.
