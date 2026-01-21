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
echo "Registering A...\n";
$rA = http('POST', $base . '/register', ['name'=>'A','email'=>'a' . time() . '@example.com','password'=>'password']);
echo $rA['body'] . "\n";
echo "Registering B...\n";
$rB = http('POST', $base . '/register', ['name'=>'B','email'=>'b' . time() . '@example.com','password'=>'password']);
echo $rB['body'] . "\n";

$jA = json_decode($rA['body'], true);
$jB = json_decode($rB['body'], true);
$tokenA = $jA['token'] ?? null; $tokenB = $jB['token'] ?? null;
$idA = $jA['user']['id'] ?? null; $idB = $jB['user']['id'] ?? null;
if(!$tokenA || !$tokenB){ echo "Failed to create users\n"; exit(1); }

echo "B -> A: send request\n";
$sent = http('POST', $base . '/friends/request', ['recipient_id' => $idA], $tokenB);
echo "Sent: " . $sent['body'] . "\n";
$sr = json_decode($sent['body'], true);
$reqId = $sr['id'] ?? null;
if(!$reqId){ echo "No request id; aborting\n"; exit(1); }

echo "A accepts request id=$reqId\n";
$acc = http('POST', $base . '/friends/requests/' . $reqId . '/accept', null, $tokenA);
echo "Accept response: code={$acc['code']} body={$acc['body']}\n";

echo "Done\n";
