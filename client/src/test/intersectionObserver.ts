import { vi } from 'vitest'

interface ObserverRecord {
  callback: IntersectionObserverCallback
  observer: IntersectionObserver
}

let records: ObserverRecord[] = []

export function installIntersectionObserverMock() {
  records = []

  class MockIntersectionObserver implements IntersectionObserver {
    readonly root = null
    readonly rootMargin = '800px'
    readonly thresholds = [0]
    disconnect = vi.fn()
    observe = vi.fn()
    takeRecords = vi.fn(() => [])
    unobserve = vi.fn()

    constructor(callback: IntersectionObserverCallback) {
      records.push({ callback, observer: this })
    }
  }

  vi.stubGlobal('IntersectionObserver', MockIntersectionObserver)
}

export function triggerLatestIntersection(isIntersecting = true) {
  const record = records[records.length - 1]
  if (!record) throw new Error('No IntersectionObserver has been created')

  record.callback(
    [{ isIntersecting } as IntersectionObserverEntry],
    record.observer
  )
}

export function observerCount(): number {
  return records.length
}

export function observerAt(index: number): IntersectionObserver {
  const record = records[index]
  if (!record) throw new Error(`No IntersectionObserver exists at index ${index}`)
  return record.observer
}
