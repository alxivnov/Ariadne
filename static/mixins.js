export default {
	link(tweet, entity) {
		if (!tweet)
			return;

		if (entity == 'hashtag' || entity == '#') {
			return `https://x.com/hashtag/${tweet}`;
		} else if (entity == 'user' || entity == '@') {
			return `https://x.com/${typeof (tweet) == 'string' ? tweet : tweet.core.user_results?.result.legacy.screen_name}`;
		} else {
			let retweet = tweet.legacy.retweeted_status_result?.result;
			return `https://x.com/${(retweet || tweet).core.user_results?.result.legacy.screen_name}/status/${(retweet || tweet).rest_id}`;
		}
	},
	number(number) {
		return number > 1000000
			? Number(number / 1000000).toFixed(1) + 'M'
			: number > 1000
				? Number(number / 1000).toFixed(1) + 'K'
				: number;
	}
};
