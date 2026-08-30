import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { CategoryView } from './CategoryView'
import { SearchView } from './SearchView'
import { makeActionCards } from '../test/fixtures'
import { installIntersectionObserverMock, triggerLatestIntersection } from '../test/intersectionObserver'
import type { CardItem } from '../types'

function namedCards(prefix: string, count: number): CardItem[] {
  return makeActionCards(count, prefix).map((card) => ({
    ...card,
    name: `${prefix} ${card.name}`,
    searchText: `${prefix} ${card.searchText}`,
  }))
}

function mountedRows(container: HTMLElement): Element[] {
  return Array.from(container.querySelectorAll('.results-list__item'))
}

function renderSearchView(cards: CardItem[]) {
  return render(
    <SearchView
      cards={cards}
      recentSearches={[]}
      factionFilter={null}
      factionFilterName={null}
      faction={null}
      techNameToColor={new Map()}
      isTwilightsFall={false}
      onAddRecent={vi.fn()}
      onBack={vi.fn()}
    />
  )
}

describe('progressive view integration', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    installIntersectionObserverMock()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('does not mount the complete card list before a global search', () => {
    const { container } = renderSearchView(namedCards('Alpha', 20))

    expect(mountedRows(container)).toHaveLength(0)
    expect(container.querySelector('.results-sentinel')).not.toBeInTheDocument()
  })

  it('resets global search results to the initial batch when the query changes', () => {
    const cards = [...namedCards('Alpha', 20), ...namedCards('Beta', 12)]
    const { container } = renderSearchView(cards)
    const input = screen.getByRole('searchbox', { name: 'Search all categories' })

    fireEvent.change(input, { target: { value: 'Alpha' } })
    act(() => vi.advanceTimersByTime(50))

    expect(mountedRows(container)).toHaveLength(8)
    act(() => triggerLatestIntersection())
    expect(mountedRows(container)).toHaveLength(16)

    fireEvent.change(input, { target: { value: 'Beta' } })
    act(() => vi.advanceTimersByTime(50))

    expect(mountedRows(container)).toHaveLength(8)
    expect(screen.getByText('Beta Card 01')).toBeInTheDocument()
    expect(screen.queryByText('Alpha Card 01')).not.toBeInTheDocument()
  })

  it('resets category results to the initial batch after filtering', () => {
    const cards = [...namedCards('Alpha', 20), ...namedCards('Beta', 12)]
    const { container } = render(
      <CategoryView
        cards={cards}
        category="action"
        onBack={vi.fn()}
        isTwilightsFall={false}
      />
    )

    expect(mountedRows(container)).toHaveLength(8)
    act(() => triggerLatestIntersection())
    expect(mountedRows(container)).toHaveLength(16)

    fireEvent.change(
      screen.getByRole('searchbox', { name: 'Search action cards' }),
      { target: { value: 'Beta' } }
    )
    act(() => vi.advanceTimersByTime(50))

    expect(mountedRows(container)).toHaveLength(8)
    expect(screen.getByRole('heading', { name: 'Action Cards' })).toBeInTheDocument()
    expect(screen.getByText('Beta Card 01')).toBeInTheDocument()
    expect(screen.queryByText('Alpha Card 01')).not.toBeInTheDocument()
  })
})
