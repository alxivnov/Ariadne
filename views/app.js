import { markRaw, toRaw } from 'vue';

import store from '../static/store.js';
import tweet from './tweet.js';


export default {
	template: /*html*/`
<h5 class="position-fixed top-0 end-0 mt-4 me-4 z-3">
	<span class="badge rounded-pill" :class="tweets.length ? 'bg-primary' : 'bg-secondary'">
		{{ unread }}
	</span>
</h5>

<div class="btn-group dropup position-fixed bottom-0 end-0 mb-4 me-4 z-3">
	<button type="button" class="btn btn-primary dropdown-toggle" data-bs-toggle="dropdown" aria-expanded="false">
		<span class="me-1">
			{{ lists[listId]?.name || lists[listId]?.id_str || lists[listId]?.rest_id || 'Lists' }}
		</span>
	</button>
	<ul class="dropdown-menu">
		<li>
			<a class="dropdown-item" href="./static/store.js" target="_blank">
				./static/store.js
			</a>
		</li>
		<li>
			<a class="dropdown-item" href="./twitter/api.js" target="_blank">
				./twitter/api.js
			</a>
		</li>
		<li>
			<a class="dropdown-item" href="./views/app.js" target="_blank">
				./views/app.js
			</a>
		</li>
		<li>
			<a class="dropdown-item" href="./views/tweet.js" target="_blank">
				./views/tweet.js
			</a>
		</li>
		<li>
			<hr class="dropdown-divider">
		</li>

		<li>
			<a class="dropdown-item" href="#">
				TODO: Following
			</a>
		</li>
		<li>
			<a class="dropdown-item" href="#">
				TODO: For you
			</a>
		</li>
		<li>
			<hr class="dropdown-divider">
		</li>
		<li v-for="key in Object.keys(lists)" :key="key">
			<a class="dropdown-item" href="#" @click.prevent="select(lists[key])" :class="{ active: key == listId }" :aria-current="key == listId">
				{{ lists[key]?.name || lists[key]?.id_str || lists[key]?.rest_id }}
			</a>
		</li>
		<li v-if="Object.keys(lists).length">
			<hr class="dropdown-divider">
		</li>
		<li>
			<a class="dropdown-item" href="#">
				TODO: Search
			</a>
		</li>
		<li>
			<a class="dropdown-item" href="#">
				TODO: Profile
			</a>
		</li>
	</ul>
</div>

<div class="vstack gap-1 my-2 mx-auto" style="max-width: 598px;">
	<div v-for="(tweet, index) in tweets" :key="tweet.rest_id">
		<hr v-if="index" class="mt-1 mb-2">
		<div :id="tweet.rest_id" class="find">
			<tweet :tweet="tweet" :index="index"></tweet>
		</div>
	</div>
</div>
	`,
	components: {
		tweet
	},
	data() {
		return {
			lists: {},
			tweets: [],

			unread: 0,

			listId: store.getListId(),
		};
	},
	mounted() {
		store.openDB()
			.then((db) => {
				return store.loadLists().then((lists) => {
					this.lists = lists;

					if (!this.listId)
						this.listId = Object.keys(lists)[0];

					let list = lists[this.listId];
					let tweetId = store.getTweetId(this.listId);
					return store.loadTweets(list, tweetId).then((tweets) => {
						this.tweets = markRaw(tweets);

						this.$nextTick(() => {
							this.scroll(tweetId);

							window.onscroll = this.onScroll;
						});
					});
				});
			})
			.catch(err => console.log('error', err));
	},
	methods: {
		select(list) {
			let rawList = toRaw(list);

			this.listId = store.setListId(rawList);
			this.tweets = [];

			store.loadTweets(rawList).then(tweets => {
				this.tweets = tweets;

				this.$nextTick(() => {
					this.scroll(store.getTweetId(rawList));
				});
			});
		},
		reload() {
			location.reload();
		},
		scroll(tweetId) {
			let el = document.getElementById(tweetId);
			if (!el)
				return;

			// el.scrollIntoView(false);

			let offset = 0; // document.getElementsByClassName('navbar')[0].getBoundingClientRect().bottom;
			window.scrollTo({ top: el.getBoundingClientRect().top - offset - 8 });
		},
		onScroll() {
			let offset = 0; // document.getElementsByClassName('navbar')[0].getBoundingClientRect().bottom;

			let tweets = document.getElementsByClassName('find');
			let i = Array.from(tweets).findIndex(el => el.getBoundingClientRect().top > offset);

			this.unread = Math.max(0, i);

			if (i < 0)
				return;

			store.setTweetId(this.listId, tweets[i].id);
		}
	}
};
