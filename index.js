const { Plugin } = require('powercord/entities')
const { getModule, React } = require('powercord/webpack')
const { inject, uninject } = require('powercord/injector')

const FluxUtils = getModule(['useStateFromStores'], false)

const Settings = require('./components/Settings')

module.exports = class UnreadCountBadges extends Plugin {
    async startPlugin() {
        this.loadStylesheet('style.css')
        powercord.api.settings.registerSettings(this.entityID, {
            category: this.entityID,
            label: 'Unread Count Badges',
            render: Settings
        })

        const { NumberBadge } = await getModule(['NumberBadge'])
        const UnreadsStore = await getModule(['getUnreadCount'])
        const UnreadBadge = ({ channelId }) => {
            const unreadCount = FluxUtils.useStateFromStores([ UnreadsStore ], () => UnreadsStore.getUnreadCount(channelId))
            if (!unreadCount) return null
            return React.createElement(NumberBadge, { count: unreadCount, color: 'var(--background-accent)', className: 'ucbadge' })
        }

        const ChannelItem = await getModule(m => m.default && m.default.displayName === 'ChannelItem')
        inject('ucbadges', ChannelItem, 'default', args => {
            if (this.settings.get('ignoreMutedChannels') && args[0].muted) return args

            if (!args[0].children.find(c => c?.type?.name === 'UnreadBadge'))
                args[0].children.push(React.createElement(UnreadBadge, { channelId: args[0].channel.id }))

            return args
        }, true)
        ChannelItem.default.displayName = 'ChannelItem'
    }

    pluginWillUnload() {
        powercord.api.settings.unregisterSettings(this.entityID)
        uninject('ucbadges')
    }
}
