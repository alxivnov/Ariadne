import moment from 'https://cdn.jsdelivr.net/npm/moment@2.29.4/+esm';

import mixins from '../static/mixins.js';

export default {
	template: /*html*/`
		<span class="hstack">
			<i class="bi bi-repeat me-2" v-if="retweeted"></i>
			<i class="bi bi-quote me-2" v-if="quoted"></i>
			<img class="rounded-circle me-2" style="height: 48px" :src="tweet.core.user_results?.result.legacy.profile_image_url_https" :alt="tweet.core.user_results?.result.legacy.name">
			<div class="vstack -w-100">
				<h6 class="mt-1 hstack">
					<a :class="muted ? 'text-body' : 'text-light'" class="me-1" :href="link(tweet, 'user')" target="_blank">{{ tweet.core.user_results?.result.legacy.name }}</a>
					<i class="bi bi-patch-check-fill" v-if="tweet.core.user_results?.result.is_blue_verified || tweet.core.user_results?.result.legacy.verified"></i>
					<!--<small class="text-muted">
						@{{ tweet.core.user_results?.result.legacy.screen_name }}
					</small>-->
					<small class="ms-auto text-muted" @click="json">
						{{ number(tweet.core.user_results?.result.legacy.friends_count) }} / {{ number(tweet.core.user_results?.result.legacy.followers_count) }}
					</small>
				</h6>
				<p class="-card-subtitle mb-1"><small class="text-muted">{{ time(tweet) }}</small></p>
			</div>
		</span>
	`,
	props: {
		tweet: Object,
		retweeted: Boolean,
		quoted: Boolean,
		muted: Boolean
	},
	methods: {
		...mixins,

		time(tweet) {
			// if (!tweet)
			// 	return;

			let date = new Date(tweet.legacy.created_at);
			return moment(date).format('DD.MM.YYYY HH:mm');
		},
		json() {
			navigator.clipboard.writeText(JSON.stringify(this.tweet, undefined, '	'));
		}
	}
};
