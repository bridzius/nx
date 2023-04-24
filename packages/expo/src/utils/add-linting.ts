import { Linter, lintProjectGenerator } from '@nx/linter';
import {
  addDependenciesToPackageJson,
  joinPathFragments,
  runTasksInSerial,
  Tree,
  updateJson,
} from '@nx/devkit';
import { extendReactEslintJson, extraEslintDependencies } from '@nx/react';
import type { Linter as ESLintLinter } from 'eslint';

export async function addLinting(
  host: Tree,
  projectName: string,
  appProjectRoot: string,
  tsConfigPaths: string[],
  linter: Linter,
  setParserOptionsProject?: boolean
) {
  if (linter === Linter.None) {
    return () => {};
  }

  const lintTask = await lintProjectGenerator(host, {
    linter,
    project: projectName,
    tsConfigPaths,
    eslintFilePatterns: [`${appProjectRoot}/**/*.{ts,tsx,js,jsx}`],
    skipFormat: true,
    setParserOptionsProject,
  });

  updateJson(
    host,
    joinPathFragments(appProjectRoot, '.eslintrc.json'),
    (json: ESLintLinter.Config) => {
      json = extendReactEslintJson(json);

      json.ignorePatterns = [
        ...json.ignorePatterns,
        '.expo',
        'node_modules',
        'web-build',
        'cache',
        'dist',
      ];

      return json;
    }
  );

  const installTask = await addDependenciesToPackageJson(
    host,
    extraEslintDependencies.dependencies,
    extraEslintDependencies.devDependencies
  );

  return runTasksInSerial(lintTask, installTask);
}
