import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { FactionGridItem } from './FactionGridItem'
import { HomeView } from '../views/HomeView'
import { makeActionCard } from '../test/fixtures'

describe('home navigation links', () => {
  it('uses a real link for faction cards while preserving in-app navigation', () => {
    const onOpenFaction = vi.fn()
    render(
      <FactionGridItem
        faction={{ id: 'arborec', name: 'The Arborec', version: 'base' }}
        portraitMode={false}
        onOpenFaction={onOpenFaction}
      />
    )

    const link = screen.getByRole('link', { name: 'View cards for The Arborec' })
    expect(link).toHaveAttribute('href', '/factions/arborec')
    link.addEventListener('click', (event) => event.preventDefault())

    fireEvent.click(link)
    expect(onOpenFaction).toHaveBeenCalledWith('arborec')

    onOpenFaction.mockClear()
    fireEvent.click(link, { metaKey: true })
    expect(onOpenFaction).not.toHaveBeenCalled()
  })

  it('uses real links for available categories', () => {
    const onOpenCategory = vi.fn()
    render(
      <HomeView
        factions={[]}
        priorityFactions={[]}
        cards={[makeActionCard(1)]}
        expansions={new Set()}
        onOpenSearch={vi.fn()}
        onOpenFaction={vi.fn()}
        onOpenCategory={onOpenCategory}
      />
    )

    const link = screen.getByRole('link', { name: 'Action Cards' })
    expect(link).toHaveAttribute('href', '/categories/action_cards')
    link.addEventListener('click', (event) => event.preventDefault())

    fireEvent.click(link)
    expect(onOpenCategory).toHaveBeenCalledWith('action')

    onOpenCategory.mockClear()
    fireEvent.click(link, { ctrlKey: true })
    expect(onOpenCategory).not.toHaveBeenCalled()
  })
})
