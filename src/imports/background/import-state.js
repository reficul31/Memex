import chunk from 'lodash/fp/chunk'

class ImportStateManager {
    static STORAGE_PREFIX = 'import-items-'
    static DEF_CHUNK_SIZE = 100

    /**
     * @property {string[]} Stack of different storage keys used for storing import items state.
     */
    storageKeyStack = []

    /**
     * @property {(Array<any>) => Array<Array<any>>} Function to handle chunking of input arrays.
     */
    splitChunks

    /**
     * @param {number} [chunkSize] Unsigned int to represent size of chunks to return from each `getItems` iteration.
     */
    constructor(chunkSize = ImportStateManager.DEF_CHUNK_SIZE) {
        this.splitChunks = chunk(chunkSize)
    }

    /**
     * @generator
     * @yields {any} Object containing `chunkKey` and `chunk` pair, corresponding to the chunk storage key
     *  and value at that storage key, respectively.
     */
    async *getItems() {
        for (const key in this.storageKeyStack) {
            const storage = await browser.storage.local.get(key)

            // Each iteration should yield both the current chunk key and assoc. chunk values (import items)
            yield {
                chunkKey: key,
                chunk: storage[key],
            }
        }
    }

    /**
     * @param {Array<ImportItem>} items Array of import items to add to state.
     */
    async setItems(items) {
        const chunkedItems = this.splitChunks(items)

        for (const itemsChunk in chunkedItems) {
            // Generate current chunk's key
            const currKey = `${ImportStateManager.STORAGE_PREFIX}${this
                .storageKeyStack.length}`

            // Add current chunk's key to key stack state
            this.storageKeyStack.push(currKey)

            // Store current chunk under generated key
            await browser.storage.local.set({ [currKey]: itemsChunk })
        }
    }

    /**
     * Removes a single import item from its stored chunk.
     *
     * @param {string} chunkKey Storage key of chunk in which item wanted to remove exists.
     * @param {string} itemKey Key within chunk pointing item to remove.
     */
    async removeItem(chunkKey, itemKey) {
        const { [chunkKey]: chunk } = await browser.storage.local.get({
            [chunkKey]: {},
        })

        // Destructure existing state, removing the unwanted item, then update storage with remaining state
        const { [itemKey]: itemToRemove, ...remainingChunk } = chunk
        await browser.storage.local.set({ [chunkKey]: remainingChunk })
    }

    async clear() {
        let key

        while (this.storageKeyStack.length) {
            key = this.storageKeyStack.pop()
            await browser.storage.local.remove(key)
        }
    }
}

export default ImportStateManager
