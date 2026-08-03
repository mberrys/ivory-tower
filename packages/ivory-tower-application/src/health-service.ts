// SPDX-License-Identifier: EPL-2.0 OR GPL-2.0-only WITH Classpath-exception-2.0

import { ClockPort } from '@ivory-tower/adapters';
import { HealthStatus } from '@ivory-tower/domain';

export class HealthService {
    constructor(private readonly clock: ClockPort) {}

    getStatus(): HealthStatus {
        return {
            level: 'ok',
            message: 'Ivory Tower scaffold is running',
            checkedAt: this.clock.now().toISOString(),
        };
    }
}
