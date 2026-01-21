<?php
function http($method, $url, $body = null, $token = null) {
    $ch = curl_init();
    $headers = ['Accept: application/json'];
    if ($body !== null) {
        $json = json_encode($body);
        $headers[] = 'Content-Type: application/json';
        curl_setopt($ch, CURLOPT_POSTFIELDS, $json);
    }
    if ($token) {
        $headers[] = 'Authorization: Bearer ' . $token;
    }
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_VERBOSE, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
    curl_setopt($ch, CURLOPT_HEADER, true);
    $resp = curl_exec($ch);
    if($resp === false){
        $err = curl_error($ch);
        curl_close($ch);
        return ['code'=>0,'header'=>'','body'=>'CURL ERROR: '.$err];
    }
    $info = curl_getinfo($ch);
    $headerSize = $info['header_size'] ?? 0;
    $header = substr($resp, 0, $headerSize);
    $body = substr($resp, $headerSize);
    curl_close($ch);
    return ['code' => $info['http_code'], 'header' => $header, 'body' => $body];
}

$base = 'http://127.0.0.1:8000/api';
echo "Registering user A...\n";
$r1 = http('POST', $base . '/register', ['name' => 'clientTestA', 'email' => 'clientA@example.com', 'password' => 'password']);
echo "A code: {$r1['code']}\nBody: {$r1['body']}\n\n";

echo "Registering user B...\n";
$r2 = http('POST', $base . '/register', ['name' => 'clientTestB', 'email' => 'clientB@example.com', 'password' => 'password']);
echo "B code: {$r2['code']}\nBody: {$r2['body']}\n\n";

$j1 = json_decode($r1['body'], true);
$j2 = json_decode($r2['body'], true);
$token = $j1['token'] ?? null;
$idB = $j2['user']['id'] ?? null;
if (!$token || !$idB) {
    echo "Missing token or user id; aborting.\n";
    exit(1);
}

echo "Sending friend request from A to B (id={$idB})...\n";
$sent = http('POST', $base . '/friends/request', ['recipient_id' => $idB], $token);
echo "Request code: {$sent['code']}\nBody: {$sent['body']}\n\n";

echo "Done.\n";
