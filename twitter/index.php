<?php
	// https://developer.twitter.com/en/docs/authentication/oauth-2-0

	header('Content-Type: application/json');
	header('Access-Control-Allow-Origin: *');

	if (array_key_exists('test', $_GET)) {
		print(file_get_contents('../data/data.json'));

		exit();
	}

	// header('Content-Encoding: gzip, deflate, br');

	if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
		exit();
	}


	if (array_key_exists('$api', $_GET)) {
		$api = $_GET['$api'];
	} else {
		$api = 'HomeLatestTimeline';
	}
	$file = file_get_contents('./api/'.$api.'.json');
	$json = json_decode($file, true);


	$auth = json_decode(file_get_contents('./.auth.json'), true);
	$json['cookies'] = array_merge(
		array_key_exists('cookies', $json) ? $json['cookies'] : array(),
		array_key_exists('cookies', $auth) ? $auth['cookies'] : array()
	);
	$json['headers'] = array_merge(
		array_key_exists('headers', $json) ? $json['headers'] : array(),
		array_key_exists('headers', $auth) ? $auth['headers'] : array()
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


	function variables($var) {
		return substr($var, 0, 1) != '$';
	}
	$variables = array_filter($_GET, 'variables', ARRAY_FILTER_USE_KEY);
	$json['query']['variables'] = array_merge(
		array_key_exists('variables', $json['query']) ? $json['query']['variables'] : array(),
		$variables
	);


	if (array_key_exists('cookies', $json)) {
		function cookie_line($key, $val) {
			return $key.'='.urlencode($val);
		}
		$cookie = implode('; ', array_map('cookie_line', array_keys($json['cookies']), array_values($json['cookies'])));
		$json['headers']['Cookie'] = $cookie;
	}
	function header_line($key, $val) {
		return $key.': '.$val;
	};
	$header = array_map('header_line', array_keys($json['headers']), array_values($json['headers']));
	$query = '';
	$variables = array_key_exists('variables', $json) ? $json['variables'] : $json['query']['variables'];
	if ($variables) {
		$query .= (strlen($query) ? '&' : '?').'variables='.urlencode(json_encode($variables));
	}
	$features = array_key_exists('features', $json) ? $json['features'] : $json['query']['features'];
	if ($features) {
		$query .= (strlen($query) ? '&' : '?').'features='.urlencode(json_encode($features));
	}
	$url = (array_key_exists('url', $json) ? $json['url'] : $json['scheme'].'://'.$json['authority'].$json['path']).$query;

	// return print($_SERVER['REQUEST_URI'].PHP_EOL.$url.PHP_EOL.implode(PHP_EOL, $header));

	// try {
		$curl = curl_init();
		curl_setopt($curl, CURLOPT_URL, $url);
		curl_setopt($curl, CURLOPT_HTTPHEADER, $header);
		curl_setopt($curl, CURLOPT_HEADER, true);
		curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);

		// $curl_log = fopen('curl.txt', 'w');
		// curl_setopt($curl, CURLOPT_STDERR, $curl_log);
		// curl_setopt($curl, CURLOPT_VERBOSE, true);

		$res = curl_exec($curl);
		$header_size = curl_getinfo($curl, CURLINFO_HEADER_SIZE);
		curl_close($curl);
	// } catch (Exception $ex) {
	// 	return print($ex);
	// }

	// fclose($curl_log);
	// if (!$res) {
	// 	return print(file_get_contents('curl.txt'));
	// }

	$res_headers = substr($res, 0, $header_size);
	$res_body = substr($res, $header_size);

	foreach (explode(PHP_EOL, $res_headers) as $header)
		// Safari compatibility
		if (strpos($header, 'HTTP/2') === 0)
			header(str_replace('HTTP/2', 'HTTP/1.1', $header), true, 200);
		// else if (strpos($header, 'content-encoding') !== false)
		else if (strpos($header, 'content-disposition: attachment') === false)
			header($header, false);
	print($res_body);
?>
