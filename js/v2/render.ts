// Copyright 2026, University of Colorado Boulder

/**
 * DOM rendering for PhET Bookmarks 2.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */

import { appendQueryFragments } from './url.js';
import { modeMatchesSearch, parseSearch, rankRepos, resolveSearch, selectModeForSearch } from './search.js';
import type { ParsedSearch } from './search.js';
import type { LaunchCatalog, LaunchMode, QueryControl, RecentLaunch, RepoName } from './types.js';

type LaunchTarget = 'sameTab' | 'newTab';

const STORAGE_PREFIX = 'phetmarks-v2';
const MAX_RECENT_LAUNCHES = 8;
const MODE_GROUPS = [ 'Run', 'Test', 'PhET-iO', 'Web' ];

function storageKey( key: string ): string {
  return `${STORAGE_PREFIX}:${key}`;
}

function getElement<T extends HTMLElement>( id: string ): T {
  const element = document.getElementById( id );
  if ( !element ) {
    throw new Error( `Missing element: ${id}` );
  }
  return element as T;
}

function loadStringArray( key: string ): string[] {
  try {
    const rawValue = localStorage.getItem( storageKey( key ) );
    return rawValue ? JSON.parse( rawValue ) : [];
  }
  catch {
    return [];
  }
}

function saveStringArray( key: string, value: string[] ): void {
  localStorage.setItem( storageKey( key ), JSON.stringify( value ) );
}

function loadRecentLaunches(): RecentLaunch[] {
  try {
    const rawValue = localStorage.getItem( storageKey( 'recentLaunches' ) );
    return rawValue ? JSON.parse( rawValue ) : [];
  }
  catch {
    return [];
  }
}

function saveRecentLaunches( recentLaunches: RecentLaunch[] ): void {
  localStorage.setItem( storageKey( 'recentLaunches' ), JSON.stringify( recentLaunches.slice( 0, MAX_RECENT_LAUNCHES ) ) );
}

function clearChildren( element: HTMLElement ): void {
  while ( element.firstChild ) {
    element.removeChild( element.firstChild );
  }
}

function setButtonPressed( button: HTMLButtonElement, pressed: boolean ): void {
  button.setAttribute( 'aria-pressed', `${pressed}` );
}

function createTextElement( tagName: string, className: string, text: string ): HTMLElement {
  const element = document.createElement( tagName );
  element.className = className;
  element.textContent = text;
  return element;
}

export function renderApp( catalog: LaunchCatalog ): void {
  const searchInput = getElement<HTMLInputElement>( 'search' );
  const targetSelect = getElement<HTMLSelectElement>( 'targetSelect' );
  const launchButton = getElement<HTMLButtonElement>( 'launchButton' );
  const repoCount = getElement<HTMLSpanElement>( 'repoCount' );
  const modeCount = getElement<HTMLSpanElement>( 'modeCount' );
  const repoList = getElement<HTMLDivElement>( 'repoList' );
  const modeList = getElement<HTMLDivElement>( 'modeList' );
  const detailPane = getElement<HTMLDivElement>( 'detailPane' );
  const pinButton = getElement<HTMLButtonElement>( 'pinButton' );

  let pinnedRepos = new Set<RepoName>( loadStringArray( 'pinnedRepos' ) );
  let recentLaunches = loadRecentLaunches();
  let currentSearch: ParsedSearch = parseSearch( '' );
  let rankedRepos = rankRepos( catalog, currentSearch, pinnedRepos );
  let selectedRepo = localStorage.getItem( storageKey( 'lastRepo' ) ) || rankedRepos[ 0 ]?.repo || '';
  let selectedMode: LaunchMode | null = selectModeForSearch( catalog.modesByRepo[ selectedRepo ] || [], [], localStorage.getItem( storageKey( `mode:${selectedRepo}` ) ) );
  let selectedIndex = Math.max( 0, rankedRepos.findIndex( rankedRepo => rankedRepo.repo === selectedRepo ) );
  const toggleValues = new Map<string, boolean>();
  const selectValues = new Map<string, string>();
  const customQueryInput = document.createElement( 'input' );
  customQueryInput.className = 'customQueryInput';
  customQueryInput.type = 'text';
  customQueryInput.spellcheck = false;
  customQueryInput.placeholder = 'custom=params&go=here';
  targetSelect.value = localStorage.getItem( storageKey( 'target' ) ) || 'sameTab';

  function getCurrentModeControls(): QueryControl[] {
    return selectedMode?.queryControls || [];
  }

  function resetQueryState(): void {
    toggleValues.clear();
    selectValues.clear();
    getCurrentModeControls().forEach( control => {
      if ( control.type === 'toggle' ) {
        toggleValues.set( control.key, !!control.defaultEnabled );
      }
      else {
        selectValues.set( control.key, control.defaultValue );
      }
    } );
    customQueryInput.value = '';
  }

  function getQueryFragments(): string[] {
    const fragments: string[] = [];
    getCurrentModeControls().forEach( control => {
      if ( control.type === 'toggle' ) {
        if ( toggleValues.get( control.key ) ) {
          fragments.push( control.parameter );
        }
      }
      else {
        const value = selectValues.get( control.key ) || control.defaultValue;
        if ( !( control.omitDefault && value === control.defaultValue ) && value !== 'default' ) {
          fragments.push( `${control.parameter}=${value}` );
        }
      }
    } );
    fragments.push( customQueryInput.value );
    return fragments;
  }

  function getCurrentURL(): string {
    if ( !selectedMode ) {
      return '';
    }
    return appendQueryFragments( selectedMode.url, getQueryFragments() );
  }

  function persistSelection(): void {
    if ( selectedRepo && selectedMode ) {
      localStorage.setItem( storageKey( 'lastRepo' ), selectedRepo );
      localStorage.setItem( storageKey( `mode:${selectedRepo}` ), selectedMode.name );
    }
  }

  function updateSelectionFromSearch( keepRepo: boolean ): void {
    const resolvedSearch = resolveSearch( catalog, searchInput.value, pinnedRepos );
    currentSearch = resolvedSearch.search;
    rankedRepos = resolvedSearch.rankedRepos;

    const repoStillVisible = rankedRepos.some( rankedRepo => rankedRepo.repo === selectedRepo );
    if ( !keepRepo || !repoStillVisible ) {
      selectedIndex = 0;
      selectedRepo = rankedRepos[ 0 ]?.repo || '';
    }
    else {
      selectedIndex = Math.max( 0, rankedRepos.findIndex( rankedRepo => rankedRepo.repo === selectedRepo ) );
    }

    const modes = catalog.modesByRepo[ selectedRepo ] || [];
    selectedMode = selectModeForSearch( modes, currentSearch.modeTokens, localStorage.getItem( storageKey( `mode:${selectedRepo}` ) ) );
    resetQueryState();
  }

  function selectRepo( repo: RepoName ): void {
    selectedRepo = repo;
    selectedIndex = Math.max( 0, rankedRepos.findIndex( rankedRepo => rankedRepo.repo === repo ) );
    const modes = catalog.modesByRepo[ selectedRepo ] || [];
    selectedMode = selectModeForSearch( modes, currentSearch.modeTokens, localStorage.getItem( storageKey( `mode:${selectedRepo}` ) ) );
    resetQueryState();
    persistSelection();
    render();
  }

  function selectMode( mode: LaunchMode ): void {
    selectedMode = mode;
    resetQueryState();
    persistSelection();
    render();
  }

  function addRecentLaunch( url: string ): void {
    if ( !selectedMode ) {
      return;
    }
    const nextRecentLaunch: RecentLaunch = {
      repo: selectedRepo,
      modeName: selectedMode.name,
      modeText: selectedMode.text,
      url: url,
      time: Date.now()
    };
    recentLaunches = [
      nextRecentLaunch,
      ...recentLaunches.filter( launchInfo => launchInfo.repo !== nextRecentLaunch.repo ||
                                             launchInfo.modeName !== nextRecentLaunch.modeName ||
                                             launchInfo.url !== nextRecentLaunch.url )
    ].slice( 0, MAX_RECENT_LAUNCHES );
    saveRecentLaunches( recentLaunches );
  }

  function openURL( url: string, forceNewTab: boolean ): void {
    addRecentLaunch( url );
    if ( forceNewTab || targetSelect.value === 'newTab' ) {
      window.open( url, '_blank' );
    }
    else {
      window.location.href = url;
    }
  }

  function launch( forceNewTab: boolean ): void {
    if ( selectedMode ) {
      openURL( getCurrentURL(), forceNewTab );
    }
  }

  function renderRepos(): void {
    clearChildren( repoList );
    repoCount.textContent = `${rankedRepos.length}/${catalog.repos.length}`;

    if ( rankedRepos.length === 0 ) {
      repoList.appendChild( createTextElement( 'div', 'emptyText', 'No matching repositories.' ) );
      return;
    }

    rankedRepos.forEach( rankedRepo => {
      const repo = rankedRepo.repo;
      const button = document.createElement( 'button' );
      button.type = 'button';
      button.className = `repoButton${repo === selectedRepo ? ' selected' : ''}`;
      button.addEventListener( 'click', () => selectRepo( repo ) );

      const row = document.createElement( 'span' );
      row.className = 'repoRowText';
      row.appendChild( createTextElement( 'span', 'repoName', repo ) );
      if ( pinnedRepos.has( repo ) ) {
        row.appendChild( createTextElement( 'span', 'pinMark', 'Pinned' ) );
      }
      row.appendChild( createTextElement( 'span', 'repoMeta', `${( catalog.modesByRepo[ repo ] || [] ).length}` ) );
      button.appendChild( row );
      repoList.appendChild( button );

      if ( repo === selectedRepo ) {
        setTimeout( () => button.scrollIntoView( { block: 'nearest' } ), 0 );
      }
    } );
  }

  function renderModes(): void {
    clearChildren( modeList );
    const modes = ( catalog.modesByRepo[ selectedRepo ] || [] )
      .filter( mode => modeMatchesSearch( mode, currentSearch.modeTokens ) );
    modeCount.textContent = `${modes.length}/${( catalog.modesByRepo[ selectedRepo ] || [] ).length}`;

    if ( modes.length === 0 ) {
      modeList.appendChild( createTextElement( 'div', 'emptyText', 'No matching modes.' ) );
      return;
    }

    MODE_GROUPS.forEach( group => {
      const groupModes = modes.filter( mode => mode.group === group );
      if ( groupModes.length === 0 ) {
        return;
      }

      modeList.appendChild( createTextElement( 'div', 'modeGroup', group ) );
      groupModes.forEach( mode => {
        const button = document.createElement( 'button' );
        button.type = 'button';
        button.className = `modeButton${mode.name === selectedMode?.name ? ' selected' : ''}`;
        button.addEventListener( 'click', () => selectMode( mode ) );
        button.appendChild( createTextElement( 'div', 'modeName', mode.text ) );
        button.appendChild( createTextElement( 'div', 'modeDescription', mode.description ) );
        modeList.appendChild( button );

        if ( mode.name === selectedMode?.name ) {
          setTimeout( () => button.scrollIntoView( { block: 'nearest' } ), 0 );
        }
      } );
    } );
  }

  function renderControls( container: HTMLElement ): void {
    const controls = getCurrentModeControls();

    if ( controls.length > 0 ) {
      container.appendChild( createTextElement( 'div', 'sectionTitle', 'Common Params' ) );
      const chipGrid = document.createElement( 'div' );
      chipGrid.className = 'chipGrid';
      controls.filter( control => control.type === 'toggle' ).forEach( control => {
        const button = document.createElement( 'button' );
        button.type = 'button';
        button.className = 'chip';
        button.textContent = control.label;
        setButtonPressed( button, !!toggleValues.get( control.key ) );
        button.addEventListener( 'click', () => {
          toggleValues.set( control.key, !toggleValues.get( control.key ) );
          render();
        } );
        chipGrid.appendChild( button );
      } );
      container.appendChild( chipGrid );

      const selectControls = controls.filter( control => control.type === 'select' );
      if ( selectControls.length > 0 ) {
        const fieldGrid = document.createElement( 'div' );
        fieldGrid.className = 'fieldGrid';
        selectControls.forEach( control => {
          const label = document.createElement( 'label' );
          label.className = 'fieldLabel';
          label.textContent = control.label;
          const select = document.createElement( 'select' );
          select.value = selectValues.get( control.key ) || control.defaultValue;
          control.values.forEach( value => {
            const option = document.createElement( 'option' );
            option.value = value;
            option.textContent = value;
            select.appendChild( option );
          } );
          select.addEventListener( 'change', () => {
            selectValues.set( control.key, select.value );
            render();
          } );
          label.appendChild( select );
          fieldGrid.appendChild( label );
        } );
        container.appendChild( fieldGrid );
      }
    }

    container.appendChild( createTextElement( 'div', 'sectionTitle', 'Custom Query' ) );
    container.appendChild( customQueryInput );

    const actions = document.createElement( 'div' );
    actions.className = 'smallActions';
    const resetButton = document.createElement( 'button' );
    resetButton.className = 'quietButton';
    resetButton.type = 'button';
    resetButton.textContent = 'Reset Params';
    resetButton.addEventListener( 'click', () => {
      resetQueryState();
      render();
    } );
    actions.appendChild( resetButton );
    container.appendChild( actions );
  }

  function renderRecentAndPinned( container: HTMLElement ): void {
    const pinnedList = [ ...pinnedRepos ].filter( repo => catalog.modesByRepo[ repo ] );
    if ( pinnedList.length > 0 ) {
      container.appendChild( createTextElement( 'div', 'sectionTitle', 'Pinned' ) );
      pinnedList.forEach( repo => {
        const button = document.createElement( 'button' );
        button.type = 'button';
        button.className = 'pinListButton';
        button.textContent = repo;
        button.addEventListener( 'click', () => selectRepo( repo ) );
        container.appendChild( button );
      } );
    }

    if ( recentLaunches.length > 0 ) {
      container.appendChild( createTextElement( 'div', 'sectionTitle', 'Recent' ) );
      recentLaunches.forEach( launchInfo => {
        const button = document.createElement( 'button' );
        button.type = 'button';
        button.className = 'recentButton';
        button.appendChild( createTextElement( 'div', 'repoName', `${launchInfo.repo} / ${launchInfo.modeText}` ) );
        button.appendChild( createTextElement( 'div', 'recentMeta', launchInfo.url ) );
        button.addEventListener( 'click', () => openURL( launchInfo.url, false ) );
        container.appendChild( button );
      } );
    }
  }

  function renderDetails(): void {
    clearChildren( detailPane );

    if ( !selectedRepo || !selectedMode ) {
      detailPane.appendChild( createTextElement( 'div', 'emptyText', 'Select a repository.' ) );
      return;
    }

    const preview = document.createElement( 'code' );
    preview.className = 'urlPreview';
    preview.textContent = getCurrentURL();
    detailPane.appendChild( preview );
    renderControls( detailPane );
    renderRecentAndPinned( detailPane );

    pinButton.textContent = pinnedRepos.has( selectedRepo ) ? 'Unpin' : 'Pin';
  }

  function render(): void {
    renderRepos();
    renderModes();
    renderDetails();
  }

    searchInput.addEventListener( 'input', () => {
    updateSelectionFromSearch( false );
    persistSelection();
    render();
  } );

  customQueryInput.addEventListener( 'input', render );

  searchInput.addEventListener( 'keydown', event => {
    if ( event.key === 'ArrowDown' || event.key === 'ArrowUp' ) {
      event.preventDefault();
      if ( rankedRepos.length > 0 ) {
        selectedIndex = Math.max( 0, Math.min( rankedRepos.length - 1, selectedIndex + ( event.key === 'ArrowDown' ? 1 : -1 ) ) );
        selectRepo( rankedRepos[ selectedIndex ].repo );
      }
    }
    else if ( event.key === 'Enter' ) {
      event.preventDefault();
      launch( event.shiftKey );
    }
  } );

  launchButton.addEventListener( 'click', () => launch( false ) );
  targetSelect.addEventListener( 'change', () => {
    const target = targetSelect.value as LaunchTarget;
    localStorage.setItem( storageKey( 'target' ), target );
  } );
  pinButton.addEventListener( 'click', () => {
    if ( pinnedRepos.has( selectedRepo ) ) {
      pinnedRepos.delete( selectedRepo );
    }
    else {
      pinnedRepos.add( selectedRepo );
    }
    saveStringArray( 'pinnedRepos', [ ...pinnedRepos ] );
    render();
  } );

  updateSelectionFromSearch( true );
  resetQueryState();
  render();
  searchInput.focus();
}
