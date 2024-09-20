const fs = require('node:fs');


const ASC = (...args) => (a, b) => {
	return args.reduce((comp, arg) => {
		return comp === 0
			? a[arg] > b[arg]
				? 1
				: a[arg] < b[arg]
					? -1
					: 0
			: comp;
	}, 0);// || a > b ? 1 : a < b ? -1 : 0;
};

const APIS = [
	'HomeLatestTimeline',
	'HomeTimeline',
	'ListLatestTweetsTimeline',
	'CombinedLists',
	'SearchTimeline',
	'TweetDetail',
	'UserByScreenName',
	'UserTweets',

	'ListsManagementPageTimeline',
	'TweetDetail.quote',
	'TweetDetail.retweet',
	'UserMedia',
];
const VARS = [
	'listId',
	'userId',
	'screen_name',
	'focalTweetId',
	'rawQuery',
];


APIS.forEach((name, i) => {
	// console.log(name)
	let text = fs.readFileSync(`../reqs/${name}.har`, 'utf8');
	let json = JSON.parse(text);
	let from = json?.log?.entries?.[0];//.find(entry => entry.request.url.includes(`/${name.split('.')[0]}`));
	let req = from?.request;
	let res = from?.response;
	let to = {
		method: req.method,
		url: req.url.split('?')[0],
		cookies: req.cookies.sort(ASC('name')).reduce((prev, curr) => ({ ...prev, [curr.name]: curr.value }), {}),
		headers: req.headers.sort(ASC('name')).reduce((prev, curr) => ({ ...prev, [curr.name]: curr.value }), {}),
		query: req.queryString.sort(ASC('name')).reduce((prev, curr) => {
			let json = JSON.parse(curr.value);

			return {
				...prev,
				[curr.name]: Object.keys(json)
					.sort()
					.reduce((prev, curr) => ({ ...prev, [curr]: json[curr] }), {}),
			};
		}, {}),
		data: req.postData && JSON.parse(req.postData.text),
	};

	let placeholders = {};
	let auth = {
		auth_token: to.cookies.auth_token,
		csrf_token: to.cookies.ct0 || to.headers['x-csrf-token'],
		bearer_token: to.headers['Authorization'].substring(7),
		cookies: to.cookies,
		headers: {
			'Authorization': to.headers['Authorization'],
			'x-client-transaction-id': to.headers['x-client-transaction-id'],
			'x-csrf-token': to.headers['x-csrf-token'],
		},
	};
	delete to.cookies;
	to.headers['Accept-Language'] = 'en';
	to.headers['Authorization'] = 'Bearer #{bearer_token}';
	to.headers['Cookie'] = 'auth_token=#{auth_token}; ct0=#{csrf_token}';
	to.headers['x-client-transaction-id'] = '#{}';
	to.headers['x-csrf-token'] = '#{csrf_token}';
	VARS.filter(variable => to.query.variables?.[variable]).forEach((variable) => {
		let placeholder = `#{${variable}}`;

		placeholders[variable] = to.query.variables[variable];
		if (to.query.variables.count)
			placeholders.count = to.query.variables.count;
		if (to.query.variables.cursor)
			placeholders.cursor = to.query.variables.cursor;

		to.headers['Referer'] = to.headers['Referer'].replace(to.query.variables[variable], placeholder);
		to.query.variables[variable] = placeholder;
	});
	to.headers['Referer'] = to.headers['Referer'].replace(/https:\/\/x\.com\/(?:\w+)((?:$|\/status|\/lists).*)/, 'https://x.com/#{screen_name}$1');
	if (to.query?.variables?.controller_data)
		to.query.variables.controller_data = '#{}';
	if (to.data?.variables?.seenTweetIds)
		to.data.variables.seenTweetIds = [];
	if (to.data?.queryId)
		to.data.queryId = '#{}';

	fs.writeFileSync(`./api/${name}.json`, JSON.stringify(to, undefined, 4));
	fs.writeFileSync(`../auth/${name}.json`, JSON.stringify(auth, undefined, 4));
	fs.writeFileSync(`../data/${name}.json`, JSON.stringify(JSON.parse(res.content.text), undefined, 4));
	if (i === 0) {
		fs.writeFileSync('./.auth.json', JSON.stringify({
			auth_token: auth.auth_token,
			csrf_token: auth.csrf_token,
			bearer_token: auth.bearer_token,
		}, undefined, 4))
	}

	console.log(
		i,
		name,
		to.url,
		// to.headers['Referer'],
		placeholders
	);
});
