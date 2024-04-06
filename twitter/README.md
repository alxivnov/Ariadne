# API

| UI				| API							| Method	| Variables				| Query					|
| ----------------- | ----------------------------- | --------- | --------------------- | --------------------- |
| List				| ListLatestTweetsTimeline		| GET		| listId, count			| ?listId=				|
| Lists				| ListsManagementPageTimeline	| GET		| count					| ?user_name=			|
| Home / Following	| HomeLatestTimeline			| GET		| count, cursor			|						|
| Home / For you	| HomeTimeline					| POST		|						|						|
| Profile			| UserTweets					| GET		| userId, count, cursor	| ?userId=				|
| User				| UserByScreenName				| GET		| screen_name			| ?screen_name=			|
| Search			| SearchTimeline				| GET		| rawQuery, count		| ?rawQuery=			|
| Tweet				| TweetDetail					| GET		| focalTweetId			| ?focalTweetId=		|

```shell
# Bun/Node
docker run \
	--log-driver local \
	--name ariadne-node \
	--network=host \
	--volume ~/Documents/ariadne:/usr/src/app \
	--workdir /usr/src/app \
	--detach \
	--interactive \
	--tty \
	node:20.12.0-alpine

# Install Bun
wget -O - "https://raw.githubusercontent.com/alxivnov/Bunpine/main/install.sh"
# Generate APIs from ../reqs/*.har files
bun run --watch api.js
# Test APIs
bun test --watch

# PHP
docker run \
	--log-driver local \
	--name ariadne-php \
	--publish=9999:8000 \
	--volume ~/Documents/ariadne:/usr/src/app \
	--workdir /usr/src/app \
	--detach \
	--interactive \
	--tty \
	php:8.3.4-alpine \
	php -S 0.0.0.0:8000
```
