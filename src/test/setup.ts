import '@testing-library/jest-dom/vitest'
import { afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'

/**
 * Testing Library only auto-cleans when Vitest runs with `globals: true`, which this project does
 * not enable. Without this, every render stays in the document and queries start matching
 * leftovers from earlier tests.
 */
afterEach(cleanup)
