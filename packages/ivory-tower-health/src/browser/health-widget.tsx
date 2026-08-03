// SPDX-License-Identifier: EPL-2.0 OR GPL-2.0-only WITH Classpath-exception-2.0

import { ReactWidget } from '@theia/core/lib/browser';
import { FrontendApplicationConfigProvider } from '@theia/core/lib/browser/frontend-application-config-provider';
import { inject, injectable, postConstruct } from '@theia/core/shared/inversify';
import * as React from '@theia/core/shared/react';
import { HealthService } from '@ivory-tower/application';
import { HealthStatus } from '@ivory-tower/domain';

@injectable()
export class HealthWidget extends ReactWidget {
    static readonly ID = 'ivory-tower.health.widget';
    static readonly LABEL = 'Ivory Tower Health';

    @inject(HealthService)
    protected readonly healthService: HealthService;

    @postConstruct()
    protected init(): void {
        this.id = HealthWidget.ID;
        this.title.label = HealthWidget.LABEL;
        this.title.caption = HealthWidget.LABEL;
        this.title.closable = false;
        this.update();
    }

    protected render(): React.ReactNode {
        const status: HealthStatus = this.healthService.getStatus();
        const applicationName = FrontendApplicationConfigProvider.get().applicationName;
        return (
            <div className='ivory-tower-health' style={{ padding: '24px', fontFamily: 'var(--theia-ui-font-family)' }}>
                <h1>{applicationName}</h1>
                <p>Status: <strong>{status.level}</strong></p>
                <p>{status.message}</p>
                <p>Checked at: {status.checkedAt}</p>
            </div>
        );
    }
}
