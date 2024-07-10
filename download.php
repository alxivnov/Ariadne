<?php

function array_key_value($key, $array, $default = NULL) {
	return array_key_exists($key, $array)
		? $array[$key]
		: $default;
}
function cookie_line($key, $val) {
	return $key.'='.urlencode($val);
}
function header_line($key, $val) {
	return $key.': '.$val;
};



$searches = [
	'Bitcoin',
	'Ethereum',
	'ONDO'
];

foreach ($searches as $search) {
	$file = file_get_contents('./twitter/api/SearchTimeline.json');
	$json = json_decode($file, true);


	$auth = json_decode(file_get_contents('./twitter/.auth.json'), true);
	$json['cookies'] = array_merge(
		array_key_value('cookies', $json, array()),
		array_key_value('cookies', $auth, array())
	);
	$json['headers'] = array_merge(
		array_key_value('headers', $json, array()),
		array_key_value('headers', $auth, array())
	);
	if (array_key_exists('auth_token', $auth)) {
		$json['cookies']['auth_token'] = $auth['auth_token'];
	}
	if (array_key_exists('csrf_token', $auth)) {
		$json['cookies']['ct0'] = $auth['csrf_token'];
		$json['headers']['x-csrf-token'] = $auth['csrf_token'];
	}
	if (array_key_exists('bearer_token', $auth)) {
		$json['headers']['Authorization'] = 'Bearer '.$auth['bearer_token'];
	}



	$json['headers']['Accept-Encoding'] = 'json';
	$variables = [
		'rawQuery' => $search
	];
	$json['query']['variables'] = array_merge(
		array_key_value('variables', $json['query'], array()),
		$variables
	);


	if (array_key_exists('cookies', $json)) {
		$cookie = implode('; ', array_map('cookie_line', array_keys($json['cookies']), array_values($json['cookies'])));
		$json['headers']['Cookie'] = $cookie;
	}
	$header = array_map('header_line', array_keys($json['headers']), array_values($json['headers']));
	$query = '';
	$variables = array_key_exists('variables', $json) ? $json['variables'] : $json['query']['variables'];
	if ($variables) {
		$query .= (strlen($query) ? '&' : '?').'variables='.urlencode(json_encode($variables));
	}
	$features = array_key_value('features', $json, array_key_value('features', $json['query']));
	if ($features) {
		$query .= (strlen($query) ? '&' : '?').'features='.urlencode(json_encode($features));
	}
	$url = array_key_exists('url', $json)
		? $json['url']
		: $json['scheme'].'://'.$json['authority'].$json['path'];
	$url = $url.$query;

	// return print($request_uri.PHP_EOL.$url.PHP_EOL.implode(PHP_EOL, $header));

	// try {
		$curl = curl_init();
		curl_setopt($curl, CURLOPT_URL, $url);
		curl_setopt($curl, CURLOPT_HTTPHEADER, $header);
		// curl_setopt($curl, CURLOPT_HEADER, true);
		// curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);

		date_default_timezone_set('UTC');

		$file = fopen('./search/'.$search.'-'.date('ymd-His-T').'.json', 'w');
		curl_setopt($curl, CURLOPT_FILE, $file);
		// curl_setopt($curl, CURLOPT_VERBOSE, true);

		$res = curl_exec($curl);
		$header_size = curl_getinfo($curl, CURLINFO_HEADER_SIZE);
		curl_close($curl);
	// } catch (Exception $ex) {
	// 	return print($ex);
	// }

	fclose($file);
	// if (!$res) {
	// 	return print(file_get_contents('curl.txt'));
	// }

	print($search);
}

?>