import { mapToObject } from 'src/util/map-set-helpers'

class ImportStateManager {
    static STORAGE_PREFIX = 'import-items-'
    static DEF_CHUNK_SIZE = 100
    static generateChunkKey = key =>
        `${ImportStateManager.STORAGE_PREFIX}${key}`

    /**
     * @property {string[]} Stack of different storage keys used for storing import items state.
     */
    storageKeyStack = []

    /**
     * @property {number}
     */
    chunkSize

    /**
     * @param {number} [chunkSize] Unsigned int to represent size of chunks to return from each `getItems` iteration.
     */
    constructor(initChunkSize = ImportStateManager.DEF_CHUNK_SIZE) {
        this.chunkSize = initChunkSize
    }

    /**
     * @generator
     * @yields {any} Object containing `chunkKey` and `chunk` pair, corresponding to the chunk storage key
     *  and value at that storage key, respectively.
     */
    async *getItems() {
        for (const key in this.storageKeyStack) {
            const chunkKey = ImportStateManager.generateChunkKey(key)

            // Each iteration should yield both the current chunk key and assoc. chunk values (import items)
            yield { chunkKey, chunk: await this.getChunk(chunkKey) }
        }
    }

    /**
     * Splits up a Map into an Array of objects of specified size to use as state chunks.
     *
     * @param {Map<string|number, any>} map Map of key value pairs.
     * @returns {any[]} Array of objects of size `this.chunkSize`, created from input Map.
     */
    splitChunks(map) {
        const pairs = [...map]
        const chunks = []

        for (let i = 0; i < pairs.length; i += this.chunkSize) {
            const pairsMap = new Map(pairs.slice(i, i + this.chunkSize))
            chunks.push(mapToObject(pairsMap))
        }

        return chunks
    }

    /**
     * @param {string} chunkKey Storage key to store chunk as a value of.
     * @param {any} chunk Chunk of total state to store.
     */
    async addChunk(chunk) {
        const chunkKey = ImportStateManager.generateChunkKey(
            this.storageKeyStack.length,
        )

        this.storageKeyStack.push(chunkKey) // Track storage key in stack state
        await browser.storage.local.set({ [chunkKey]: chunk }) // Store chunk
    }

    async getChunk(chunkKey) {
        const storage = await browser.storage.local.get(chunkKey)
        return storage[chunkKey]
    }

    /**
     * @param {Map<string, ImportItem>} itemsMap Array of import items to set as state.
     */
    async setItems(itemsMap) {
        for (const itemsChunk of this.splitChunks(itemsMap)) {
            await this.addChunk(itemsChunk)
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
