const { Plugin } = require('powercord/entities')
const { findInReactTree } = require('powercord/util')
const { getModule, getModuleByDisplayName, FluxDispatcher, React } = require('powercord/webpack')
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
        const icm = await getModule(['isChannelMuted'])
        const ChannelItem = await getModuleByDisplayName('ChannelItem')

        const _this = this

        inject('ucbadges', ChannelItem.prototype, 'renderIcons', function (_, res) {
            if (!res || (_this.settings.get('ignoreMutedChannels') &&
                icm.isChannelMuted(this.props.channel.guild_id, this.props.channel.id))) return res

            const uc = getUnreadCount(this.props.channel.id)
            if (uc) {
                const children = findInReactTree(res, c => Array.isArray(c))
                if (!children) return res
                const badge = children.find(c => c && c.props.className == 'ucbadge')

                if (!badge) children.push(React.createElement(
                    UpdateableBadge, { className: 'ucbadge', channelId: this.props.channel.id, getUnreadCount, _this }
                ))
            }

            return res
        })

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
