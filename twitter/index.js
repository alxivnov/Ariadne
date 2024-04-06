const TWEET_LOAD_DEPTH = 500;
const TEST = () => {
	let query = new URLSearchParams(window.location.search);
	return query.has('test') ? query.get('test') || '' : undefined;
};
const FETCH = (api, variables) => {
	let test = TEST();

	let url = test
		? `./data/test/${test || 'test'}.json`
		: `./twitter?${new URLSearchParams(JSON.parse(JSON.stringify({
			$api: api,
			...variables,
		})))}`;
	return fetch(url)
		.catch((err) => {
			console.error(url, err);
		})
		.then((res) => {
			if (!res.ok)
				return;

			let mime = res.headers.get('Content-Type') || '';
			if (mime.startsWith('application/x-www-form-urlencoded') || mime.startsWith('multipart/form-data'))
				return res.formData();
			else if (mime.startsWith('application/json'))
				return res.json();
			else if (mime.startsWith('text/'))
				return res.text();
			else
				return res.body;
		});
};

export default {
	// http://localhost:9999/twitter/?$api=ListsManagementPageTimeline
	lists() {
		return FETCH('ListsManagementPageTimeline')
			.then((json) => {
				let entries = json?.data?.viewer?.list_management_timeline?.timeline?.instructions?.find(el => el.type == 'TimelineAddEntries')?.entries || [];
				let items = entries?.find(el => el.entryId == 'owned-subscribed-list-module-0')?.content?.items;
				let lists = items.map(el => el.item.itemContent.list);
				// console.log('ListsManagementPageTimeline', lists, items, entries);
				return lists;
			});

	},
	// http://localhost:9999/twitter/?$api=ListLatestTweetsTimeline&listId=1242796219627421708
	tweets(listId, cursor = undefined) {
		// console.log('fetch', url)
		return FETCH('ListLatestTweetsTimeline', { listId, cursor, count: 100 })
			.then(json => {
				console.log('ListLatestTweetsTimeline', json);

				let entries = json?.data?.list?.tweets_timeline?.timeline?.instructions?.find(el => el.type == 'TimelineAddEntries')?.entries || [];
				let tweets = entries
					.map(el => el.content?.itemContent?.tweet_results?.result)
					.filter(el => el && el.rest_id);
				let cursors = entries
					.filter(el => el.content?.__typename == 'TimelineTimelineCursor')
					.reduce((prev, curr) => ({ ...prev, [curr.content.cursorType.toLowerCase()]: curr.content.value }), {});

				console.log('ListsManagementPageTimeline', tweets, cursors);

				return {
					tweets,
					cursors: TEST() ? {} : cursors
				};
			});
	},
	allTweets(list, prev) {
		let all = typeof (prev) == 'object';

		return this.tweets(list, all ? prev?.cursors?.bottom : prev).then(({ tweets, cursors }) => {
			if (all) {
				let curr = {
					tweets: [
						...(prev?.tweets || []),
						...tweets
					],
					cursors: {
						top: prev?.cursors?.top || cursors.top,
						bottom: cursors.bottom
					}
				};
				return (tweets.length && cursors.bottom && curr.tweets.length < TWEET_LOAD_DEPTH)
					? this.allTweets(list, curr)
					: curr;
			} else {
				return {
					tweets,
					cursors
				};
			}
		});
	}
};
