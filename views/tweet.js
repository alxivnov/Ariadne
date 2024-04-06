import store from '../static/store.js';
import mixins from '../static/mixins.js';
import tweetHeader from './tweet-header.js';

const WIDTH = Math.min(window.innerWidth - 24, 598);
const a = (href, content) => `<a href="${href}" target="_blank">${content}</a>`;

export default {
	template: /* html */`
<div class="-card-header mb-1">
	<tweet-header :tweet="tweet" :muted="muted(tweet.rest_id)"></tweet-header>
</div>
<div v-if="show(tweet) && !tweet.legacy.retweeted_status_result" class="-card-body">
	<p class="-card-text mb-2" :class="{ 'text-muted': muted(tweet.rest_id) }" v-html="html(tweet)"></p>
	<!--<a class="-card-link" :href="link(tweet, 'status')" target="_blank">Open</a>
	<a class="-card-link" href="#">Bookmark</a>-->
</div>

<!--<ul v-if="quote" class="list-group list-group-flush">
	<li class="list-group-item">-->
	<div v-if="quote" class="mb-1">
		<tweet-header :tweet="quote" :muted="muted(quote.rest_id)" :retweeted="!!tweet.legacy.retweeted_status_result" :quoted="!!tweet.quoted_status_result"></tweet-header>
	</div>
	<!--</li>
</ul>-->
<div v-if="quote && show(quote)" class="-card-body">
	<p class="-card-text mb-2" :class="{ 'text-muted': muted(quote.rest_id) }" v-html="html(quote)"></p>
	<!--<a v-if="!tweet.legacy.retweeted_status_result" class="-card-link" :href="link(quote)" target="_blank">Open</a>-->
</div>

<div v-if="media && media.length > 0" :id="'carousel-' + tweet.rest_id" class="carousel slide mb-2">
	<div v-if="media && media.length > 1" class="carousel-indicators">
		<button v-for="(photo, i) in media" :key="i" type="button" :data-bs-target="'#carousel-' + tweet.rest_id" :data-bs-slide-to="i" :aria-label="'Slide ' + (i + 1)" :class="{ active: !i }" :aria-current="!i"></button>
	</div>
	<div class="carousel-inner">
		<div v-for="(photo, i) in media" :key="i" class="carousel-item" :class="{ active: !i }">
			<!--<img src="..." class="d-block w-100" alt="...">-->
			<video v-if="video(photo)" class="card-img-bottom rounded-3" :poster="photo.media_url_https" controls :height="maxHeight()" style="object-fit: contain;">
				<source v-for="(s, j) in video(photo)" :key="j" :src="s.url" :type="s.content_type">
			</video>
			<img v-else-if="photo" class="card-img-bottom rounded-3" :src="photo.media_url_https" :alt="photo.type" :height="maxHeight()" style="object-fit: contain;">

			<a class="position-absolute bottom-0 end-0 z-3" :href="mediaDownload(photo)" :download="mediaDownload(photo).split('?')[0].split('/').slice(-1)[0]" target="_blank">
				<i class="bi bi-cloud-download"></i>
			</a>
		</div>
	</div>
	<button v-if="media && media.length > 1" class="carousel-control-prev" type="button" :data-bs-target="'#carousel-' + tweet.rest_id" data-bs-slide="prev">
		<span class="carousel-control-prev-icon" aria-hidden="true"></span>
		<span class="visually-hidden">Previous</span>
	</button>
	<button v-if="media && media.length > 1" class="carousel-control-next" type="button" :data-bs-target="'#carousel-' + tweet.rest_id" data-bs-slide="next">
		<span class="carousel-control-next-icon" aria-hidden="true"></span>
		<span class="visually-hidden">Next</span>
	</button>
</div>

<div v-if="poll.length" class="-card-body pt-0 mb-2">
	<div v-for="(choice, i) in poll" :key="i" class="progress" :class="{ 'mt-2': i }" role="progressbar" :aria-label="choice.label" :aria-valuenow="choice.count" aria-valuemin="0" :aria-valuemax="pollTotal">
		<div class="progress-bar" :style="{ width: Math.round(choice.count / pollTotal * 100) + '%' }">
			<span class="text-start ms-1">
				{{ choice.label }}
			</span>
		</div>
		<span class="-text-end ms-auto me-1">
			{{ choice.count }}
		</span>
	</div>
</div>
<div v-if="card && !poll.length && (card.player_url || card.thumbnail_image_large?.url || card.player_image_large?.url)" :href="card.card_url" target="_blank" class="mb-2">
	<iframe v-if="card.player_url" class="card-img-bottom rounded-3" :src="card.player_url" _width="560" :height="height(card.player_image_large)" :title="card.title" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>
	<img v-else :src="card.thumbnail_image_large?.url || card.player_image_large?.url" class="card-img-bottom rounded-3" :alt="card.type" :height="height(card.thumbnail_image_large || card.player_image_large)">
</div>
<div v-if="card && !poll.length" class="-card-body">
	<h6 class="-card-title mb-1">
		<a :class="muted(card.rest_id) ? 'text-body' : 'text-light'" :href="card.card_url" target="_blank">{{ cardTitle }}</a>
	</h6>
	<p class="-card-text mb-1" :class="{ 'text-muted': muted(card.rest_id) }">{{ card.description }}</p>
	<p class="-card-text mb-1"><small class="text-muted">{{ card.vanity_url }}</small></p>
</div>

<div class="-card-footer">
	<a class="-card-subtitle hstack text-decoration-none text-muted" :href="link(tweet)" target="_blank">
		<span :class="{ 'text-body fw-bold': tweet.legacy.retweeted_status_result }">
			<i class="bi bi-repeat me-2"></i>
			<small>{{ number(tweet.legacy.retweet_count) }}</small>
		</span>
		<span class="ms-auto" :class="{ 'text-body fw-bold': tweet.legacy.in_reply_to_status_id_str }">
			<i class="bi bi-chat me-2"></i>
			<small>{{ number(tweet.legacy.reply_count) }}</small>
		</span>
		<span class="ms-auto" :class="{ 'text-body fw-bold': tweet.quoted_status_result }">
			<i class="bi bi-quote me-2"></i>
			<small>{{ number(tweet.legacy.quote_count) }}</small>
		</span>
		<span class="ms-auto">
			<i class="bi bi-heart me-2"></i>
			<small>{{ number(tweet.legacy.favorite_count) }}</small>
		</span>
		<span class="ms-auto">
			<i class="bi bi-bar-chart me-2"></i>
			<small>{{ number(tweet.views.count || 0) }}</small>
		</span>
	</a>
</div>
	`,
	components: {
		tweetHeader
	},
	props: {
		tweet: Object,
		index: Number
	},
	computed: {
		quote() {
			return this.tweet.quoted_status_result?.result.tweet		// TweetWithVisibilityResults
				|| this.tweet.quoted_status_result?.result				// quoted
				|| this.tweet.legacy.retweeted_status_result?.result;	// retweeted
		},

		card() {
			let card = this.tweet.card || this.quote?.card;
			return card?.legacy.binding_values.reduce((prev, curr) => ({ ...prev, [curr.key]: curr.value[`${curr.value.type.toLowerCase()}_value`] }), { rest_id: card?.rest_id });
		},
		cardTitle() {
			if (this.card?.title) {
				const calcTitle = (tweet) => {
					let text = this.text(tweet, true);
					if (text.startsWith(this.card.title.substring(0, this.card.title.length - 3))) {
						return text
							.replace(this.card.card_url, '')
							.trim();
					}
				};

				return this.card.title.endsWith('...')
					? calcTitle(this.tweet) || this.quote && calcTitle(this.quote) || this.card.title
					: this.card.title;
			} else {
				return this.card?.card_url;
			}
		},
		poll() {
			let card = this.card || {};
			return Object.keys(card)
				.filter(key => key.startsWith('choice') && key.endsWith('_label'))
				.sort()
				.map((key, i) => ({ label: card[`choice${i + 1}_label`], count: card[`choice${i + 1}_count`] }));
		},
		pollTotal() {
			return this.poll?.reduce((prev, curr) => prev + parseInt(curr.count), 0);
		},
		media() {
			return this.tweet.legacy.extended_entities?.media || this.quote?.legacy.extended_entities?.media;
		}
	},
	methods: {
		...mixins,

		muted(rest_id) {
			return store.ids.indexOf(rest_id, (this.index + 1) * 4) > -1;
		},
		mediaDownload(photo) {
			let video = this.video(photo);
			let url = video
				? [...video].sort((a, b) => (a.bitrate || Number.MAX_SAFE_INTEGER) - (b.bitrate || Number.MAX_SAFE_INTEGER))[0].url
				: photo.media_url_https;
			return url;
		},
		video(media) {
			return media.video_info?.variants;
		},
		html(tweet) {
			// if (!tweet)
			// 	return;

			let entities = tweet.legacy.entities;
			var html = this.text(tweet);
			html = [...entities.user_mentions, ...entities.hashtags]
				.sort((a, b) => b.indices[0] - a.indices[0])
//				.reverse()
				.reduce((prev, curr) => {
					let user = curr.screen_name ? '@' : '#';
					let text = curr.screen_name || curr.text;
					let href = this.link(text, user);
					let link = a(href, user + text);
					let index = prev.indexOf(user, curr.indices[0]);
					return prev.slice(0, index) + link + prev.slice(curr.indices[1] + index - curr.indices[0]);
				}, html);
			html = entities.media?.reduce((prev, curr) => {
				let link = a(curr.expanded_url, curr.display_url);
				return prev.replace(curr.url, link);
			}, html) || html;
			html = entities.urls.reduce((prev, curr) => {
				let link = a(curr.expanded_url, curr.display_url);
				return prev.replace(curr.url, link);
			}, html);
			return html.replace(/\n/g, '<p class="m-0">');
//			html = entities.user_mentions.reduce((prev, curr) => {
//				let link = a(this.link(curr.screen_name, 'user'), `@${curr.screen_name}`);
//				return prev.replace(`@${curr.screen_name}`, link);
//			}, html);
//			html = entities.hashtags.reduce((prev, curr) => {
//				let link = a(this.link(curr.text, 'hashtag'), `#${curr.text}`);
//				return prev.replace(`#${curr.text}`, link);
//			}, html);
//			return html;
//			let el = new DOMParser().parseFromString(tweet.legacy.full_text, "text/html").documentElement;
//			twemoji.parse(el);
//			return el.textContent;
		},
		text(tweet, amp) {
			// if (!tweet)
			// 	return;

			var text = tweet.legacy.full_text;
			if (amp)
				text = text.replace(/&amp;/g, '&');
			return text;
		},
		height(size) {
			return size && size.height && size.width
				? size.height / size.width * Math.min(window.innerWidth - 2 * 8, WIDTH)
				: 0;
		},
		maxHeight() {
			return this.media ? Math.min(WIDTH, Math.max(...this.media.map(photo => photo.original_info).map(this.height))) : 0;
		},
		show(tweet) {
			var text = this.text(tweet, true)
			if (this.card) {
				text = text
					.replace(this.cardTitle, '')
					.replace(this.card.title, '')
					.replace(this.card.card_url, '')
					.trim();

				return !!text.length;
			}
			return true;
		}
	}
};
