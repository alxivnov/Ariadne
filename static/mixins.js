export default {
	link(tweet, entity) {
		if (!tweet)
			return;

		return entity == 'hashtag' || entity == '#'
			? `https://twitter.com/hashtag/${tweet}`
			: entity == 'user' || entity == '@'
				? `https://twitter.com/${typeof (tweet) == 'string' ? tweet : tweet.core.user_results?.result.legacy.screen_name}`
				: `https://twitter.com/${tweet.core.user_results?.result.legacy.screen_name}/status/${tweet.rest_id}`;
	},
	number(number) {
		return number > 1000000
			? Number(number / 1000000).toFixed(1) + 'M'
			: number > 1000
				? Number(number / 1000).toFixed(1) + 'K'
				: number;
	}
};
