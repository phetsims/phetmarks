// Copyright 2026, University of Colorado Boulder

/**
 * URL helpers for PhET Bookmarks 2.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */

export function appendQueryFragments( baseURL: string, queryFragments: string[] ): string {
  const nonEmptyFragments = queryFragments
    .map( fragment => fragment.trim().replace( /^[?&]+/, '' ).replace( /[?&]+$/, '' ) )
    .filter( fragment => fragment.length > 0 );

  if ( nonEmptyFragments.length === 0 ) {
    return baseURL;
  }

  const separator = baseURL.includes( '?' ) ?
                    baseURL.endsWith( '?' ) || baseURL.endsWith( '&' ) ? '' : '&' :
                    '?';

  return `${baseURL}${separator}${nonEmptyFragments.join( '&' )}`;
}
