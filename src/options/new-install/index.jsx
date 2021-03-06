import React from 'react'

import analytics from 'src/analytics'
import localStyles from './styles.css'

const trackWelcomeChoice = action => () =>
    analytics.trackEvent({
        category: 'Welcome page selection',
        action,
    })

const NewInstall = () => (
    <div className={localStyles.content}>
        <img className={localStyles.logobig} src="/img/worldbrain-logo.png" />
        <div className={localStyles.messageContainer}>
            <div className={localStyles.message}>
                <p>
                    With a 15s delay, Memex <strong>locally stores</strong> the
                    content of the websites you visit, so you can search for
                    every word in it.
                </p>
                <p>
                    <strong>STEP 1: </strong>Visit some websites or{' '}
                    <a
                        className={localStyles.link}
                        href="/options/options.html#/import"
                    >
                        import your existing browser history/bookmarks
                    </a>.
                    <br />
                    <strong>STEP 2: </strong>Search by typing 'w' + 'space or
                    tab' + 'your keywords' into the address bar of the browser.
                </p>
            </div>
        </div>
        <div className={localStyles.btnBar}>
            <a
                className={localStyles.btnLink}
                onClick={trackWelcomeChoice('Tutorial video')}
                type="button"
                href="https://worldbrain.io/tutorial"
                target="_blank"
            >
                <strong>Watch</strong> 90s Tutorial Video
            </a>

            <a
                className={localStyles.btnLink}
                onClick={trackWelcomeChoice('Tutorial page')}
                type="button"
                href="/options/options.html#/tutorial"
            >
                <strong>Read</strong> Step-By Step Tutorial
            </a>
        </div>
        <p>
            {' '}
            <a
                className={localStyles.link}
                onClick={trackWelcomeChoice('Go browsing')}
                href="https://worldbrain.io/"
            >
                Or close this window and start browsing the web
            </a>
        </p>
        <img style={{ width: '60%' }} src="/img/how_to_search.png" />
    </div>
)

export default NewInstall
