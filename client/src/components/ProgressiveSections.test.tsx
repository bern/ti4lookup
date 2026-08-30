import { act, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { ProgressiveSections, type ResultSection } from './ProgressiveSections'
import { makeActionCards } from '../test/fixtures'
import {
  installIntersectionObserverMock,
  observerAt,
  observerCount,
  triggerLatestIntersection,
} from '../test/intersectionObserver'

// These values document the expected defaults independently from the component.
// If a production default changes accidentally, these tests should fail.
const EXPECTED_INITIAL_BATCH_SIZE = 8
const EXPECTED_BATCH_SIZE = 8

function mountedRows(container: HTMLElement): Element[] {
  return Array.from(container.querySelectorAll('.results-list__item'))
}

describe('ProgressiveSections', () => {
  beforeEach(() => {
    installIntersectionObserverMock()
  })

  it('shows only the initial batch size of cards at first, even if multiple sections are loaded', () => {
    const cards = makeActionCards(12)
    const sections: ResultSection[] = [
      { key: 'first', title: 'First', groups: [{ cards: cards.slice(0, 6) }] },
      { key: 'second', title: 'Second', groups: [{ cards: cards.slice(6) }] },
    ]

    const { container } = render(<ProgressiveSections sections={sections} />)

    expect(mountedRows(container)).toHaveLength(EXPECTED_INITIAL_BATCH_SIZE)
    expect(screen.getByText('Card 06')).toBeInTheDocument()
    expect(screen.getByText('Card 08')).toBeInTheDocument()
    expect(screen.queryByText('Card 09')).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Second' })).toBeInTheDocument()
    expect(container.querySelector('.results-sentinel')).toBeInTheDocument()
  })

  it.each([
    { cardCount: 0, shouldOfferMore: false },
    { cardCount: EXPECTED_INITIAL_BATCH_SIZE, shouldOfferMore: false },
    { cardCount: EXPECTED_INITIAL_BATCH_SIZE + 1, shouldOfferMore: true },
  ])('handles a list of $cardCount cards', ({ cardCount, shouldOfferMore }) => {
    const sections: ResultSection[] = [
      { key: 'cards', groups: [{ cards: makeActionCards(cardCount) }] },
    ]
    const { container } = render(<ProgressiveSections sections={sections} />)

    expect(mountedRows(container)).toHaveLength(Math.min(cardCount, EXPECTED_INITIAL_BATCH_SIZE))
    expect(Boolean(container.querySelector('.results-sentinel'))).toBe(shouldOfferMore)
  })

  it('does not load more cards before the user reaches the end', () => {
    const sections: ResultSection[] = [
      { key: 'cards', groups: [{ cards: makeActionCards(20) }] },
    ]
    const { container } = render(<ProgressiveSections sections={sections} />)

    act(() => triggerLatestIntersection(false))

    expect(mountedRows(container)).toHaveLength(EXPECTED_INITIAL_BATCH_SIZE)
    expect(container.querySelector('.results-sentinel')).toBeInTheDocument()
  })

  it('stops watching for more cards when the list is removed', () => {
    const sections: ResultSection[] = [
      { key: 'cards', groups: [{ cards: makeActionCards(20) }] },
    ]
    const { unmount } = render(<ProgressiveSections sections={sections} />)
    const observer = observerAt(0)

    unmount()

    expect(observer.disconnect).toHaveBeenCalledOnce()
  })

  it('more cards come in via latest intersection triggers, until every card is shown', () => {
    const sections: ResultSection[] = [
      { key: 'cards', groups: [{ cards: makeActionCards(20) }] },
    ]
    const { container } = render(<ProgressiveSections sections={sections} />)

    expect(mountedRows(container)).toHaveLength(EXPECTED_INITIAL_BATCH_SIZE)

    act(() => triggerLatestIntersection())
    expect(mountedRows(container)).toHaveLength(EXPECTED_INITIAL_BATCH_SIZE + EXPECTED_BATCH_SIZE)

    act(() => triggerLatestIntersection())
    expect(mountedRows(container)).toHaveLength(20)
    expect(screen.getByText('Card 20')).toBeInTheDocument()
    expect(container.querySelector('.results-sentinel')).not.toBeInTheDocument()
  })

  it('keeps attempting to load new batches when the user reaches the end of the section', () => {
    const totalCards = 33
    const sections: ResultSection[] = [
      { key: 'cards', groups: [{ cards: makeActionCards(totalCards) }] },
    ]
    const { container } = render(<ProgressiveSections sections={sections} />)
    const expectedCounts = [
      EXPECTED_INITIAL_BATCH_SIZE + EXPECTED_BATCH_SIZE,
      EXPECTED_INITIAL_BATCH_SIZE + EXPECTED_BATCH_SIZE * 2,
      EXPECTED_INITIAL_BATCH_SIZE + EXPECTED_BATCH_SIZE * 3,
      totalCards,
    ]

    for (const expectedCount of expectedCounts) {
      const previousObserverIndex = observerCount() - 1
      act(() => triggerLatestIntersection())
      expect(mountedRows(container)).toHaveLength(expectedCount)
      expect(observerAt(previousObserverIndex).disconnect).toHaveBeenCalledOnce()
    }

    expect(screen.getByText('Card 33')).toBeInTheDocument()
  })

  it('skips empty sections. faction setup counted as one item', () => {
    const sections: ResultSection[] = [
      { key: 'empty', title: 'Empty section', groups: [{ cards: [] }] },
      {
        key: 'populated',
        title: 'Populated section',
        leadNode: <div>Faction setup</div>,
        groups: [
          { subtitle: 'Empty group', cards: [] },
          { subtitle: 'Cards', cards: makeActionCards(10) },
        ],
      },
    ]

    const { container } = render(<ProgressiveSections sections={sections} />)

    expect(screen.queryByRole('heading', { name: 'Empty section' })).not.toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Empty group' })).not.toBeInTheDocument()
    expect(screen.getByText('Faction setup')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Cards' })).toBeInTheDocument()
    expect(mountedRows(container)).toHaveLength(EXPECTED_INITIAL_BATCH_SIZE - 1)

    act(() => triggerLatestIntersection())
    expect(mountedRows(container)).toHaveLength(10)
    expect(screen.getByText('Card 08')).toBeInTheDocument()
  })

  it('starts over with the initial batch size of cards when the search changes', () => {
    const firstSections: ResultSection[] = [
      { key: 'first', groups: [{ cards: makeActionCards(20, 'first') }] },
    ]
    const secondSections: ResultSection[] = [
      {
        key: 'second',
        groups: [{
          cards: makeActionCards(12, 'second').map((card) => ({
            ...card,
            name: `New ${card.name}`,
          })),
        }],
      },
    ]
    const { container, rerender } = render(
      <ProgressiveSections key="first-query" sections={firstSections} />
    )

    act(() => triggerLatestIntersection())
    expect(mountedRows(container)).toHaveLength(EXPECTED_INITIAL_BATCH_SIZE + EXPECTED_BATCH_SIZE)

    rerender(<ProgressiveSections key="second-query" sections={secondSections} />)

    expect(mountedRows(container)).toHaveLength(EXPECTED_INITIAL_BATCH_SIZE)
    expect(screen.getByText('New Card 01')).toBeInTheDocument()
    expect(screen.queryByText('Card 01', { exact: true })).not.toBeInTheDocument()
  })

  it('keeps every card reachable after results shrink and grow again', () => {
    const allCards = makeActionCards(20)
    const allSections: ResultSection[] = [
      { key: 'cards', groups: [{ cards: allCards }] },
    ]
    const reducedSections: ResultSection[] = [
      { key: 'cards', groups: [{ cards: allCards.slice(-4) }] },
    ]
    const { container, rerender } = render(
      <ProgressiveSections sections={allSections} />
    )

    act(() => triggerLatestIntersection())
    expect(mountedRows(container)).toHaveLength(EXPECTED_INITIAL_BATCH_SIZE + EXPECTED_BATCH_SIZE)

    rerender(<ProgressiveSections sections={reducedSections} />)
    expect(mountedRows(container)).toHaveLength(4)
    expect(screen.queryByText('Card 01')).not.toBeInTheDocument()
    expect(container.querySelector('.results-sentinel')).not.toBeInTheDocument()

    rerender(<ProgressiveSections sections={allSections} />)
    expect(mountedRows(container)).toHaveLength(EXPECTED_INITIAL_BATCH_SIZE + EXPECTED_BATCH_SIZE)
    expect(screen.getByText('Card 01')).toBeInTheDocument()
    expect(container.querySelector('.results-sentinel')).toBeInTheDocument()

    act(() => triggerLatestIntersection())
    expect(mountedRows(container)).toHaveLength(20)
    expect(screen.getByText('Card 20')).toBeInTheDocument()
    expect(container.querySelector('.results-sentinel')).not.toBeInTheDocument()
  })

  it('respects explicit initial counts and batch size passed as params', () => {
    const sections: ResultSection[] = [
      { key: 'cards', groups: [{ cards: makeActionCards(10) }] },
    ]
    const { container } = render(
      <ProgressiveSections sections={sections} initialCount={3} batchSize={2} />
    )

    expect(mountedRows(container)).toHaveLength(3)
    act(() => triggerLatestIntersection())
    expect(mountedRows(container)).toHaveLength(5)
  })
})
