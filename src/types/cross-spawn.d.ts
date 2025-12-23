declare module 'cross-spawn' {
  import { SpawnOptions, SpawnSyncOptions, SpawnSyncReturns } from 'child_process';
  
  export function spawn(
    command: string,
    args?: readonly string[],
    options?: SpawnOptions
  ): import('child_process').ChildProcess;
  
  export function spawnSync(
    command: string,
    args?: readonly string[],
    options?: SpawnSyncOptions
  ): SpawnSyncReturns<Buffer>;
  
  export default spawn;
} 