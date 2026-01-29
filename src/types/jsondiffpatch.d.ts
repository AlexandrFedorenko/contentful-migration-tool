declare module 'jsondiffpatch' {
    export class DiffPatcher {
        constructor(options?: any);
        diff(oldValue: any, newValue: any): any;
    }
    export function create(options?: any): DiffPatcher;
}

declare module 'jsondiffpatch/formatters/html' {
    export function format(delta: any, left: any): string;
}
