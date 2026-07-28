import { writable } from 'svelte/store'
import { isDebugEnabled } from './utils'

export const debugStore = writable(isDebugEnabled())
