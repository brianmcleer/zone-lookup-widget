import type { HelpSection } from './components/HelpPopup'

/**
 * Flags the widget computes from config and live status. One per feature that has help text.
 * widget.tsx computes these with the same checks the render code uses (for example
 * `config.enableMapClick` plus `!!useMapWidgetIds?.[0]`), so the guide never describes a
 * button the widget is not currently showing.
 */
export interface HelpFeatures {
    /* ways to start a lookup */
    myLocation: boolean
    mapClick: boolean
    mapConnected: boolean
    /* around the answer card */
    hero: boolean
    share: boolean
    print: boolean
    /* other controls */
    recentSearches: boolean
    resetButton: boolean
    /* button names exactly as the interface shows them */
    labels: HelpLabels
}

export interface HelpLabels {
    address: string
    myLocation: string
    clickMap: string
    share: string
    print: string
    reset: string
    tryAnother: string
    recentSearches: string
    clearRecent: string
}

type T = (id: string, values?: Record<string, string>) => string

export function buildHelpSections (t: T, f: HelpFeatures): HelpSection[] {
    const L = f.labels
    const when = (on: boolean, ...ids: string[]): string[] => (on ? ids.map((id: string) => t(id)) : [])
    const listOf = (parts: string[]): string =>
        parts.length <= 1 ? (parts[0] ?? '') : `${parts.slice(0, -1).join(', ')} ${t('helpAnd')} ${parts[parts.length - 1]}`

    /* Only the ways that are actually on screen, in the order the buttons appear. */
    const wayNames: string[] = [
        ...(f.myLocation ? [L.myLocation] : []),
        ...(f.mapClick ? [L.clickMap] : [])
    ]
    const anyWay = wayNames.length > 0

    /* Buttons on the answer card, same order as the toolbar. */
    const actionNames: string[] = [
        ...(f.share ? [L.share] : []),
        ...(f.print ? [L.print] : [])
    ]
    const anyAction = actionNames.length > 0

    const sections: HelpSection[] = [
        {
            key: 'start',
            icon: 'play',
            title: t('helpStartTitle'),
            ordered: true,
            body: [
                t('helpStart1', { address: L.address }),
                t('helpStart2'),
                f.mapConnected ? t('helpStart3Map') : t('helpStart3')
            ]
        }
    ]

    sections.push({
        key: 'find',
        icon: 'search',
        title: t('helpFindTitle'),
        body: [
            t('helpFind1'),
            t('helpFind2'),
            t('helpFind3'),
            ...(f.resetButton ? [t('helpFindReset', { reset: L.reset })] : []),
            t('helpFind4')
        ]
    })

    if (anyWay) {
        sections.push({
            key: 'ways',
            icon: 'compass',
            title: t('helpWaysTitle'),
            intro: t('helpWaysIntro', { ways: listOf(wayNames) }),
            body: [
                ...(f.myLocation ? [t('helpWaysLocation', { name: L.myLocation })] : []),
                ...(f.mapClick && f.mapConnected ? [t('helpWaysClick', { name: L.clickMap })] : []),
                ...(f.mapClick && !f.mapConnected ? [t('helpWaysClickNoMap', { name: L.clickMap })] : [])
            ]
        })
    }

    sections.push({
        key: 'result',
        icon: 'pin',
        title: t('helpResultTitle'),
        body: [
            ...when(f.hero, 'helpResultHero'),
            t('helpResult1'),
            ...when(f.mapConnected, 'helpResultMap'),
            t('helpResultOutside', { tryAnother: L.tryAnother })
        ]
    })

    if (f.recentSearches) {
        sections.push({
            key: 'recent',
            icon: 'clock',
            title: t('helpRecentTitle'),
            body: [
                t('helpRecent1', { recent: L.recentSearches }),
                t('helpRecent2'),
                t('helpRecent3', { clear: L.clearRecent })
            ]
        })
    }

    if (anyAction) {
        sections.push({
            key: 'actions',
            icon: 'share',
            title: t('helpActionsTitle'),
            intro: t('helpActionsIntro', { actions: listOf(actionNames) }),
            body: [
                ...(f.share ? [t('helpActionsShare', { name: L.share })] : []),
                ...(f.print ? [t('helpActionsPrint', { name: L.print })] : [])
            ]
        })
    }

    sections.push({
        key: 'trouble',
        icon: 'exclamation-mark-triangle',
        title: t('helpTroubleTitle'),
        body: [
            t('helpTroubleNoList'),
            t('helpTroubleNoMatch'),
            t('helpTroubleOutside'),
            ...(f.myLocation ? [t('helpTroubleLocation', { name: L.myLocation })] : []),
            ...(f.mapClick ? [t('helpTroubleClick', { name: L.clickMap })] : []),
            ...(f.share ? [t('helpTroubleShare')] : []),
            ...(f.print ? [t('helpTroublePrint', { name: L.print })] : []),
            t('helpTroubleBlank'),
            t('helpTroubleContact')
        ]
    })

    sections.push({
        key: 'tips',
        icon: 'lightbulb',
        title: t('helpTipsTitle'),
        body: [
            t('helpTips1'),
            t('helpTips2'),
            ...when(f.recentSearches, 'helpTips3'),
            t('helpTips4')
        ]
    })

    return sections
}
