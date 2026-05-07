// Copyright 2026, University of Colorado Boulder

/**
 * Entry point for PhET Bookmarks 2.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */

import { loadDataSources } from './data.js';
import { createLaunchCatalog } from './modes.js';
import { renderApp } from './render.js';

( async function(): Promise<void> {
  const dataSources = await loadDataSources();
  renderApp( createLaunchCatalog( dataSources ) );
} )().catch( error => {
  const app = document.getElementById( 'app' );
  if ( app ) {
    app.textContent = '';
    const message = document.createElement( 'div' );
    message.className = 'statusText errorText';
    message.textContent = error instanceof Error ? error.message : `${error}`;
    app.appendChild( message );
  }
  throw error;
} );
