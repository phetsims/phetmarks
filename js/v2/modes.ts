// Copyright 2026, University of Colorado Boulder

/**
 * Launch mode catalog for PhET Bookmarks 2.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */

import type { DataSources, LaunchCatalog, LaunchMode, QueryControl, RepoName } from './types.js';

const docRepos = [
  'scenery',
  'kite',
  'dot',
  'phet-io',
  'binder'
];

const commonSimControls: QueryControl[] = [
  { type: 'toggle', key: 'ea', label: 'ea', parameter: 'ea' },
  { type: 'toggle', key: 'eall', label: 'eall', parameter: 'eall' },
  { type: 'toggle', key: 'debugger', label: 'debugger', parameter: 'debugger' },
  { type: 'toggle', key: 'dev', label: 'dev', parameter: 'dev' },
  { type: 'toggle', key: 'fuzz', label: 'fuzz', parameter: 'fuzz' },
  { type: 'toggle', key: 'fuzzBoard', label: 'fuzzBoard', parameter: 'fuzzBoard' },
  { type: 'toggle', key: 'showPointers', label: 'showPointers', parameter: 'showPointers' },
  {
    type: 'select',
    key: 'audio',
    label: 'audio',
    parameter: 'audio',
    values: [ 'default', 'enabled', 'disabled', 'muted' ],
    defaultValue: 'default',
    omitDefault: true
  },
  {
    type: 'select',
    key: 'screens',
    label: 'screens',
    parameter: 'screens',
    values: [ 'default', 'all', '1', '2', '3', '4', '5', '6' ],
    defaultValue: 'default',
    omitDefault: true
  },
  {
    type: 'select',
    key: 'locale',
    label: 'locale',
    parameter: 'locale',
    values: [ 'default', 'en', 'es', 'fr', 'de', 'ar', 'he', 'ko', 'zh_CN' ],
    defaultValue: 'default',
    omitDefault: true
  },
  {
    type: 'select',
    key: 'brand',
    label: 'brand',
    parameter: 'brand',
    values: [ 'default', 'phet', 'phet-io' ],
    defaultValue: 'default',
    omitDefault: true
  }
];

const devSimControls: QueryControl[] = [
  { type: 'toggle', key: 'ea', label: 'ea', parameter: 'ea', defaultEnabled: true },
  { type: 'toggle', key: 'eall', label: 'eall', parameter: 'eall' },
  {
    type: 'select',
    key: 'brand',
    label: 'brand',
    parameter: 'brand',
    values: [ 'phet', 'phet-io', 'default' ],
    defaultValue: 'phet'
  },
  ...commonSimControls.filter( control => control.key !== 'ea' && control.key !== 'eall' && control.key !== 'brand' )
];

const phetioControls: QueryControl[] = [
  { type: 'toggle', key: 'phetioDebug', label: 'phetioDebug', parameter: 'phetioDebug=true' },
  { type: 'toggle', key: 'phetioWrapperDebug', label: 'wrapper debug', parameter: 'phetioWrapperDebug=true' },
  { type: 'toggle', key: 'phetioStandalone', label: 'standalone', parameter: 'phetioStandalone' },
  { type: 'toggle', key: 'phetioConsoleLog', label: 'console log', parameter: 'phetioConsoleLog=colorized' },
  ...commonSimControls
];

function wrapperNameFromPath( wrapper: string ): string {
  const wrapperParts = wrapper.split( 'phet-io-wrapper-' );
  const wrapperName = wrapperParts.length > 1 ?
                      wrapperParts[ 1 ] :
                      wrapper.startsWith( 'phet-io-sim-specific' ) ?
                      wrapper.split( '/' )[ wrapper.split( '/' ).length - 1 ] :
                      wrapper;
  const slashParts = wrapperName.split( '/' );
  return slashParts[ slashParts.length - 1 ];
}

function getWrapperURL( wrapper: string, wrapperName: string, repo: RepoName ): string {
  if ( wrapper.startsWith( 'phet-io-wrapper-' ) ) {
    return wrapperName === 'sonification' ?
           `../../phet-io-wrapper-${wrapperName}/${repo}-sonification.html?sim=${repo}` :
           `../../${wrapper}/?sim=${repo}`;
  }

  const baseURL = `../../${wrapper}/?sim=${repo}`;
  return wrapper === 'phet-io-wrappers/record' ? `${baseURL}&console` : baseURL;
}

function addUniqueMode( modes: LaunchMode[], mode: LaunchMode ): void {
  if ( !modes.some( existingMode => existingMode.name === mode.name ) ) {
    modes.push( mode );
  }
}

export function createLaunchCatalog( dataSources: DataSources ): LaunchCatalog {
  const modesByRepo: Record<RepoName, LaunchMode[]> = {};

  dataSources.activeRepos.forEach( repo => {
    const modes: LaunchMode[] = [];
    modesByRepo[ repo ] = modes;

    const isRunnable = dataSources.activeRunnables.includes( repo );
    const isPhetio = dataSources.phetioSims.includes( repo );
    const hasUnitTests = dataSources.unitTestRepos.includes( repo );
    const supportsInteractiveDescription = dataSources.interactiveDescriptionSims.includes( repo );

    if ( isRunnable ) {
      modes.push( {
        name: 'unbuilt',
        text: 'Unbuilt',
        group: 'Run',
        description: 'Run the local development HTML.',
        url: `../../${repo}/${repo}_en.html`,
        queryControls: devSimControls,
        tags: [ 'run', 'local', 'unbuilt', 'sim' ]
      } );
      modes.push( {
        name: 'built-phet',
        text: 'Built PhET',
        group: 'Run',
        description: 'Run the built PhET brand HTML.',
        url: `../../${repo}/build/phet/${repo}_en_phet.html`,
        queryControls: commonSimControls,
        tags: [ 'run', 'built', 'phet', 'compiled' ]
      } );
      modes.push( {
        name: 'built-xhtml',
        text: 'Built XHTML',
        group: 'Run',
        description: 'Run the built XHTML artifact.',
        url: `../../${repo}/build/phet/xhtml/${repo}_all.xhtml`,
        queryControls: commonSimControls,
        tags: [ 'run', 'built', 'xhtml', 'compiled' ]
      } );
      modes.push( {
        name: 'production-latest',
        text: 'Production Latest',
        group: 'Run',
        description: 'Open the latest production version.',
        url: `https://phet.colorado.edu/sims/html/${repo}/latest/${repo}_all.html`,
        queryControls: commonSimControls,
        tags: [ 'run', 'production', 'latest', 'published' ]
      } );
      modes.push( {
        name: 'color-editor',
        text: 'Color Editor',
        group: 'Run',
        description: 'Open the PhET color editor for this sim.',
        url: `../color-editor.html?sim=${repo}`,
        queryControls: [
          {
            type: 'select',
            key: 'brand',
            label: 'brand',
            parameter: 'brand',
            values: [ 'phet', 'phet-io', 'default' ],
            defaultValue: 'phet'
          }
        ],
        tags: [ 'color', 'editor' ]
      } );
    }

    if ( supportsInteractiveDescription ) {
      modes.push( {
        name: 'a11y-view',
        text: 'A11y View',
        group: 'Run',
        description: 'Inspect the simulation next to its accessible content.',
        url: `../../chipper/wrappers/a11y-view/?sim=${repo}`,
        queryControls: devSimControls,
        tags: [ 'a11y', 'accessibility', 'interactive-description', 'description' ]
      } );
    }

    if ( hasUnitTests ) {
      modes.push( {
        name: 'unit-tests',
        text: 'Unit Tests',
        group: 'Test',
        description: 'Run local unit tests.',
        url: `../../${repo}/${repo}-tests.html`,
        queryControls: [
          { type: 'toggle', key: 'ea', label: 'ea', parameter: 'ea', defaultEnabled: true },
          {
            type: 'select',
            key: 'brand',
            label: 'brand',
            parameter: 'brand',
            values: [ 'default', 'phet', 'phet-io' ],
            defaultValue: repo === 'phet-io' || repo === 'tandem' || repo === 'phet-io-wrappers' ? 'phet-io' : 'default',
            omitDefault: false
          }
        ],
        tags: [ 'unit', 'tests', 'qunit', 'test' ]
      } );
    }

    if ( isPhetio ) {
      modes.push( {
        name: 'phetio-standalone',
        text: 'Standalone',
        group: 'PhET-iO',
        description: 'Run the local sim in PhET-iO standalone mode.',
        url: `../../${repo}/${repo}_en.html?brand=phet-io&phetioStandalone`,
        queryControls: phetioControls,
        tags: [ 'phetio', 'phet-io', 'standalone' ]
      } );
      modes.push( {
        name: 'wrapper-unit-tests',
        text: 'Wrapper Unit Tests',
        group: 'PhET-iO',
        description: 'Run wrapper tests for this sim.',
        url: `../../phet-io-wrappers/phet-io-wrappers-tests.html?sim=${repo}`,
        queryControls: phetioControls,
        tags: [ 'phetio', 'phet-io', 'wrapper', 'unit', 'tests' ]
      } );
      modes.push( {
        name: 'compiled-index',
        text: 'Compiled Index',
        group: 'PhET-iO',
        description: 'Open the built PhET-iO wrapper index.',
        url: `../../${repo}/build/phet-io/`,
        queryControls: phetioControls,
        tags: [ 'phetio', 'phet-io', 'compiled', 'built', 'index' ]
      } );

      const simSpecificWrappers = dataSources.packageJSONs[ repo ]?.phet?.[ 'phet-io' ]?.wrappers || [];
      const wrapperPaths = [ ...dataSources.wrappers, ...simSpecificWrappers ].sort( ( a, b ) => {
        return wrapperNameFromPath( a ).localeCompare( wrapperNameFromPath( b ) );
      } );

      wrapperPaths.forEach( wrapper => {
        const wrapperName = wrapperNameFromPath( wrapper );
        addUniqueMode( modes, {
          name: wrapperName,
          text: wrapperName,
          group: 'PhET-iO',
          description: `Open the ${wrapperName} wrapper.`,
          url: getWrapperURL( wrapper, wrapperName, repo ),
          queryControls: phetioControls,
          tags: [ 'phetio', 'phet-io', 'wrapper', wrapperName ]
        } );
      } );
    }

    if ( docRepos.includes( repo ) ) {
      modes.push( {
        name: 'documentation',
        text: 'Documentation',
        group: 'Web',
        description: 'Browse local HTML documentation.',
        url: `../../${repo}/doc${repo === 'binder' ? 's' : ''}/`,
        tags: [ 'docs', 'documentation', 'web' ]
      } );
    }

    if ( repo === 'scenery' || repo === 'kite' || repo === 'dot' ) {
      modes.push( {
        name: 'examples',
        text: 'Examples',
        group: 'Web',
        description: 'Browse local examples.',
        url: `../../${repo}/examples/`,
        tags: [ 'examples', 'web' ]
      } );
    }

    modes.push( {
      name: 'github',
      text: 'GitHub',
      group: 'Web',
      description: 'Open this repository on GitHub.',
      url: `https://github.com/phetsims/${repo}`,
      tags: [ 'github', 'web', 'repo' ]
    } );
    modes.push( {
      name: 'issues',
      text: 'Issues',
      group: 'Web',
      description: 'Open GitHub issues for this repository.',
      url: `https://github.com/phetsims/${repo}/issues`,
      tags: [ 'issues', 'github', 'web' ]
    } );
  } );

  return {
    repos: dataSources.activeRepos,
    modesByRepo: modesByRepo
  };
}
