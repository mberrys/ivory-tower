// SPDX-License-Identifier: EPL-2.0 OR GPL-2.0-only WITH Classpath-exception-2.0

import { expect } from 'chai';
import { readIvoryTowerEnvironment, validateIvoryTowerEnvironment } from './environment';
import { SystemClockAdapter } from './system-clock-adapter';

describe('@ivory-tower/infrastructure', () => {
    it('reads default environment values', () => {
        const env = readIvoryTowerEnvironment();
        validateIvoryTowerEnvironment(env);
        expect(env.nodeEnv).to.equal('development');
        expect(env.ivoryTowerEnv).to.equal('local');
    });

    it('provides a system clock adapter', () => {
        const clock = new SystemClockAdapter();
        expect(clock.now()).to.be.instanceOf(Date);
    });
});
