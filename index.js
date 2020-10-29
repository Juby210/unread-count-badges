const { Plugin } = require('powercord/entities')
const { getModule, FluxDispatcher, React } = require('powercord/webpack')
const { inject, uninject } = require('powercord/injector')

const Settings = require('./components/Settings')
const UpdateableBadge = require('./components/UpdateableBadge')

module.exports = class UnreadCountBadges extends Plugin {
    badges = []
    lastGuildId = ""

    async startPlugin() {
        this.loadStylesheet('style.css')
        powercord.api.settings.registerSettings(this.entityID, {
            category: this.entityID,
            label: 'Unread Count Badges',
            render: Settings
        })

        const { getUnreadCount } = await getModule(['getUnreadCount'])
        const ChannelItem = await getModule(m => m.default && m.default.displayName == 'ChannelItem')
        inject('ucbadges', ChannelItem, 'default', args => {
            if (this.settings.get('ignoreMutedChannels') && args[0].muted) return args

            const uc = getUnreadCount(args[0].channel.id)
            if (uc && !args[0].children.find(c => c?.props?.className == 'ucbadge')) args[0].children.push(React.createElement(
                UpdateableBadge, { className: 'ucbadge', channelId: args[0].channel.id, getUnreadCount, _this: this }
            ))

            return args
        }, true)
        ChannelItem.default.displayName = 'ChannelItem'

        FluxDispatcher.subscribe('MESSAGE_CREATE', this.updateBadges = data => {
            if (data.message.guild_id == this.lastGuildId)
                this.badges.filter(b => b.props.channelId == data.message.channel_id).forEach(b => b.forceUpdate())
        })
        FluxDispatcher.subscribe('CHANNEL_SELECT', this.onSwitchChannel = data => {
            if (this.lastGuildId != data.guildId) {
                this.badges = []
                this.lastGuildId = data.guildId
            }
        })
    }

    pluginWillUnload() {
        powercord.api.settings.unregisterSettings(this.entityID)
        uninject('ucbadges')
        if (this.updateBadges) FluxDispatcher.unsubscribe('MESSAGE_CREATE', this.updateBadges)
        if (this.onSwitchChannel) FluxDispatcher.unsubscribe('CHANNEL_SELECT', this.onSwitchChannel)
    }
}
