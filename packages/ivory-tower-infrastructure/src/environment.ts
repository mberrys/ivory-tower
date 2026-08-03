// SPDX-License-Identifier: EPL-2.0 OR GPL-2.0-only WITH Classpath-exception-2.0

export interface IvoryTowerEnvironment {
    readonly nodeEnv: string;
    readonly ivoryTowerEnv: string;
}

export function readIvoryTowerEnvironment(): IvoryTowerEnvironment {
    const nodeEnv = process.env.NODE_ENV ?? 'development';
    const ivoryTowerEnv = process.env.IVORY_TOWER_ENV ?? 'local';
    return { nodeEnv, ivoryTowerEnv };
}

export function validateIvoryTowerEnvironment(env: IvoryTowerEnvironment): void {
    const allowedNodeEnvs = new Set(['development', 'production', 'test']);
    const allowedIvoryEnvs = new Set(['local', 'staging', 'production']);

    if (!allowedNodeEnvs.has(env.nodeEnv)) {
        throw new Error(`Invalid NODE_ENV: ${env.nodeEnv}`);
    }
    if (!allowedIvoryEnvs.has(env.ivoryTowerEnv)) {
        throw new Error(`Invalid IVORY_TOWER_ENV: ${env.ivoryTowerEnv}`);
    }
}
