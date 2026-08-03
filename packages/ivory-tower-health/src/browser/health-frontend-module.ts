// SPDX-License-Identifier: EPL-2.0 OR GPL-2.0-only WITH Classpath-exception-2.0

import { ClockPort } from '@ivory-tower/adapters';
import { HealthService } from '@ivory-tower/application';
import { SystemClockAdapter } from '@ivory-tower/infrastructure';
import {
    bindViewContribution,
    FrontendApplicationContribution,
    noopWidgetStatusBarContribution,
    WidgetFactory,
    WidgetStatusBarContribution,
} from '@theia/core/lib/browser';
import { ContainerModule, interfaces } from '@theia/core/shared/inversify';
import { HealthContribution } from './health-contribution';
import { HealthWidget } from './health-widget';

export default new ContainerModule((bind: interfaces.Bind) => {
    bind<ClockPort>(ClockPort).toConstantValue(new SystemClockAdapter());
    bind(HealthService).toSelf().inSingletonScope();

    bindViewContribution(bind, HealthContribution);
    bind(FrontendApplicationContribution).toService(HealthContribution);
    bind(WidgetStatusBarContribution).toConstantValue(noopWidgetStatusBarContribution(HealthWidget));
    bind(HealthWidget).toSelf();
    bind(WidgetFactory).toDynamicValue(context => ({
        id: HealthWidget.ID,
        createWidget: () => context.container.get<HealthWidget>(HealthWidget),
    })).inSingletonScope();
});
