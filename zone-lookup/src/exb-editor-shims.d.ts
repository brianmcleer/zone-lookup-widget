// VS-only ambient module shims for Experience Builder 1.21 on pnpm installs
// where Visual Studio cannot read client\node_modules (IDE1100 access denied).
// Webpack (npm start in client) is the only type authority; this file exists
// solely to silence the IDE.
//
// Modules the widget imports are declared with bodies so names used in TYPE
// positions (ImmutableObject<T>, AllWidgetProps<T>, React.ReactNode) and
// generic hook calls (useState<T>) type-check; everything else is any.
//
// IMPORTANT: nothing here may re-export from a real module path
// (e.g. `export * from 'react/jsx-runtime'`) - that forces VS to resolve the
// real package through the pnpm junction and throws IDE1100 on the transitive
// @types/react files.

declare module 'jimu-core' {
    export namespace React {
        // -- types used in annotations --
        type ReactNode = any
        type ReactElement = any
        type CSSProperties = any
        type ChangeEvent<T = any> = { target: T & { value: any, checked?: boolean } } & Record<string, any>
        type KeyboardEvent<T = any> = { key: string, preventDefault(): void, stopPropagation(): void } & Record<string, any>
        type MouseEvent<T = any> = Record<string, any>
        type FocusEvent<T = any> = Record<string, any>
        type FormEvent<T = any> = Record<string, any>
        type RefObject<T> = { readonly current: T | null }
        type MutableRefObject<T> = { current: T }
        type Ref<T = any> = any
        type FC<P = any> = (props: P) => any
        type ComponentType<P = any> = any
        type Dispatch<A = any> = (value: A) => void
        type SetStateAction<S> = S | ((prev: S) => S)
        // -- hooks with generics (TS2347 without these) --
        function useState<S = any>(initial?: S | (() => S)): [S, Dispatch<SetStateAction<S>>]
        function useRef<T = any>(initial?: T | null): MutableRefObject<T>
        function useCallback<T extends (...args: any[]) => any>(fn: T, deps?: readonly any[]): T
        function useMemo<T = any>(fn: () => T, deps?: readonly any[]): T
        function useEffect(fn: () => void | (() => void), deps?: readonly any[]): void
        function useLayoutEffect(fn: () => void | (() => void), deps?: readonly any[]): void
        function useContext<T = any>(ctx: any): T
        function useReducer(...args: any[]): any
        function useId(): string
        function createElement(...args: any[]): any
        function forwardRef(render: any): any
        function memo(component: any, compare?: any): any
        const Fragment: any
        const StrictMode: any
    }
    // emotion bindings
    export function jsx(...args: any[]): any
    export function css(strings: any, ...values: any[]): any
    // immutable
    export function Immutable<T = any>(value: T): any
    export type ImmutableObject<T = any> = T & {
        set(key: any, value: any): any
        setIn(keys: any[], value: any): any
        asMutable(options?: any): T
        [k: string]: any
    }
    export type ImmutableArray<T = any> = readonly T[] & { asMutable(options?: any): T[] }
    // widget props
    export type AllWidgetProps<T = any> = {
        id: string
        config: T
        useDataSources?: any
        useMapWidgetIds?: any
        theme?: any
        intl?: any
        label?: string
        onSettingChange?: (updates: any) => void
    } & Record<string, any>
    // data sources
    export type DataSource = any
    export type FeatureLayerDataSource = any
    export type UseDataSource = any
    export type IMUseDataSource = any
    export const DataSourceManager: any
    export const DataSourceComponent: any
    export const AllDataSourceTypes: any
}

declare module 'jimu-arcgis' {
    export type JimuMapView = any
    export const JimuMapViewComponent: any
    export function loadArcGISJSAPIModules(modules: string[]): Promise<any[]>
}

declare module 'jimu-for-builder' {
    export type AllWidgetSettingProps<T = any> = {
        id: string
        config: T
        useDataSources?: any
        useMapWidgetIds?: any
        onSettingChange: (updates: any) => void
        intl?: any
        theme?: any
    } & Record<string, any>
}

declare module 'jimu-ui' {
    export const Button: any
    export const TextInput: any
    export const TextArea: any
    export const NumericInput: any
    export const Select: any
    export const Option: any
    export const Switch: any
    export const Tooltip: any
    export const Icon: any
    export const Alert: any
    export const Loading: any
    export const LoadingType: any
}

declare module 'jimu-ui/advanced/setting-components' {
    export const MapWidgetSelector: any
    export const SettingSection: any
    export const SettingRow: any
}

declare module 'jimu-ui/advanced/data-source-selector' {
    export const DataSourceSelector: any
}

declare module 'jimu-ui/basic/color-picker' {
    export const ColorPicker: any
}

// Catch-alls for anything imported in the future.
declare module 'jimu-ui/*'
declare module 'jimu-core/*'
declare module 'jimu-theme'
declare module 'esri/*'
declare module '@esri/*'
declare module 'react'
declare module 'react-dom'
declare module 'react/jsx-runtime'
declare module '@emotion/react'
declare module '@emotion/react/jsx-runtime'
declare module 'seamless-immutable'

declare function require(moduleName: string): any

// Classic JSX (tsconfig "jsx": "react") never resolves a jsx-runtime module,
// but still needs a JSX namespace so elements type-check as any.
declare namespace JSX {
    type Element = any
    interface IntrinsicElements { [k: string]: any }
    interface ElementClass { render(): any }
    interface ElementAttributesProperty { props: {} }
    interface ElementChildrenAttribute { children: {} }
    interface IntrinsicAttributes { [k: string]: any }
}