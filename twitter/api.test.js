const fs = require('fs');


// const features = {
// 	c9s_tweet_anatomy_moderator_badge_enabled: true,
// 	communities_web_enable_tweet_community_results_fetch: true,
// 	creator_subscriptions_tweet_preview_api_enabled: true,
// 	freedom_of_speech_not_reach_fetch_enabled: true,
// 	graphql_is_translatable_rweb_tweet_is_translatable_enabled: true,
// 	longform_notetweets_consumption_enabled: true,
// 	longform_notetweets_inline_media_enabled: true,
// 	longform_notetweets_rich_text_read_enabled: true,
// 	responsive_web_edit_tweet_api_enabled: true,
// 	responsive_web_enhance_cards_enabled: false,
// 	responsive_web_graphql_exclude_directive_enabled: true,
// 	responsive_web_graphql_skip_user_profile_image_extensions_enabled: false,
// 	responsive_web_graphql_timeline_navigation_enabled: true,
// 	responsive_web_twitter_article_tweet_consumption_enabled: true,
// 	rweb_tipjar_consumption_enabled: false,
// 	rweb_video_timestamps_enabled: true,
// 	standardized_nudges_misinfo: true,
// 	tweet_awards_web_tipping_enabled: false,
// 	tweet_with_visibility_results_prefer_gql_limited_actions_policy_enabled: true,
// 	tweetypie_unmention_optimization_enabled: true,
// 	verified_phone_label_enabled: false,
// 	view_counts_everywhere_api_enabled: true,
// };
const twitter = (api, variables, auth) => {
	let text = fs.readFileSync(`./api/${api}.json`, 'utf8');
	let json = JSON.parse(text);

	// json.query.features = {
	// 	...json.query.features,
	// 	...features,
	// }
	json.query.variables = {
		...json.query.variables,
		...variables,
	};

	if (auth) {
		json.cookies = {
			...json.cookies,
			...auth.cookies,
		};
		json.headers = {
			...json.headers,
			...auth.headers,
		};
		if (auth.auth_token) {
			json.cookies.auth_token = auth.auth_token;
		}
		if (auth.csrf_token) {
			json.cookies.ct0 = auth.csrf_token;
			json.headers['x-csrf-token'] = auth.csrf_token;
		}
		if (auth.bearer_token) {
			json.headers['Authorization'] = `Bearer ${auth.bearer_token}`;
		}
	}

	json.headers.Cookie = Object.keys(json.cookies).map(key => `${key}=${json.cookies[key]}`).join(';')
	let query = ['variables', 'features'].reduce((prev, curr, i) => {
		let val = json[curr] || json.query && json.query[curr];
		return val ? prev + (i ? '&' : '?') + curr + '=' + encodeURIComponent(JSON.stringify(val)) : prev;
	}, '');
	let url = json.url
		? `${json.url}${query}`
		: `${json.scheme}://${json.authority}${json.path}${query}`;
	let opt = {
		method: json.method,
		headers: json.headers,
	};

	// https://developer.mozilla.org/en-US/docs/Glossary/Forbidden_header_name

	// console.log(url, opt);
	// return Promise.resolve({ data: url });
	return typeof (axios) == 'function'
		? axios(url, { ...opt, data: json.data }).then(res => res.data)
		: fetch(url, { ...opt, body: json.data && JSON.stringify(json.data) }).then(res => res.json());
};


const tests = {
	HomeLatestTimeline: {},
	HomeTimeline: {},
	ListLatestTweetsTimeline: {
		listId: '1242796219627421708',
		count: 1,
	},
	CombinedLists: {
		userId: '44196397',
		count: 1,
	},
	SearchTimeline: {
		rawQuery: 'elonmusk',
		count: 1,
	},
	TweetDetail: {
		focalTweetId: '1775526635749417258',
	},
	UserByScreenName: {
		screen_name: "elonmusk",
	},
	UserTweets: {
		userId: "44196397",
		count: 20,
	},
	'TweetDetail.quote': {
		focalTweetId: "1775645554569310321",
	},
	'TweetDetail.retweet': {
		focalTweetId: "1774248070445973516",
	},
	UserMedia: {
		userId: "44196397",
		count: 20,
	},
};
let auth = JSON.parse(fs.readFileSync('./.auth.json', 'utf8'));
describe('Twitter', () => {
	Object.keys(tests).forEach((name) => {
		let api = name.split('.')[0];
		test(name, (done) => {
			twitter(api, tests[name], auth)
				.then((json) => {
					done(json.errors && json.errors[0]);
				})
				.catch((err) => {
					done(err);
				});
		});
	});
});
