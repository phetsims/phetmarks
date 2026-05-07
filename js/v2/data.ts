// Copyright 2026, University of Colorado Boulder

/**
 * Data loading for PhET Bookmarks 2.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */

import type { DataSources, PhetPackageJSON, RepoName } from './types.js';

const DATA_DIRECTORY = '../../perennial-alias/data/';

async function fetchText( url: string ): Promise<string> {
  const response = await fetch( url, { credentials: 'same-origin' } );
  if ( !response.ok ) {
    throw new Error( `Failed to fetch ${url}: ${response.status} ${response.statusText}` );
  }
  return response.text();
}

async function fetchOptionalText( url: string ): Promise<string> {
  try {
    return await fetchText( url );
  }
  catch( e ) {
    console.warn( e );
    return '';
  }
}

async function fetchOptionalJSON<T>( url: string, fallback: T ): Promise<T> {
  try {
    const response = await fetch( url, { credentials: 'same-origin' } );
    if ( !response.ok ) {
      throw new Error( `Failed to fetch ${url}: ${response.status} ${response.statusText}` );
    }
    return response.json();
  }
  catch( e ) {
    console.warn( e );
    return fallback;
  }
}

function splitLines( text: string ): RepoName[] {
  return text.split( /\r?\n/ )
    .map( line => line.trim() )
    .filter( line => line.length > 0 )
    .sort();
}

async function loadPackageJSONs( repos: RepoName[] ): Promise<Record<RepoName, PhetPackageJSON>> {
  const entries = await Promise.allSettled( repos.map( async repo => {
    const packageJSON = await fetchOptionalJSON<PhetPackageJSON>( `../../${repo}/package.json`, {} );
    return [ repo, packageJSON ] as const;
  } ) );

  const packageJSONs: Record<RepoName, PhetPackageJSON> = {};
  entries.forEach( result => {
    if ( result.status === 'fulfilled' ) {
      packageJSONs[ result.value[ 0 ] ] = result.value[ 1 ];
    }
  } );
  return packageJSONs;
}

export async function loadDataSources(): Promise<DataSources> {
  const [
    activeReposText,
    activeRunnablesText,
    phetioSimsText,
    interactiveDescriptionSimsText,
    unitTestReposText,
    wrappersText
  ] = await Promise.all( [
    fetchText( `${DATA_DIRECTORY}active-repos` ),
    fetchText( `${DATA_DIRECTORY}active-runnables` ),
    fetchText( `${DATA_DIRECTORY}phet-io` ),
    fetchText( `${DATA_DIRECTORY}interactive-description` ),
    fetchText( `${DATA_DIRECTORY}unit-tests` ),
    fetchOptionalText( `${DATA_DIRECTORY}wrappers` )
  ] );

  const phetioSims = splitLines( phetioSimsText );

  return {
    activeRepos: splitLines( activeReposText ),
    activeRunnables: splitLines( activeRunnablesText ),
    phetioSims: phetioSims,
    interactiveDescriptionSims: splitLines( interactiveDescriptionSimsText ),
    unitTestRepos: splitLines( unitTestReposText ),
    wrappers: splitLines( wrappersText ),
    packageJSONs: await loadPackageJSONs( phetioSims )
  };
}
