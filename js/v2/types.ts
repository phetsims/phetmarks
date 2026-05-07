// Copyright 2026, University of Colorado Boulder

/**
 * Shared types for PhET Bookmarks 2.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */

export type RepoName = string;

export type ModeGroup = 'Run' | 'Test' | 'PhET-iO' | 'Web';

export type QueryToggleControl = {
  type: 'toggle';
  key: string;
  label: string;
  parameter: string;
  defaultEnabled?: boolean;
};

export type QuerySelectControl = {
  type: 'select';
  key: string;
  label: string;
  parameter: string;
  values: string[];
  defaultValue: string;
  omitDefault?: boolean;
};

export type QueryControl = QueryToggleControl | QuerySelectControl;

export type LaunchMode = {
  name: string;
  text: string;
  group: ModeGroup;
  description: string;
  url: string;
  queryControls?: QueryControl[];
  tags?: string[];
};

export type DataSources = {
  activeRepos: RepoName[];
  activeRunnables: RepoName[];
  phetioSims: RepoName[];
  interactiveDescriptionSims: RepoName[];
  unitTestRepos: RepoName[];
  wrappers: string[];
  packageJSONs: Record<RepoName, PhetPackageJSON>;
};

export type PhetPackageJSON = {
  phet?: {
    'phet-io'?: {
      wrappers?: string[];
    };
  };
};

export type LaunchCatalog = {
  repos: RepoName[];
  modesByRepo: Record<RepoName, LaunchMode[]>;
};

export type RecentLaunch = {
  repo: RepoName;
  modeName: string;
  modeText: string;
  url: string;
  time: number;
};
