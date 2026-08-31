// *****************************************************************************
// Copyright (C) 2026 Maksim Kachurin and others.
//
// This program and the accompanying materials are made available under the
// terms of the Eclipse Public License v. 2.0 which is available at
// http://www.eclipse.org/legal/epl-2.0.
//
// SPDX-License-Identifier: EPL-2.0 OR GPL-2.0-only WITH Classpath-exception-2.0
// *****************************************************************************

import { expect } from 'chai';
import { LIST_JSON, PLUGINS_BASE_PATH } from '@theia/plugin-utils/lib/common/constants';
import { BrowserOnlyPluginsProviderImpl } from './browser-only-plugins-provider';

describe('BrowserOnlyPluginsProviderImpl', () => {
    const originalFetch = global.fetch;

    afterEach(() => {
        global.fetch = originalFetch;
    });

    it('loads deployed plugins from the static list.json asset', async () => {
        const deployed = [{ metadata: { model: { id: 'publisher_name', publisher: 'publisher', name: 'name' } } }];
        global.fetch = async (input: RequestInfo | URL) => {
            expect(String(input)).to.equal(`${PLUGINS_BASE_PATH}/${LIST_JSON}`);
            return new Response(JSON.stringify(deployed), { status: 200 });
        };

        const provider = new BrowserOnlyPluginsProviderImpl();
        expect(await provider.getPlugins()).to.deep.equal(deployed);
        expect(await provider.getPlugins()).to.deep.equal(deployed);
    });

    it('returns an empty list when list.json is unavailable', async () => {
        global.fetch = async () => new Response('', { status: 404 });

        const provider = new BrowserOnlyPluginsProviderImpl();
        expect(await provider.getPlugins()).to.deep.equal([]);
    });
});
