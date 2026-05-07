// Copyright 2026, University of Colorado Boulder

/**
 * Search and ranking helpers for PhET Bookmarks 2.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */

import type { LaunchCatalog, LaunchMode, RepoName } from './types.js';

export type ParsedSearch = {
  repoTokens: string[];
  modeTokens: string[];
};

export type RankedRepo = {
  repo: RepoName;
  score: number;
};

export type ResolvedSearch = {
  search: ParsedSearch;
  rankedRepos: RankedRepo[];
};

const NO_MATCH = Number.NEGATIVE_INFINITY;

export function parseSearch( rawSearch: string ): ParsedSearch {
  const repoTokens: string[] = [];
  const modeTokens: string[] = [];

  rawSearch.toLowerCase().split( /\s+/ )
    .map( token => token.trim() )
    .filter( token => token.length > 0 )
    .forEach( token => {
      if ( token.startsWith( '-' ) && token.length > 1 ) {
        modeTokens.push( token.slice( 1 ) );
      }
      else {
        repoTokens.push( token );
      }
    } );

  return { repoTokens: repoTokens, modeTokens: modeTokens };
}

function getRepoWords( repo: RepoName ): string[] {
  return repo.toLowerCase().split( /[-_]+/ );
}

function scoreTokenAgainstRepo( token: string, repo: RepoName ): number {
  const lowerRepo = repo.toLowerCase();
  const words = getRepoWords( repo );

  if ( lowerRepo === token ) {
    return 100;
  }
  if ( words.includes( token ) ) {
    return 80;
  }
  if ( lowerRepo.includes( token ) ) {
    return 58 - Math.min( 20, lowerRepo.indexOf( token ) );
  }

  const startingWord = words.find( word => word.startsWith( token ) );
  if ( startingWord ) {
    return 64 - Math.min( 15, startingWord.length - token.length );
  }

  let tokenIndex = 0;
  for ( let i = 0; i < lowerRepo.length && tokenIndex < token.length; i++ ) {
    if ( lowerRepo[ i ] === token[ tokenIndex ] ) {
      tokenIndex++;
    }
  }

  return tokenIndex === token.length ? 18 : NO_MATCH;
}

function modeMatchesToken( mode: LaunchMode, token: string ): boolean {
  const searchableText = [
    mode.name,
    mode.text,
    mode.group,
    mode.description,
    ...( mode.tags || [] )
  ].join( ' ' ).toLowerCase();

  return searchableText.includes( token );
}

export function modeMatchesSearch( mode: LaunchMode, modeTokens: string[] ): boolean {
  return modeTokens.every( token => modeMatchesToken( mode, token ) );
}

export function selectModeForSearch( modes: LaunchMode[], modeTokens: string[], savedModeName: string | null ): LaunchMode | null {
  const savedMode = savedModeName ? modes.find( mode => mode.name === savedModeName ) : null;
  if ( savedMode && modeMatchesSearch( savedMode, modeTokens ) ) {
    return savedMode;
  }

  if ( modeTokens.length > 0 ) {
    const matchingMode = modes.find( mode => modeMatchesSearch( mode, modeTokens ) );
    if ( matchingMode ) {
      return matchingMode;
    }
  }

  return modes[ 0 ] || null;
}

export function rankRepos( catalog: LaunchCatalog, search: ParsedSearch, pinnedRepos: Set<RepoName> ): RankedRepo[] {
  return catalog.repos.map( repo => {
    const modes = catalog.modesByRepo[ repo ] || [];
    if ( search.modeTokens.length > 0 && !modes.some( mode => modeMatchesSearch( mode, search.modeTokens ) ) ) {
      return { repo: repo, score: NO_MATCH };
    }

    let score = pinnedRepos.has( repo ) ? 8 : 0;
    for ( const token of search.repoTokens ) {
      const tokenScore = scoreTokenAgainstRepo( token, repo );
      if ( tokenScore === NO_MATCH ) {
        return { repo: repo, score: NO_MATCH };
      }
      score += tokenScore;
    }

    return { repo: repo, score: score };
  } )
    .filter( rankedRepo => rankedRepo.score !== NO_MATCH )
    .sort( ( a, b ) => b.score - a.score || a.repo.localeCompare( b.repo ) );
}

export function resolveSearch( catalog: LaunchCatalog, rawSearch: string, pinnedRepos: Set<RepoName> ): ResolvedSearch {
  const strictSearch = parseSearch( rawSearch );
  const strictRankedRepos = rankRepos( catalog, strictSearch, pinnedRepos );

  if ( strictRankedRepos.length > 0 || strictSearch.repoTokens.length === 0 ) {
    return { search: strictSearch, rankedRepos: strictRankedRepos };
  }

  const repoTokens = strictSearch.repoTokens;
  const candidateSearches: ParsedSearch[] = [];
  const candidateCount = 1 << repoTokens.length;
  for ( let mask = 1; mask < candidateCount; mask++ ) {
    const candidateRepoTokens: string[] = [];
    const candidateModeTokens = [ ...strictSearch.modeTokens ];

    repoTokens.forEach( ( token, index ) => {
      if ( mask & ( 1 << index ) ) {
        candidateModeTokens.push( token );
      }
      else {
        candidateRepoTokens.push( token );
      }
    } );

    candidateSearches.push( {
      repoTokens: candidateRepoTokens,
      modeTokens: candidateModeTokens
    } );
  }

  candidateSearches.sort( ( a, b ) => {
    return b.repoTokens.length - a.repoTokens.length ||
           a.modeTokens.length - b.modeTokens.length;
  } );

  for ( const candidateSearch of candidateSearches ) {
    const rankedRepos = rankRepos( catalog, candidateSearch, pinnedRepos );
    if ( rankedRepos.length > 0 ) {
      return { search: candidateSearch, rankedRepos: rankedRepos };
    }
  }

  return { search: strictSearch, rankedRepos: [] };
}
