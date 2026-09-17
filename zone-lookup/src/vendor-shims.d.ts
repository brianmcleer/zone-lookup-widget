// vendor-shims.d.ts
// City of Grand Junction GIS Division
//
// Widget-specific editor declarations for the Zone Lookup widget, added with the
// in-widget help guide. Sits beside exb-editor-shims.d.ts so that file is not
// edited per feature. Editor only: emits nothing, the Experience Builder webpack
// build never reads this file. Keep it a script (no top-level import/export).

// jimu-ui members the help guide uses that the widget's shim did not list.
declare module 'jimu-ui' {
    export const Modal: any
    export const ModalHeader: any
    export const ModalBody: any
    export const ModalFooter: any
}

// Calcite wrapper supplied by Experience Builder (real path jimu-ui/calcite-components).
declare module 'calcite-components' {
    export const CalciteIcon: any
    export const CalciteChip: any
    const mod: any
    export default mod
}
