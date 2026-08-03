// SPDX-License-Identifier: EPL-2.0 OR GPL-2.0-only WITH Classpath-exception-2.0

import { expect } from 'chai';
import { HealthService } from './health-service';

describe('@ivory-tower/application', () => {
    it('reports ok health from the scaffold service', () => {
        const service = new HealthService({ now: () => new Date('2026-08-02T12:00:00.000Z') });
        const status = service.getStatus();
        expect(status.level).to.equal('ok');
        expect(status.checkedAt).to.equal('2026-08-02T12:00:00.000Z');
    });
});
