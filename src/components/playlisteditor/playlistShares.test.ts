import type { Api } from '@jellyfin/sdk';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { fetchPlaylistShares, getPlaylistSharesHtml, renderPlaylistShares } from './playlistShares';

const getPlaylistUsers = vi.fn();
const getUsers = vi.fn();

vi.mock('@jellyfin/sdk/lib/utils/api/playlist-api', () => ({
    getPlaylistApi: () => ({ getPlaylistUsers })
}));

vi.mock('@jellyfin/sdk/lib/utils/api/user-api', () => ({
    getUserApi: () => ({ getUsers })
}));

// Return the translation key so assertions do not depend on locale files
vi.mock('lib/globalize', () => ({
    default: { translate: (key: string) => key }
}));

const api = {} as Api;

describe('fetchPlaylistShares', () => {
    beforeEach(() => {
        getPlaylistUsers.mockReset();
        getUsers.mockReset();
    });

    it('maps playlist users to display names and permissions', async () => {
        getPlaylistUsers.mockResolvedValue({
            data: [
                { UserId: 'u1', CanEdit: true },
                { UserId: 'u2', CanEdit: false }
            ]
        });
        getUsers.mockResolvedValue({
            data: [
                { Id: 'u1', Name: 'Alice' },
                { Id: 'u2', Name: 'Bob' }
            ]
        });

        const shares = await fetchPlaylistShares(api, 'playlist-1');

        expect(getPlaylistUsers).toHaveBeenCalledWith({ playlistId: 'playlist-1' });
        expect(shares).toEqual([
            { userId: 'u1', name: 'Alice', canEdit: true },
            { userId: 'u2', name: 'Bob', canEdit: false }
        ]);
    });

    it('falls back to the user id when the name cannot be resolved', async () => {
        getPlaylistUsers.mockResolvedValue({ data: [ { UserId: 'u3' } ] });
        getUsers.mockRejectedValue(new Error('Forbidden'));

        const shares = await fetchPlaylistShares(api, 'playlist-1');

        expect(shares).toEqual([ { userId: 'u3', name: 'u3', canEdit: false } ]);
    });

    it('rejects when the playlist users request fails', async () => {
        getPlaylistUsers.mockRejectedValue(new Error('Network error'));

        await expect(fetchPlaylistShares(api, 'playlist-1')).rejects.toThrow('Network error');
    });
});

describe('getPlaylistSharesHtml', () => {
    it('renders each user with its permission label', () => {
        const html = getPlaylistSharesHtml([
            { userId: 'u1', name: 'Alice', canEdit: true },
            { userId: 'u2', name: 'Bob', canEdit: false }
        ]);

        const container = document.createElement('div');
        container.innerHTML = html;
        const rows = Array.from(container.querySelectorAll('.playlistShareItem'));

        expect(container.textContent).toContain('PlaylistSharedWith');
        expect(rows).toHaveLength(2);
        expect(rows[0].textContent).toContain('Alice');
        expect(rows[0].textContent).toContain('PlaylistPermissionEdit');
        expect(rows[1].textContent).toContain('Bob');
        expect(rows[1].textContent).toContain('PlaylistPermissionRead');
    });

    it('renders the empty state when there are no shares', () => {
        const container = document.createElement('div');
        container.innerHTML = getPlaylistSharesHtml([]);

        expect(container.querySelectorAll('.playlistShareItem')).toHaveLength(0);
        expect(container.textContent).toContain('PlaylistNotShared');
    });

    it('escapes user names', () => {
        const html = getPlaylistSharesHtml([
            { userId: 'u1', name: '<img src=x onerror=alert(1)>', canEdit: false }
        ]);

        expect(html).not.toContain('<img');
        expect(html).toContain('&lt;img src=x onerror=alert(1)&gt;');
    });
});

describe('renderPlaylistShares', () => {
    beforeEach(() => {
        getPlaylistUsers.mockReset();
        getUsers.mockReset();
    });

    it('shows the share list in the container', async () => {
        getPlaylistUsers.mockResolvedValue({ data: [ { UserId: 'u1', CanEdit: true } ] });
        getUsers.mockResolvedValue({ data: [ { Id: 'u1', Name: 'Alice' } ] });
        const container = document.createElement('div');
        container.classList.add('hide');

        await renderPlaylistShares(api, 'playlist-1', container);

        expect(container.classList.contains('hide')).toBe(false);
        expect(container.textContent).toContain('Alice');
    });

    it('shows a visible error message when the API fails', async () => {
        getPlaylistUsers.mockRejectedValue(new Error('Network error'));
        vi.spyOn(console, 'error').mockImplementation(() => { /* silence expected error */ });
        const container = document.createElement('div');
        container.classList.add('hide');

        await expect(renderPlaylistShares(api, 'playlist-1', container)).resolves.toBeUndefined();

        expect(container.classList.contains('hide')).toBe(false);
        expect(container.querySelector('.playlistSharesError')?.textContent).toContain('PlaylistSharesError');
        expect(container.querySelectorAll('.playlistShareItem')).toHaveLength(0);
    });
});
