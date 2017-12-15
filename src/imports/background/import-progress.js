import stateManager from './import-state'
import processImportItem from './import-item-processor'

class ImportProgressManager {
    static STATE_STORAGE_KEY = 'import-running-state'
    static CONCURR_LIMIT = 5

    /**
     * @property {any} Token object to afford cancellation of currently running Promises.
     */
    token = {}

    /**
     * @property {number} Level of concurrency for passing to `chunkProcessor`
     */
    _concurrency

    /**
     * @property {(any) => void} Logic to run after item processed (used to send port message for each item).
     */
    afterItemCb

    constructor(initConcurrency, afterItemCb = f => f) {
        this.concurrency = initConcurrency
        this.afterItemCb = afterItemCb
    }

    set concurrency(value) {
        if (value > 0 && value <= ImportProgressManager.CONCURR_LIMIT) {
            this._concurrency = value
        }
    }

    /**
     * Start execution
     */
    async start() {
        // Iterate through data chunks from the state manager
        for await (const chunkData of stateManager.getItems()) {
            try {
                // Run the chunk processor on the current data, passing in needed state
                await this.processChunk(chunkData)
            } catch (err) {
                // If execution cancelled break Iterator processing
                if (err.cancelled) {
                    break
                }
                console.error(err)
            }
        }
    }

    stop() {
        if (typeof this.token.cancel === 'function') {
            // Create error with `cancelled` bool property to distinguish in callers
            const err = new Error('Stopping progress')
            err.cancelled = true

            // Run token's cancal callback to stop running async logic
            this.token.cancel(err)
        }
    }

    /**
     * @param {any} chunkData The chunk of import item state that is currently being processed
     */
    async processChunk({ chunk, chunkKey }) {
        for (const [encodedUrl, importItem] of Object.entries(chunk)) {
            let status, url, error
            try {
                const res = await processImportItem(importItem, this.token)
                status = res.status
            } catch (err) {
                // Throw execution was cancelled, throw error up the stack
                if (err.cancelled) {
                    throw err
                }
                error = err.message
            } finally {
                // Send item data + outcome status down to UI (and error if present)
                this.afterItemCb({
                    type: importItem.type,
                    url,
                    status,
                    error,
                })
                await stateManager.removeItem(chunkKey, encodedUrl)
            }
        }
    }
}

export default ImportProgressManager
