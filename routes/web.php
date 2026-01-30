<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('login');
});
Route::get('/news', function () {
    return view('home');
});
Route::get('/messenger', function () {
    return view('messenger');
});
Route::get('/messenger-new', function () {
    return view('messenger_new');
});
Route::get('/profile', function () {
    return view('profile');
});
Route::get('/verification', function () {
    return view('verification');
});
Route::get('/verification/admin', function () {
    return view('verification-admin');
});
Route::get('/support', function () {
    return view('verification');
});
Route::get('/lecture/{id}', function ($id) {
    return view('lecture', ['lectureId' => $id]);
});
