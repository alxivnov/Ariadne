import db from '../static/db.js';
import twitter from '../twitter/index.js';

const store = {
	db: null,

	lists: {},
	tweets: [],

	ids: [],

	openDB(version, schema) {
		let close = this.db
			? this.db.end()
			: Promise.resolve();
		return close.then(() => db('Ariadne', version, { ...schema, lists: 'id_str' })).then(db => {
			console.log('db', db);

			this.db = db;

			return db;
		});
	},
	loadLists() {
		return twitter.lists().then((arr) => {
			let lists = arr
				.sort((a, b) => b.pinning - a.pinning)
				.reduce((prev, curr) => ({ ...prev, [curr.id_str || curr.rest_id]: curr }), {});

				return this.db.get('lists').then((arr) => {
					arr.forEach(el => {
						if (lists[el.id_str || el.rest_id]) {
							lists[el.id_str || el.rest_id].top = el.top;
							lists[el.id_str || el.rest_id].bottom = el.bottom;
						}
					});
					this.db.put('lists', ...Object.values(lists).map(el => ({ ...el, })));

					let schema = Object.keys(lists)
						.map(listId => `list-${listId}`)
						.filter(storeName => !this.db.objectStoreNames.contains(storeName))
						.reduce((schema, storeName) => ({ ...schema, [storeName]: 'rest_id' }), {});
					if (Object.keys(schema).length)
						this.openDB(this.db.version + 1, schema);

					this.lists = lists;

					return lists;
				});
		});
	},
	loadTweets(list, tweetId) {
		if (!list)
			return Promise.resolve([]);

		let listId = (list.id_str || list.rest_id);
		let topCursor = list.top;

		console.log('loadTweets', list, tweetId);
		let load = topCursor
			? this.db.get(`list-${listId}`).then(cached => {
				console.log('old tweets', cached?.length);

				return twitter.allTweets(listId, topCursor).then(({ tweets, cursors }) => {
					console.log('new tweets', tweets?.length, cursors);

					if (tweets.length && cursors.top) {
						this.db.put(`list-${listId}`, ...tweets);
						this.db.put('lists', { ...list, top: cursors.top });
					}

					let old = Math.max(0, cached.length - (1000 - tweets.length));
					if (tweetId) {
						let index = cached.findIndex((tweet) => tweet.rest_id == tweetId) - 100;
						console.log('slice', tweetId, index, old, cached.length);
						if (index > -1)
							old = index;
					}
					this.db.delete(`list-${listId}`, ...cached.splice(0, old));
					return [...tweets, ...cached.reverse()];
				});
			})
			: twitter.allTweets(listId, {}).then(({ tweets, cursors }) => {
				console.log('all tweets', tweets?.length, cursors);

				if (tweets.length && cursors.top) {
					this.db.put(`list-${listId}`, ...tweets);
					this.db.put('lists', { ...list, top: cursors.top, bottom: cursors.bottom });
				}

				return tweets;
			});
		return load.then((tweets) => {
			console.log('tweets', tweets?.length);

			this.tweets = tweets || [];

			this.ids = tweets.flatMap(tweet => {
				let quote = tweet.quoted_status_result?.result.tweet			// TweetWithVisibilityResults
					|| tweet.quoted_status_result?.result						// quoted
					|| tweet.legacy.retweeted_status_result?.result;

				return [tweet, tweet.card, quote, quote?.card]
					.map(el => el ? el.rest_id : null);
			});

			return tweets;
		});
	},

	listId: undefined,
	tweetId: undefined,

	getListId() {
		this.listId = new URLSearchParams(window.location.search).get('list') || window.localStorage.getItem('list_id');
		return this.listId;
	},
	getTweetId(list) {
		let listId = list && (list.id_str || list.rest_id) || list;

		this.tweetId = new URLSearchParams(window.location.search).get('tweet') || window.localStorage.getItem(`tweet_id_${listId}`) || window.localStorage.getItem(`last_id_${listId}`);
		return this.tweetId;
	},
	setListId(list) {
		let listId = list && (list.id_str || list.rest_id) || list;

		if (this.listId == listId)
			return listId;

		window.localStorage.setItem('list_id', listId);

		let params = { list: listId };
		let test = window.location.search.includes('test') ? '?test&' : '?';
		window.history.replaceState(params, '', `./${test}${new URLSearchParams(params)}`);

		this.listId = listId;

		return listId;
	},
	setTweetId(list, tweet) {
		let listId = list?.id_str || list?.rest_id || list;
		let tweetId = tweet?.rest_id || tweet;

		if (this.tweetId == tweetId)
			return tweetId;

		window.localStorage.setItem(`tweet_id_${listId}`, tweetId);
		window.localStorage.setItem(`last_id_${listId}`, tweetId);

		let params = { list: listId, tweet: tweetId };
		let test = window.location.search.includes('test') ? '?test&' : '?';
		window.history.replaceState(params, '', `./${test}${new URLSearchParams(params)}`);

		this.tweetId = tweetId;

		return tweetId;
	},
};

export default store;
