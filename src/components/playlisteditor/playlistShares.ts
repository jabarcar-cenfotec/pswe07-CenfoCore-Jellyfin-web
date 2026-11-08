import type { Api } from '@jellyfin/sdk';
import { getPlaylistApi } from '@jellyfin/sdk/lib/utils/api/playlist-api';
import { getUserApi } from '@jellyfin/sdk/lib/utils/api/user-api';
import escapeHtml from 'escape-html';

import globalize from 'lib/globalize';

/** A user with access to a playlist, ready to be displayed. */
export interface PlaylistShare {
    userId: string
    name: string
    canEdit: boolean
}

/**
 * Fetches the users a playlist is shared with and resolves their display names.
 * Rejects if the playlist users cannot be fetched; falls back to the user id
 * when a display name cannot be resolved.
 */
export async function fetchPlaylistShares(api: Api, playlistId: string): Promise<PlaylistShare[]> {
    const { data: permissions } = await getPlaylistApi(api).getPlaylistUsers({ playlistId });

    const shares = permissions.filter(permission => !!permission.UserId);
    if (!shares.length) return [];

    const namesById = new Map<string, string>();
    try {
        const { data: users } = await getUserApi(api).getUsers();
        users.forEach(user => {
            if (user.Id && user.Name) namesById.set(user.Id, user.Name);
        });
    } catch (err) {
        console.warn('[PlaylistShares] failed to resolve user names', err);
    }

    return shares.map(({ UserId, CanEdit }) => {
        const userId = UserId as string;
        return {
            userId,
            name: namesById.get(userId) ?? userId,
            canEdit: !!CanEdit
        };
    });
}

function getSectionHtml(content: string) {
    let html = '';
    html += `<h3 class="sectionTitle">${globalize.translate('PlaylistSharedWith')}</h3>`;
    html += content;
    return html;
}

/** Builds the read-only "Shared with" section for the given shares. */
export function getPlaylistSharesHtml(shares: PlaylistShare[]): string {
    if (!shares.length) {
        return getSectionHtml(`<div class="fieldDescription">${globalize.translate('PlaylistNotShared')}</div>`);
    }

    let html = '<ul class="playlistSharesList">';
    html += shares.map(share => {
        const permission = globalize.translate(share.canEdit ? 'PlaylistPermissionEdit' : 'PlaylistPermissionRead');
        return `<li class="playlistShareItem">${escapeHtml(share.name)} <span class="fieldDescription">(${permission})</span></li>`;
    }).join('');
    html += '</ul>';

    return getSectionHtml(html);
}

/** Builds the section shown when the shares could not be loaded. */
export function getPlaylistSharesErrorHtml(): string {
    return getSectionHtml(`<div class="fieldDescription playlistSharesError">${globalize.translate('PlaylistSharesError')}</div>`);
}

/**
 * Loads the playlist shares and renders them into the container.
 * Never rejects: API failures render a visible error message instead,
 * so the rest of the dialog keeps working.
 */
export async function renderPlaylistShares(api: Api, playlistId: string, container: HTMLElement): Promise<void> {
    try {
        const shares = await fetchPlaylistShares(api, playlistId);
        container.innerHTML = getPlaylistSharesHtml(shares);
    } catch (err) {
        console.error('[PlaylistShares] failed to load playlist shares', err);
        container.innerHTML = getPlaylistSharesErrorHtml();
    }

    container.classList.remove('hide');
}
